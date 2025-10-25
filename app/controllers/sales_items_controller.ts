import type { HttpContext } from '@adonisjs/core/http'
import SalesOrderItem from '#models/sales_order_item'
import SalesOrder from '#models/sales_order'
// import SalesInvoice from '#models/sales_invoice' // ✅ REMOVED: Tidak digunakan lagi
// import SalesInvoiceItem from '#models/sales_invoice_item' // ✅ REMOVED: Tidak digunakan lagi
import StockOut from '#models/stock_out'
import StockOutDetail from '#models/stock_out_detail'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class SalesItemsController {
    // ✅ REMOVED: Automatic invoice creation disabled
    // Invoice akan dibuat manual oleh user dari halaman Sales Invoice
    /*
    private async createInvoiceForNewDelivery(salesOrder: SalesOrder, newlyDeliveredItemId: string, newStatus: string) {
      // Method ini sudah tidak digunakan - invoice akan dibuat manual
      return null
    }
    */

    public async updateStatusPartial({ params, request, response, auth }: HttpContext) {

    // Fungsi generateNo untuk no_so
    function generateNo() {
      return 'SO-' + Date.now()
    }

    const trx = await db.transaction()

    try {
      const itemId = params.id
      const { deliveredQty } = request.only(['deliveredQty'])
      const parsedDeliveredQty = Number(deliveredQty || 0)

      const salesOrderItem = await SalesOrderItem.query({ client: trx })
        .where('id', itemId)
        .firstOrFail()

      // ✅ Load Sales Order dengan preloading untuk check status
      const salesOrder = await SalesOrder.query({ client: trx })
        .where('id', salesOrderItem.salesOrderId)
        .preload('salesOrderItems')
        .firstOrFail()

      // ✅ Validasi: Sales Order yang sudah delivered tidak boleh diubah
      if (salesOrder.status === 'delivered') {
        await trx.rollback()
        return response.badRequest({
          message: `Sales Order sudah dalam status ${salesOrder.status.toUpperCase()} dan tidak dapat diubah lagi. Jika ada perubahan yang diperlukan, silakan buat Sales Return.`,
          currentStatus: salesOrder.status
        })
      }

      // Validasi: deliveredQty tidak boleh melebihi quantity dan tidak boleh negatif
      if (deliveredQty !== undefined) {
        const numDeliveredQty = Number(deliveredQty)

        if (isNaN(numDeliveredQty)) {
          console.error('❌ ERROR: deliveredQty is not a valid number')
          return response.badRequest({
            message: `Kuantitas diterima harus berupa angka yang valid.`
          })
        }

        if (numDeliveredQty < 0) {
          console.error('❌ ERROR: deliveredQty is negative')
          return response.badRequest({
            message: `Kuantitas diterima tidak boleh negatif.`
          })
        }
        if (numDeliveredQty > salesOrderItem.quantity) {
          console.error('❌ ERROR: deliveredQty exceeds quantity')
          return response.badRequest({
            message: `Kuantitas diterima (${deliveredQty}) tidak boleh melebihi kuantitas yang dipesan (${salesOrderItem.quantity}).`
          })
        }
      } else {
        console.error('❌ ERROR: deliveredQty is undefined')
        return response.badRequest({
          message: `Parameter deliveredQty diperlukan.`
        })
      }

      // Update deliveredQty pada item
      const oldDeliveredQty = Number(salesOrderItem.deliveredQty || 0)
      salesOrderItem.deliveredQty = parsedDeliveredQty

      // ✅ PERBAIKAN: Set statusPartial berdasarkan logika yang benar
      // statusPartial = true jika deliveredQty > 0 dan < quantity (partial)
      // atau jika deliveredQty = quantity (fully delivered)
      const quantity = Number(salesOrderItem.quantity || 0)
      salesOrderItem.statusPartial = parsedDeliveredQty > 0 && parsedDeliveredQty <= quantity

      await salesOrderItem.useTransaction(trx).save()

      // ✅ UPDATE: Reload items untuk mendapatkan data terbaru

      // ✅ PERBAIKAN: Update item yang baru saja diubah di memori untuk logika status yang tepat
      const updatedItem = salesOrder.salesOrderItems.find(item => item.id === salesOrderItem.id)
      if (updatedItem) {
        updatedItem.statusPartial = salesOrderItem.statusPartial
        updatedItem.deliveredQty = salesOrderItem.deliveredQty
      }

      // ✅ PERBAIKAN STOCK OUT LOGIC: Setiap increment deliveredQty = 1 Stock Out baru terpisah
      const qtyDifference = parsedDeliveredQty - oldDeliveredQty

      if (qtyDifference > 0) {
        // ✅ BUAT STOCK OUT INDIVIDUAL: Setiap unit = 1 Stock Out terpisah

        for (let i = 0; i < qtyDifference; i++) {
          const stockOut = await StockOut.create({
            noSo: generateNo(),
            salesOrderId: salesOrder.id,
            warehouseId: salesOrderItem.warehouseId,
            postedBy: auth.user?.id,
            date: DateTime.now().toJSDate(),
            status: 'draft',
            description: `Stock Out from SO #${salesOrder.noSo || salesOrder.id} - Product: ${salesOrderItem.product?.name || salesOrderItem.productId} - Unit ${i + 1}`,
          }, { client: trx })

          // Buat 1 StockOutDetail untuk Stock Out ini dengan quantity = 1
          await StockOutDetail.create({
            stockOutId: stockOut.id,
            productId: salesOrderItem.productId,
            quantity: 1, // SELALU 1 unit per Stock Out untuk menghindari agregasi yang salah
            description: `${salesOrderItem.description || ''} - Delivered unit ${i + 1}`,
          }, { client: trx })
        }
      } else if (qtyDifference < 0) {
        // ✅ Jika deliveredQty dikurangi, hapus Stock Out paling baru (LIFO)
        const reductionNeeded = Math.abs(qtyDifference)

        // Ambil Stock Out yang terkait dengan item ini (LIFO order - paling baru dulu)
        const relatedStockOuts = await StockOut.query({ client: trx })
          .where('salesOrderId', salesOrder.id)
          .whereHas('stockOutDetails', (detailQuery) => {
            detailQuery.where('productId', salesOrderItem.productId)
          })
          .where('status', 'draft') // Hanya hapus yang masih draft
          .orderBy('createdAt', 'desc')
          .limit(reductionNeeded) // Ambil sejumlah yang perlu dihapus

        for (const stockOut of relatedStockOuts) {
          // Hapus StockOutDetails terlebih dahulu
          await StockOutDetail.query({ client: trx })
            .where('stockOutId', stockOut.id)
            .where('productId', salesOrderItem.productId)
            .delete()

          // Kemudian hapus StockOut
          await stockOut.useTransaction(trx).delete()
        }
      }

      // ✅ LOGIKA BARU: Reload Sales Order items untuk mendapatkan data terbaru
      await salesOrder.load('salesOrderItems')
      const allItems = salesOrder.salesOrderItems

      const totalDelivered = allItems.reduce((sum, item) => sum + (Number(item.deliveredQty) || 0), 0)

      // ✅ PERBAIKAN: Cek apakah semua item sudah fully delivered
      const allItemsFullyDelivered = allItems.every(item => {
        const deliveredQty = Number(item.deliveredQty || 0)
        const orderedQty = Number(item.quantity || 0)
        return deliveredQty >= orderedQty
      })

      let newSalesOrderStatus: 'draft' | 'approved' | 'rejected' | 'delivered' | 'partial' = salesOrder.status

      if (totalDelivered === 0) {
        // Jika belum ada yang di-deliver, kembalikan ke status sebelumnya
        if (salesOrder.approvedBy && salesOrder.approvedAt) {
          newSalesOrderStatus = 'approved'
        } else {
          newSalesOrderStatus = 'draft'
        }
      } else if (allItemsFullyDelivered) {
        // ✅ PERBAIKAN: Jika semua item fully delivered, status = delivered
        newSalesOrderStatus = 'delivered'
        salesOrder.deliveredAt = new Date()
        if (auth.user) {
          salesOrder.deliveredBy = auth.user.id
        }
      } else {
        // ✅ PERBAIKAN: Jika ada item yang belum fully delivered, status = partial
        newSalesOrderStatus = 'partial'
      }

      // ✅ REMOVED: Automatic invoice creation - Invoice akan dibuat manual oleh user
      // let createdInvoice = null
      // if (salesOrderItem.statusPartial === true && newSalesOrderStatus === 'partial') {
      //   createdInvoice = await this.createInvoiceForNewDelivery(salesOrder, salesOrderItem.id, newSalesOrderStatus)
      // } else if (newSalesOrderStatus === 'delivered' && (salesOrder.status as any) !== 'delivered') {
      //   createdInvoice = await this.createInvoiceForNewDelivery(salesOrder, salesOrderItem.id, newSalesOrderStatus)
      // }

      // Update status Sales Order jika ada perubahan
      if (salesOrder.status !== newSalesOrderStatus) {
        salesOrder.status = newSalesOrderStatus
        await salesOrder.useTransaction(trx).save()
      }

      await trx.commit()

      return response.ok({
        message: 'Status partial sales item dan Sales Order berhasil diperbarui',
        data: {
          salesOrderItem: salesOrderItem.serialize(),
          salesOrder: salesOrder.serialize()
        }
      })
    } catch (error) {
      await trx.rollback()
      console.error('❌ ERROR in updateStatusPartial:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
        name: error.name
      })

      // Handle specific errors
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Sales Order Item tidak ditemukan'
        })
      }

      return response.badRequest({
        message: 'Gagal memperbarui status',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }

  public async deliverAllItems({ params, response, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const salesOrderId = params.id

      // Ambil Sales Order dengan semua items
      const salesOrder = await SalesOrder.query({ client: trx })
        .where('id', salesOrderId)
        .preload('salesOrderItems', (query) => {
          query.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'priceSell', 'sku'])
          })
        })
        .firstOrFail()

      // ✅ Validasi: Sales Order yang sudah delivered tidak perlu deliver all lagi
      if (salesOrder.status === 'delivered') {
        await trx.rollback()
        return response.badRequest({
          message: `Sales Order sudah dalam status ${salesOrder.status.toUpperCase()}, semua item sudah dikirim`,
          currentStatus: salesOrder.status
        })
      }

      // Fungsi generateNo untuk no_so
      function generateNo() {
        return 'SO-' + Date.now()
      }

      // ✅ LOGIKA BARU: Identifikasi produk yang punya pending quantity
      const productsWithPendingQty = []
      for (const item of salesOrder.salesOrderItems) {
        const currentDeliveredQty = Number(item.deliveredQty || 0)
        const orderedQty = Number(item.quantity || 0)
        const pendingQty = orderedQty - currentDeliveredQty

        if (pendingQty > 0) {
          productsWithPendingQty.push({
            item: item,
            orderedQty: orderedQty,
            currentDeliveredQty: currentDeliveredQty,
            pendingQty: pendingQty
          })

          // Update deliveredQty ke maksimum
          item.deliveredQty = orderedQty
          item.statusPartial = orderedQty > 0 // Set statusPartial true jika ada quantity
          await item.useTransaction(trx).save()
        }
      }

      let totalStockOutsCreated = 0

      // ✅ LOGIKA BARU: Buat 1 Stock Out yang berisi semua produk dengan pending quantity
      if (productsWithPendingQty.length > 0) {
        // Ambil warehouse dari item pertama (asumsi sama). Jika berbeda, tetap gunakan yang pertama.
        const warehouseId = productsWithPendingQty[0].item.warehouseId

        // Buat satu Stock Out untuk batch deliver all
        const stockOut = await StockOut.create({
          noSo: generateNo(),
          salesOrderId: salesOrder.id,
          warehouseId: warehouseId,
          postedBy: auth.user?.id,
          date: DateTime.now().toJSDate(),
          status: 'draft',
          description: `Deliver All - ${productsWithPendingQty.length} products`,
        }, { client: trx })

        // Tambahkan detail untuk setiap produk yang memiliki pending quantity
        for (const productData of productsWithPendingQty) {
          const { item, pendingQty } = productData
          await StockOutDetail.create({
            stockOutId: stockOut.id,
            productId: item.productId,
            quantity: pendingQty,
            description: `Deliver All - ${item.product?.name || 'Product'} (${pendingQty} units to complete ${productData.orderedQty})`,
          }, { client: trx })
        }

        totalStockOutsCreated = 1
      }

      // ✅ LOGIKA STATUS: Update status Sales Order sesuai kondisi
      await salesOrder.load('salesOrderItems')
      const allItems = salesOrder.salesOrderItems

      // ✅ PERBAIKAN: Cek apakah semua item sudah fully delivered
      const allItemsFullyDelivered = allItems.every(item => {
        const deliveredQty = Number(item.deliveredQty || 0)
        const orderedQty = Number(item.quantity || 0)
        return deliveredQty >= orderedQty
      })

      if (allItemsFullyDelivered) {
        salesOrder.status = 'delivered'
        salesOrder.deliveredAt = new Date()
        if (auth.user) {
          salesOrder.deliveredBy = auth.user.id
        }
      } else {
        salesOrder.status = 'partial'
      }

      await salesOrder.useTransaction(trx).save()

      await trx.commit()

      // ✅ RESPONSE MESSAGE: Update untuk mencerminkan logika baru
      const responseMessage = totalStockOutsCreated > 0
        ? `Berhasil deliver semua item. 1 Stock Out dibuat berisi ${productsWithPendingQty.length} produk.`
        : 'Semua item sudah di-deliver sebelumnya.'

      return response.ok({
        message: responseMessage,
        data: {
          salesOrderId: salesOrder.id,
          totalStockOutsCreated,
          productsProcessed: productsWithPendingQty.length,
          newStatus: salesOrder.status
        }
      })

    } catch (error) {
      await trx.rollback()
      console.error('❌ ERROR in deliverAllItems:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
        name: error.name
      })

      return response.badRequest({
        message: 'Gagal deliver semua item',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}
