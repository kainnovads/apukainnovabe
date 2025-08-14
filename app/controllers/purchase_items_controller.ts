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
            console.log(`🔍 Starting updateStatusPartial for Purchase Order Item: ${params.id}`)

            // Ambil receivedQty dari request body
            const { receivedQty } = request.only(['receivedQty'])
            console.log(`🔍 Received receivedQty: ${receivedQty}, type: ${typeof receivedQty}`)

            // Validasi receivedQty
            const parsedReceivedQty = Number(receivedQty)
            if (isNaN(parsedReceivedQty)) {
                console.log(`❌ Invalid receivedQty: ${receivedQty}`)
                await trx.rollback()
                return response.badRequest({
                    message: 'Received Qty harus berupa angka yang valid',
                    receivedValue: receivedQty
                })
            }

            if (parsedReceivedQty < 0) {
                console.log(`❌ Negative receivedQty: ${parsedReceivedQty}`)
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

            console.log(`🔍 Found Purchase Order Item: ${purchaseOrderItem.id}, current receivedQty: ${purchaseOrderItem.receivedQty}`)

            // Validasi receivedQty tidak melebihi quantity yang dipesan
            if (parsedReceivedQty > purchaseOrderItem.quantity) {
                console.log(`❌ ReceivedQty ${parsedReceivedQty} exceeds ordered quantity ${purchaseOrderItem.quantity}`)
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

            console.log(`🔍 Found Purchase Order: ${purchaseOrder.id}, status: ${purchaseOrder.status}`)

            // Update receivedQty pada item
            const oldReceivedQty = Number(purchaseOrderItem.receivedQty || 0)
            purchaseOrderItem.receivedQty = parsedReceivedQty
            purchaseOrderItem.statusPartial = parsedReceivedQty > 0 && parsedReceivedQty < purchaseOrderItem.quantity

            await purchaseOrderItem.useTransaction(trx).save()
            console.log(`✅ Updated Purchase Order Item receivedQty from ${oldReceivedQty} to ${parsedReceivedQty}`)

            // Fungsi untuk generate nomor Stock In
            function generateNo() {
                const now = new Date()
                const timestamp = now.getTime()
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
                return `SI-${timestamp}-${random}`
            }

            // ✅ ALUR BARU: Setiap increment receivedQty = 1 Stock In baru
            if (purchaseOrderItem.statusPartial === true && Number(purchaseOrderItem.receivedQty) > 0) {
                const item = purchaseOrderItem
                const currentReceivedQty = Number(item.receivedQty || 0)

                console.log(`🔍 Creating Stock In for receivedQty: ${currentReceivedQty}`)

                // 1. Cek berapa banyak Stock In yang sudah ada untuk PO + produk + warehouse ini
                const existingStockIns = await StockIn.query({ client: trx })
                    .where('purchaseOrderId', purchaseOrder.id)
                    .whereHas('stockInDetails', (detailQuery) => {
                        detailQuery.where('productId', item.productId)
                    })
                    .count('* as total')

                const totalExistingStockIns = existingStockIns[0]?.$extras.total || 0

                console.log(`🔍 Existing Stock Ins for product ${item.productId}: ${totalExistingStockIns}, receivedQty: ${currentReceivedQty}`)

                // 2. Hitung berapa banyak Stock In baru yang perlu dibuat
                const newStockInsNeeded = currentReceivedQty - totalExistingStockIns

                if (newStockInsNeeded > 0) {
                    console.log(`🔍 Creating ${newStockInsNeeded} new Stock In(s)`)

                    // ✅ BUAT STOCK IN INDIVIDUAL: 1 receivedQty = 1 Stock In
                    for (let i = 0; i < newStockInsNeeded; i++) {
                        // Buat Stock In baru untuk setiap unit
                        const stockIn = await StockIn.create({
                            noSi: generateNo(),
                            purchaseOrderId: purchaseOrder.id,
                            warehouseId: item.warehouseId || 0,
                            postedBy: auth.user?.id,
                            date: DateTime.now().toJSDate(),
                            status: 'draft',
                        }, { client: trx })

                        // Buat 1 StockInDetail untuk Stock In ini
                        await StockInDetail.create({
                            stockInId: stockIn.id,
                            productId: item.productId,
                            quantity: 1, // Selalu 1 unit per Stock In
                            description: `${item.description || ''} - Unit ${totalExistingStockIns + i + 1}`,
                        }, { client: trx })

                        console.log(`✅ Created StockIn ${stockIn.id} with 1 detail for unit ${totalExistingStockIns + i + 1}`)
                    }

                    console.log(`✅ Created ${newStockInsNeeded} Stock In(s) for receivedQty: ${currentReceivedQty}`)
                } else if (newStockInsNeeded < 0) {
                    // Jika receivedQty dikurangi, hapus Stock In yang berlebihan
                    const excessStockIns = Math.abs(newStockInsNeeded)
                    console.log(`🔍 Removing ${excessStockIns} excess Stock In(s)`)

                    // Ambil Stock In yang berlebihan (LIFO - last created first deleted)
                    const stockInsToRemove = await StockIn.query({ client: trx })
                        .where('purchaseOrderId', purchaseOrder.id)
                        .whereHas('stockInDetails', (detailQuery) => {
                            detailQuery.where('productId', item.productId)
                        })
                        .where('status', 'draft') // Hanya hapus yang masih draft
                        .orderBy('createdAt', 'desc')
                        .limit(excessStockIns)

                    for (const stockIn of stockInsToRemove) {
                        // Hapus StockInDetails terlebih dahulu
                        await StockInDetail.query({ client: trx })
                            .where('stockInId', stockIn.id)
                            .delete()

                        // Kemudian hapus StockIn
                        await stockIn.useTransaction(trx).delete()
                        console.log(`✅ Deleted StockIn: ${stockIn.id}`)
                    }

                    console.log(`✅ Removed ${excessStockIns} Stock In(s)`)
                }

                console.log(`✅ Stock In process completed for receivedQty: ${currentReceivedQty}`)
            } else if (Number(purchaseOrderItem.receivedQty || 0) === 0) {
                // ✅ Jika receivedQty = 0, hapus semua Stock In yang terkait untuk produk ini
                console.log(`🔍 ReceivedQty is 0, removing all Stock Ins for product ${purchaseOrderItem.productId}`)

                const stockInsToDelete = await StockIn.query({ client: trx })
                    .where('purchaseOrderId', purchaseOrder.id)
                    .whereHas('stockInDetails', (detailQuery) => {
                        detailQuery.where('productId', purchaseOrderItem.productId)
                    })
                    .where('status', 'draft') // Hanya hapus yang masih draft

                for (const stockIn of stockInsToDelete) {
                    // Hapus StockInDetails terlebih dahulu
                    await StockInDetail.query({ client: trx })
                        .where('stockInId', stockIn.id)
                        .delete()

                    // Kemudian hapus StockIn
                    await stockIn.useTransaction(trx).delete()
                    console.log(`✅ Deleted StockIn: ${stockIn.id}`)
                }

                console.log(`✅ Deleted all Stock Ins for product ${purchaseOrderItem.productId}`)
            }

            // Update status Purchase Order berdasarkan semua items
            const allItems = purchaseOrder.purchaseOrderItems
            const totalReceived = allItems.reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0)
            const totalOrdered = allItems.reduce((sum, item) => sum + item.quantity, 0)

            if (totalReceived === 0) {
                purchaseOrder.status = 'approved'
            } else if (totalReceived < totalOrdered) {
                purchaseOrder.status = 'partial'
            } else if (totalReceived >= totalOrdered) {
                purchaseOrder.status = 'received'
                purchaseOrder.receivedAt = new Date()
                if (auth.user) {
                    purchaseOrder.receivedBy = auth.user.id
                }
            }

            await purchaseOrder.useTransaction(trx).save()
            console.log(`✅ Updated Purchase Order status to: ${purchaseOrder.status}`)

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
            console.log(`🔍 Starting receiveAllItems for Purchase Order: ${params.id}`)

            // Ambil Purchase Order dengan semua item-nya
            const purchaseOrder = await PurchaseOrder.query({ client: trx })
                .where('id', params.id)
                .preload('purchaseOrderItems', (itemQuery) => {
                    itemQuery.preload('product')
                })
                .firstOrFail()

            console.log(`🔍 Found Purchase Order: ${purchaseOrder.id}, status: ${purchaseOrder.status}`)

            if (purchaseOrder.status == 'draft') {
                await trx.rollback()
                return response.badRequest({
                    message: 'Purchase Order harus dalam status approved atau partial untuk dapat menerima semua item',
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

            // Proses setiap item dalam Purchase Order
            for (const item of purchaseOrder.purchaseOrderItems) {
                const orderedQty = Number(item.quantity || 0)
                const currentReceivedQty = Number(item.receivedQty || 0)
                const pendingQty = orderedQty - currentReceivedQty

                console.log(`🔍 Processing item ${item.productId}: ordered=${orderedQty}, received=${currentReceivedQty}, pending=${pendingQty}`)

                if (pendingQty <= 0) {
                    console.log(`⏭️ Skipping item ${item.productId} - already fully received`)
                    continue
                }

                // Update receivedQty menjadi sama dengan quantity (fully received)
                item.receivedQty = orderedQty
                item.statusPartial = false // Sudah complete
                await item.useTransaction(trx).save()

                // Buat Stock In individual untuk setiap unit yang belum diterima
                for (let i = 0; i < pendingQty; i++) {
                    const stockIn = await StockIn.create({
                        noSi: generateNo(),
                        purchaseOrderId: purchaseOrder.id,
                        warehouseId: item.warehouseId || 0,
                        postedBy: auth.user?.id,
                        date: DateTime.now().toJSDate(),
                        status: 'draft',
                    }, { client: trx })

                    // Buat 1 StockInDetail untuk Stock In ini
                    await StockInDetail.create({
                        stockInId: stockIn.id,
                        productId: item.productId,
                        quantity: 1, // Selalu 1 unit per Stock In
                        description: `Batch receive all - Unit ${currentReceivedQty + i + 1} dari PO #${purchaseOrder.noPo}`,
                    }, { client: trx })

                    totalStockInsCreated++
                }

                console.log(`✅ Created ${pendingQty} Stock In(s) for product ${item.productId}`)
            }

            // Update status Purchase Order
            const allItems = purchaseOrder.purchaseOrderItems
            const totalReceived = allItems.reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0)
            const totalOrdered = allItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

            if (totalReceived >= totalOrdered) {
                purchaseOrder.status = 'received'
                purchaseOrder.receivedAt = new Date()
                if (auth.user) {
                    purchaseOrder.receivedBy = auth.user.id
                }
            } else {
                purchaseOrder.status = 'partial'
            }

            await purchaseOrder.useTransaction(trx).save()
            console.log(`✅ Updated Purchase Order status to: ${purchaseOrder.status}`)

            await trx.commit()

            // Reload data untuk response
            await purchaseOrder.load('purchaseOrderItems', (query) => {
                query.preload('product')
            })

            return response.ok({
                message: `Berhasil menerima semua item. ${totalStockInsCreated} Stock In telah dibuat.`,
                data: {
                    purchaseOrder: purchaseOrder.serialize(),
                    totalStockInsCreated,
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
