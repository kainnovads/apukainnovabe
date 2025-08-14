import type { HttpContext } from '@adonisjs/core/http'
import PurchaseOrder from '#models/purchase_order'
import PurchaseOrderItem from '#models/purchase_order_item'
import StockIn from '#models/stock_in'
import StockInDetail from '#models/stock_in_detail'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class PurchaseItemsController {

    async updateStatusPartial({ params, request, response, auth }: HttpContext) {
        const trx = await db.transaction()

        try {
            // Ambil receivedQty dari request body
            const { receivedQty } = request.only(['receivedQty'])

            // Validasi receivedQty
            const parsedReceivedQty = Number(receivedQty)
            if (isNaN(parsedReceivedQty)) {
                await trx.rollback()
                return response.badRequest({
                    message: 'Received Qty harus berupa angka yang valid',
                    receivedValue: receivedQty
                })
            }

            if (parsedReceivedQty < 0) {
                await trx.rollback()
                return response.badRequest({
                    message: 'Received Qty tidak boleh negatif',
                    receivedValue: parsedReceivedQty
                })
            }

            // Ambil Purchase Order Item dengan data terkait
            const purchaseOrderItem = await PurchaseOrderItem.query({ client: trx })
                .where('id', params.id)
                .preload('product')
                .preload('purchaseOrder')
                .firstOrFail()

            // Validasi receivedQty tidak melebihi quantity yang dipesan
            if (parsedReceivedQty > purchaseOrderItem.quantity) {
                await trx.rollback()
                return response.badRequest({
                    message: `Received Qty (${parsedReceivedQty}) tidak boleh melebihi quantity yang dipesan (${purchaseOrderItem.quantity})`,
                    maxAllowed: purchaseOrderItem.quantity
                })
            }

            // Ambil Purchase Order untuk update status
            const purchaseOrder = await PurchaseOrder.query({ client: trx })
                .where('id', purchaseOrderItem.purchaseOrderId)
                .preload('purchaseOrderItems')
                .firstOrFail()

            // ✅ Validasi: Purchase Order yang sudah received tidak boleh diubah
            if (purchaseOrder.status === 'received') {
                await trx.rollback()
                return response.badRequest({
                    message: `Purchase Order sudah dalam status ${purchaseOrder.status.toUpperCase()} dan tidak dapat diubah lagi. Jika ada perubahan yang diperlukan, silakan buat Purchase Return.`,
                    currentStatus: purchaseOrder.status
                })
            }

            // Update receivedQty pada item
            const oldReceivedQty = Number(purchaseOrderItem.receivedQty || 0)
            purchaseOrderItem.receivedQty = parsedReceivedQty
            
            // ✅ PERBAIKAN: Update statusPartial berdasarkan receivedQty
            if (parsedReceivedQty === 0) {
                purchaseOrderItem.statusPartial = false // Belum ada yang diterima
            } else if (parsedReceivedQty >= purchaseOrderItem.quantity) {
                purchaseOrderItem.statusPartial = false // Sudah fully received
            } else {
                purchaseOrderItem.statusPartial = true // Partial received
            }

            await purchaseOrderItem.useTransaction(trx).save()

            // Fungsi untuk generate nomor Stock In
            function generateNo() {
                const now = new Date()
                const timestamp = now.getTime()
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
                return `SI-${timestamp}-${random}`
            }

            // ✅ LOGIKA BARU: Hanya buat Stock In jika receivedQty berubah (naik/turun)
            const item = purchaseOrderItem
            const currentReceivedQty = Number(item.receivedQty || 0)

            // Hitung selisih perubahan receivedQty
            const qtyDifference = currentReceivedQty - oldReceivedQty

            if (qtyDifference !== 0) {

                if (qtyDifference > 0) {
                    // ✅ RECEIVEDQTY BERTAMBAH: Buat Stock In baru untuk produk ini saja

                    // Buat 1 Stock In yang menampung semua perubahan untuk produk ini
                    const stockIn = await StockIn.create({
                        noSi: generateNo(),
                        purchaseOrderId: purchaseOrder.id,
                        warehouseId: item.warehouseId || 0,
                        postedBy: auth.user?.id,
                        date: DateTime.now().toJSDate(),
                        status: 'draft',
                        description: `Received ${qtyDifference} unit(s) for ${item.product?.name || 'Unknown Product'}`,
                    }, { client: trx })

                    // Buat 1 StockInDetail dengan quantity sesuai perubahan
                    await StockInDetail.create({
                        stockInId: stockIn.id,
                        productId: item.productId,
                        quantity: qtyDifference, // Quantity sesuai dengan perubahan receivedQty
                        description: `${item.description || ''} - Received ${qtyDifference} units (total: ${currentReceivedQty})`,
                    }, { client: trx })

                } else if (qtyDifference < 0) {
                    // ✅ RECEIVEDQTY BERKURANG: Hapus Stock In yang berlebihan (hanya yang masih draft)
                    const qtyToRemove = Math.abs(qtyDifference)

                    // Ambil Stock In terkait produk ini yang masih draft (LIFO)
                    const stockInsToUpdate = await StockIn.query({ client: trx })
                        .where('purchaseOrderId', purchaseOrder.id)
                        .whereHas('stockInDetails', (detailQuery) => {
                            detailQuery.where('productId', item.productId)
                        })
                        .where('status', 'draft')
                        .preload('stockInDetails', (detailQuery) => {
                            detailQuery.where('productId', item.productId)
                        })
                        .orderBy('createdAt', 'desc')

                    let remainingQtyToRemove = qtyToRemove

                    for (const stockIn of stockInsToUpdate) {
                        if (remainingQtyToRemove <= 0) break

                        for (const detail of stockIn.stockInDetails) {
                            if (detail.productId === item.productId && remainingQtyToRemove > 0) {
                                const currentDetailQty = Number(detail.quantity)
                                
                                if (currentDetailQty <= remainingQtyToRemove) {
                                    // Hapus detail ini sepenuhnya
                                    await detail.useTransaction(trx).delete()
                                    remainingQtyToRemove -= currentDetailQty
                                    
                                    // Cek apakah Stock In masih punya detail lain
                                    const remainingDetails = await StockInDetail.query({ client: trx })
                                        .where('stockInId', stockIn.id)
                                        .first()
                                    
                                    if (!remainingDetails) {
                                        // Hapus Stock In jika tidak ada detail lagi
                                        await stockIn.useTransaction(trx).delete()
                                    }
                                } else {
                                    // Kurangi quantity detail ini
                                    detail.quantity = currentDetailQty - remainingQtyToRemove
                                    await detail.useTransaction(trx).save()
                                    remainingQtyToRemove = 0
                                }
                            }
                        }
                    }
                }
            }

            // ✅ LOGIKA BARU: Reload Purchase Order items untuk mendapatkan data terbaru
            await purchaseOrder.load('purchaseOrderItems')
            const allItems = purchaseOrder.purchaseOrderItems
            
            const totalReceived = allItems.reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0)
            const totalOrdered = allItems.reduce((sum, item) => sum + item.quantity, 0)
            
            // ✅ PERBAIKAN: Cek apakah ada item yang memiliki partial status
            const hasPartialItems = allItems.some(item => {
                const receivedQty = Number(item.receivedQty || 0)
                const isPartial = receivedQty > 0 && receivedQty < item.quantity
                return isPartial
            })

            if (totalReceived === 0) {
                purchaseOrder.status = 'approved'
            } else if (totalReceived < totalOrdered || hasPartialItems) {
                // ✅ PERBAIKAN: Jika ada item partial ATAU total belum terpenuhi, status = partial
                purchaseOrder.status = 'partial'
            } else if (totalReceived >= totalOrdered && !hasPartialItems) {
                // ✅ PERBAIKAN: Hanya jadi received jika semua item fully received
                purchaseOrder.status = 'received'
                purchaseOrder.receivedAt = new Date()
                if (auth.user) {
                    purchaseOrder.receivedBy = auth.user.id
                }
            }

            await purchaseOrder.useTransaction(trx).save()

            await trx.commit()

            // Reload data untuk response
            await purchaseOrderItem.load('product')
            await purchaseOrder.load('purchaseOrderItems', (query) => {
                query.preload('product')
            })

            return response.ok({
                message: 'Status item Purchase Order berhasil diperbarui',
                data: {
                    purchaseOrderItem: purchaseOrderItem.serialize(),
                    purchaseOrder: purchaseOrder.serialize()
                }
            })

        } catch (error) {
            await trx.rollback()
            console.error('Error in updateStatusPartial:', error)

            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Purchase Order Item tidak ditemukan',
                    itemId: params.id
                })
            }

            return response.internalServerError({
                message: 'Gagal memperbarui status item Purchase Order',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        }
    }

    async receiveAllItems({ params, response, auth }: HttpContext) {
        const trx = await db.transaction()

        try {
            // Ambil Purchase Order dengan semua item-nya
            const purchaseOrder = await PurchaseOrder.query({ client: trx })
                .where('id', params.id)
                .preload('purchaseOrderItems', (itemQuery) => {
                    itemQuery.preload('product')
                })
                .firstOrFail()

            if (purchaseOrder.status == 'draft') {
                await trx.rollback()
                return response.badRequest({
                    message: 'Purchase Order harus dalam status approved atau partial untuk dapat menerima semua item',
                    currentStatus: purchaseOrder.status
                })
            }

            // ✅ Validasi: Purchase Order yang sudah received tidak perlu receive all lagi
            if (purchaseOrder.status === 'received') {
                await trx.rollback()
                return response.badRequest({
                    message: `Purchase Order sudah dalam status ${purchaseOrder.status.toUpperCase()}, semua item sudah diterima`,
                    currentStatus: purchaseOrder.status
                })
            }

            // Fungsi untuk generate nomor Stock In
            function generateNo() {
                const now = new Date()
                const timestamp = now.getTime()
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
                return `SI-${timestamp}-${random}`
            }

            let totalStockInsCreated = 0
            const productsWithPendingQty = []

            // Identifikasi item mana saja yang masih punya pending quantity
            for (const item of purchaseOrder.purchaseOrderItems) {
                const orderedQty = Number(item.quantity || 0)
                const currentReceivedQty = Number(item.receivedQty || 0)
                const pendingQty = orderedQty - currentReceivedQty

                if (pendingQty <= 0) {
                    continue
                }

                // Tambahkan ke list produk yang akan dibuat Stock In-nya
                productsWithPendingQty.push({
                    item: item,
                    pendingQty: pendingQty,
                    orderedQty: orderedQty
                })

                // Update receivedQty menjadi sama dengan quantity (fully received)
                item.receivedQty = orderedQty
                item.statusPartial = false // Sudah complete, karena receivedQty = quantity
                await item.useTransaction(trx).save()
            }

            // ✅ LOGIKA BARU: Buat 1 Stock In yang berisi semua produk yang ada pending quantity
            if (productsWithPendingQty.length > 0) {

                // Ambil warehouse dari item pertama (asumsi semua item dalam PO sama warehouse)
                const warehouseId = productsWithPendingQty[0].item.warehouseId || 0

                // Buat 1 Stock In untuk batch receive all
                const stockIn = await StockIn.create({
                    noSi: generateNo(),
                    purchaseOrderId: purchaseOrder.id,
                    warehouseId: warehouseId,
                    postedBy: auth.user?.id,
                    date: DateTime.now().toJSDate(),
                    status: 'draft',
                    description: `Receive All - ${productsWithPendingQty.length} products`,
                }, { client: trx })

                // Buat StockInDetail untuk setiap produk yang punya pending quantity
                for (const productData of productsWithPendingQty) {
                    await StockInDetail.create({
                        stockInId: stockIn.id,
                        productId: productData.item.productId,
                        quantity: productData.pendingQty, // Quantity sesuai dengan pending quantity
                        description: `Receive All - ${productData.pendingQty} units of ${productData.item.product?.name || 'Product'} (completing to ${productData.orderedQty})`,
                    }, { client: trx })
                }

                totalStockInsCreated = 1 // Hanya 1 Stock In yang dibuat
            }

            // ✅ LOGIKA BARU: Reload Purchase Order items dan update status
            await purchaseOrder.load('purchaseOrderItems')
            const allItems = purchaseOrder.purchaseOrderItems
            
            const totalReceived = allItems.reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0)
            const totalOrdered = allItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
            
            // ✅ PERBAIKAN: Cek apakah ada item yang memiliki partial status
            const hasPartialItems = allItems.some(item => {
                const receivedQty = Number(item.receivedQty || 0)
                return receivedQty > 0 && receivedQty < item.quantity
            })

            if (totalReceived >= totalOrdered && !hasPartialItems) {
                purchaseOrder.status = 'received'
                purchaseOrder.receivedAt = new Date()
                if (auth.user) {
                    purchaseOrder.receivedBy = auth.user.id
                }
            } else {
                purchaseOrder.status = 'partial'
            }

            await purchaseOrder.useTransaction(trx).save()

            await trx.commit()

            // Reload data untuk response
            await purchaseOrder.load('purchaseOrderItems', (query) => {
                query.preload('product')
            })

            return response.ok({
                message: totalStockInsCreated > 0 
                    ? `Berhasil menerima semua item. ${totalStockInsCreated} Stock In telah dibuat untuk ${productsWithPendingQty.length} produk.`
                    : `Semua item sudah diterima sebelumnya. Tidak ada Stock In baru yang dibuat.`,
                data: {
                    purchaseOrder: purchaseOrder.serialize(),
                    totalStockInsCreated,
                    productsProcessed: productsWithPendingQty.length,
                    summary: {
                        totalOrdered,
                        totalReceived,
                        finalStatus: purchaseOrder.status
                    }
                }
            })

        } catch (error) {
            await trx.rollback()
            console.error('Error in receiveAllItems:', error)

            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Purchase Order tidak ditemukan',
                    purchaseOrderId: params.id
                })
            }

            return response.internalServerError({
                message: 'Gagal menerima semua item Purchase Order',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        }
    }
}
