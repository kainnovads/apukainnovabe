import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PurchaseOrderItem from '#models/purchase_order_item'
import PurchaseOrder from '#models/purchase_order'
import StockIn from '#models/stock_in'
import StockInDetail from '#models/stock_in_detail'

export default class PurchaseItemsController {
  public async updateStatusPartial({ params, request, response, auth }: HttpContext) {

    // Fungsi generateNo untuk no_si
    function generateNo() {
      // Silakan sesuaikan dengan kebutuhan, contoh sederhana:
      return 'SI-' + Date.now()
    }

    try {
      const itemId = params.id
      const { receivedQty } = request.only(['receivedQty'])

      const purchaseOrderItem = await PurchaseOrderItem.query()
        .where('id', itemId)
        .firstOrFail()

      // Validasi: receivedQty tidak boleh melebihi quantity dan tidak boleh negatif
      if (receivedQty !== undefined) {
        const numReceivedQty = Number(receivedQty)
        if (numReceivedQty < 0) {
          return response.badRequest({
            message: `Kuantitas diterima tidak boleh negatif.`
          })
        }
        if (numReceivedQty > purchaseOrderItem.quantity) {
          return response.badRequest({
            message: `Kuantitas diterima (${receivedQty}) tidak boleh melebihi kuantitas yang dipesan (${purchaseOrderItem.quantity}).`
          })
        }
      }

      // Update received_qty item PO
      if (receivedQty !== undefined) {
        purchaseOrderItem.receivedQty = Number(receivedQty)
      }

      // Auto-set statusPartial berdasarkan receivedQty
      const currentReceivedQty = Number(receivedQty) || 0
      purchaseOrderItem.statusPartial = currentReceivedQty > 0

      await purchaseOrderItem.save()

      // Ambil Purchase Order terkait beserta semua itemnya
      const purchaseOrder = await PurchaseOrder.query()
        .where('id', purchaseOrderItem.purchaseOrderId)
        .preload('purchaseOrderItems')
        .firstOrFail()

      // ✅ PERBAIKAN: Update item yang baru saja diubah di memori untuk logika status yang tepat
      const updatedItem = purchaseOrder.purchaseOrderItems.find(item => item.id === purchaseOrderItem.id)
      if (updatedItem) {
        updatedItem.statusPartial = purchaseOrderItem.statusPartial
        updatedItem.receivedQty = purchaseOrderItem.receivedQty
      }

      // Jika receivedQty > 0, maka statusPartial otomatis true, insert ke stock_in dan stock_in_detail
      if (purchaseOrderItem.statusPartial === true) {
        // Ambil item yang sedang diubah saat ini
        const item = purchaseOrderItem

        // 1. Buat StockIn baru untuk setiap item yang statusPartial == true
        const stockIn = await StockIn.create({
          noSi: generateNo(),
          purchaseOrderId: purchaseOrder.id,
          warehouseId: item.warehouseId ?? undefined,
          postedBy: auth.user?.id,
          date: DateTime.now().toJSDate(),
          status: 'draft',
          description: `Penerimaan otomatis dari PO #${purchaseOrder.noPo || purchaseOrder.id} - Item: ${item.id}`,
        })

        // 2. Insert StockInDetail untuk item ini
        await StockInDetail.create({
          stockInId: stockIn.id,
          productId: item.productId,
          quantity: Number(item.receivedQty ?? item.quantity),
          description: item.description || '',
        })
      }

      // Logika untuk menentukan status Purchase Order berdasarkan receivedQty, bukan statusPartial
      let newPurchaseOrderStatus = purchaseOrder.status

      // Cek apakah ada item yang memiliki receivedQty > 0
      const hasAnyItemWithReceivedQty = purchaseOrder.purchaseOrderItems.some(item => 
        Number(item.receivedQty || 0) > 0
      )
      
      // Cek apakah semua item sudah received penuh (receivedQty = quantity)
      const allItemsFullyReceived = purchaseOrder.purchaseOrderItems.every(item => 
        Number(item.receivedQty || 0) === Number(item.quantity || 0)
      )

      // Debug logging
      console.log('🔍 Status Debug:', {
        currentStatus: purchaseOrder.status,
        hasAnyItemWithReceivedQty,
        allItemsFullyReceived,
        approvedBy: purchaseOrder.approvedBy,
        approvedAt: purchaseOrder.approvedAt,
        itemsStatus: purchaseOrder.purchaseOrderItems.map(item => ({
          id: item.id,
          statusPartial: item.statusPartial,
          receivedQty: item.receivedQty,
          quantity: item.quantity,
          isFullyReceived: Number(item.receivedQty || 0) === Number(item.quantity || 0)
        }))
      })

      if (allItemsFullyReceived && hasAnyItemWithReceivedQty) {
        // Jika semua item sudah received penuh
        newPurchaseOrderStatus = 'received'
      } else if (hasAnyItemWithReceivedQty) {
        // Jika ada item yang sudah sebagian received (partial)
        newPurchaseOrderStatus = 'partial'
      } else {
        // Jika tidak ada item yang received, kembali ke status sebelumnya
        // Prioritas: approved -> draft
        if (purchaseOrder.approvedBy && purchaseOrder.approvedAt) {
          newPurchaseOrderStatus = 'approved'
        } else {
          newPurchaseOrderStatus = 'draft'
        }
      }

      console.log('🔍 Status Update:', {
        oldStatus: purchaseOrder.status,
        newStatus: newPurchaseOrderStatus,
        willUpdate: purchaseOrder.status !== newPurchaseOrderStatus
      })

      // Update status Purchase Order jika ada perubahan
      if (purchaseOrder.status !== newPurchaseOrderStatus) {
        purchaseOrder.status = newPurchaseOrderStatus

        // Jika status baru adalah 'received' dan semua item sudah received penuh
        if (newPurchaseOrderStatus === 'received' && allItemsFullyReceived) {
          // Set received_at ke tanggal sekarang
          purchaseOrder.receivedAt = new Date()

          // Set received_by ke user yang sedang login
          if (auth && auth.user && auth.user.id) {
            purchaseOrder.receivedBy = auth.user.id
          }

          // Pastikan semua item memiliki statusPartial = true jika receivedQty penuh
          for (const item of purchaseOrder.purchaseOrderItems) {
            // Jika receivedQty = quantity, pastikan statusPartial = true
            if (Number(item.receivedQty || 0) === Number(item.quantity || 0)) {
                item.statusPartial = true
                await item.save()
            }
          }
        }
        
        // Simpan perubahan purchase order
        await purchaseOrder.save()
      }

      return response.ok({
        message: 'Status partial purchase item dan Purchase Order berhasil diperbarui',
        data: {
          purchaseOrderItem: purchaseOrderItem.serialize(),
          purchaseOrder: purchaseOrder.serialize(),
        }
      })
    } catch (error) {
      console.error('Gagal memperbarui status item PO atau PO:', error)
      return response.badRequest({ message: 'Gagal memperbarui status', error: error.message })
    }
  }
}
