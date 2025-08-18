import type { HttpContext } from '@adonisjs/core/http'
import SalesOrderItem from '#models/sales_order_item'
import SalesOrder from '#models/sales_order'
import SalesInvoice from '#models/sales_invoice'
import SalesInvoiceItem from '#models/sales_invoice_item'
import StockOut from '#models/stock_out'
import StockOutDetail from '#models/stock_out_detail'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class SalesItemsController {
    // ✅ UBAH: Fungsi untuk membuat invoice baru untuk setiap partial delivery
    private async createInvoiceForNewDelivery(salesOrder: SalesOrder, newlyDeliveredItemId: string, newStatus: string) {
      // Hanya buat invoice jika status berubah ke 'partial' atau 'delivered'
      if (newStatus !== 'partial' && newStatus !== 'delivered') {
        return null
      }

      // ✅ LOAD ITEM YANG BARU DI-DELIVER dengan relationships
      await salesOrder.load('salesOrderItems', (query) => {
        query.preload('product', (productQuery) => {
          productQuery.select(['id', 'name', 'priceSell', 'sku'])
        })
      })

      let itemsToInvoice = []
      let invoiceDescription = ''
      let deliveredItemsTotal = 0

      if (newStatus === 'delivered') {
        // ✅ JIKA STATUS DELIVERED: Cek apakah sudah ada invoice sebelumnya
        const existingInvoicesCount = await SalesInvoice.query()
          .where('salesOrderId', salesOrder.id)
          .count('* as total')

        const totalExistingInvoices = existingInvoicesCount[0]?.$extras.total || 0

        if (totalExistingInvoices > 0) {
          // Sudah ada invoice partial sebelumnya, tidak perlu buat invoice lagi
          return null
        } else {
          // Belum ada invoice sama sekali, buat invoice untuk semua item
          itemsToInvoice = salesOrder.salesOrderItems.filter(item => item.statusPartial === true)
          deliveredItemsTotal = Number(salesOrder.total) || 0
          invoiceDescription = `Invoice untuk semua item SO #${salesOrder.noSo || salesOrder.id} - Delivered Complete (${itemsToInvoice.length} items)`
        }
      } else {
        // ✅ JIKA STATUS PARTIAL: Buat invoice hanya untuk item yang baru di-deliver
        const newlyDeliveredItem = salesOrder.salesOrderItems.find(item => item.id === newlyDeliveredItemId)

        if (!newlyDeliveredItem || !newlyDeliveredItem.statusPartial) {
          console.warn(`⚠️ Item ID ${newlyDeliveredItemId} tidak ditemukan atau statusPartial bukan true`)
          return null
        }

        // ✅ VALIDASI ANTI-DUPLIKASI: Cek apakah item ini sudah pernah di-invoice
        const existingInvoiceForItem = await SalesInvoiceItem.query()
          .where('salesOrderItemId', newlyDeliveredItemId)
          .first()

        if (existingInvoiceForItem) {
          return null
        }

        itemsToInvoice = [newlyDeliveredItem]
        deliveredItemsTotal = Number(newlyDeliveredItem.subtotal) || 0
        invoiceDescription = `Invoice partial untuk item: ${newlyDeliveredItem.product?.name || 'Unknown Product'} - SO #${salesOrder.noSo || salesOrder.id} (Qty: ${newlyDeliveredItem.deliveredQty || newlyDeliveredItem.quantity})`
      }

      // Validasi: pastikan ada item untuk di-invoice
      if (itemsToInvoice.length === 0 || deliveredItemsTotal <= 0) {
        console.warn(`⚠️ Tidak ada item valid untuk di-invoice atau total = 0`)
        return null
      }

      // ✅ BUAT INVOICE BARU (SELALU BARU, TIDAK UPDATE EXISTING)
      try {
        // Generate nomor invoice
        const now = new Date()
        const bulan = String(now.getMonth() + 1).padStart(2, '0')
        const tahun = String(now.getFullYear()).slice(-2)
        const currentMonthPattern = `-${bulan}${tahun}`

        // Ambil nomor invoice tertinggi untuk bulan ini
        const lastInvoice = await SalesInvoice.query()
          .whereRaw(`no_invoice LIKE '%${currentMonthPattern}'`)
          .orderByRaw(`CAST(SUBSTRING(no_invoice, 1, 4) AS INTEGER) DESC`)
          .first()

        let nextNumber = 1
        if (lastInvoice && lastInvoice.noInvoice) {
          const match = lastInvoice.noInvoice.match(/^(\d{4})-/)
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1
          }
        }

        const noUrut = String(nextNumber).padStart(4, '0')
        const noInvoice = `${noUrut}-${bulan}${tahun}`

        // ✅ HITUNG TOTAL DENGAN DISCOUNT DAN TAX
        let finalTotal = 0

        if (newStatus === 'delivered' && itemsToInvoice.length === salesOrder.salesOrderItems.length) {
          // Jika delivered dan semua item, gunakan total sales order
          finalTotal = Number(salesOrder.total) || 0
        } else {
          // Hitung berdasarkan item yang di-invoice dengan discount dan tax proporsional
          const subtotalItems = itemsToInvoice.reduce((total, item) => {
            return total + (Number(item.subtotal) || 0)
          }, 0)

          const discountPercent = Number(salesOrder.discountPercent) || 0
          const taxPercent = Number(salesOrder.taxPercent) || 0

          const discountAmount = subtotalItems * (discountPercent / 100)
          const totalAfterDiscount = subtotalItems - discountAmount
          const taxAmount = totalAfterDiscount * (taxPercent / 100)
          finalTotal = totalAfterDiscount + taxAmount
        }

        const invoice = await SalesInvoice.create({
          noInvoice      : noInvoice,
          salesOrderId   : salesOrder.id,
          customerId     : salesOrder.customerId,
          date           : now,
          dueDate        : salesOrder.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          discountPercent: Number(salesOrder.discountPercent) || 0,
          taxPercent     : Number(salesOrder.taxPercent) || 0,
          total          : finalTotal,
          paidAmount     : 0,
          remainingAmount: finalTotal,
          status         : 'unpaid',
          description    : invoiceDescription,
        })

        // ✅ BUAT SALES INVOICE ITEMS untuk setiap item yang di-invoice

        for (const item of itemsToInvoice) {
          try {
            const invoiceItem = await SalesInvoiceItem.create({
              salesInvoiceId  : invoice.id,
              salesOrderItemId: item.id,
              productId       : Number(item.productId),
              warehouseId     : Number(item.warehouseId),
              quantity        : Number(item.deliveredQty || item.quantity),
              price           : Number(item.price) || 0,
              subtotal        : Number(item.subtotal) || 0,
              description     : item.description || '',
              deliveredQty    : Number(item.deliveredQty || 0),
              isReturned      : false,
            })
            console.log(`✅ Created invoice item:`, invoiceItem.id)
          } catch (itemError) {
            console.error(`❌ Failed to create invoice item for item ${item.id}:`, itemError)
            throw itemError
          }
        }
        return invoice
      } catch (error) {
        console.error(`❌ Gagal membuat invoice untuk SO #${salesOrder.noSo}:`, {
          error: error.message,
          stack: error.stack,
          code: error.code,
          sqlState: error.sqlState,
          sqlMessage: error.sqlMessage
        })
        return null
      }
    }

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

      // ✅ BUAT INVOICE OTOMATIS hanya jika:
      // 1. Item memiliki deliveredQty > 0 dan status menjadi partial
      // 2. Status sales order berubah ke 'delivered'
      let createdInvoice = null
      if (salesOrderItem.statusPartial === true && newSalesOrderStatus === 'partial') {
        // Hanya buat invoice untuk item yang baru di-deliver (deliveredQty > 0)
        createdInvoice = await this.createInvoiceForNewDelivery(salesOrder, salesOrderItem.id, newSalesOrderStatus)
      } else if (newSalesOrderStatus === 'delivered' && (salesOrder.status as any) !== 'delivered') {
        // Buat invoice untuk semua item jika status berubah ke delivered
        createdInvoice = await this.createInvoiceForNewDelivery(salesOrder, salesOrderItem.id, newSalesOrderStatus)
      }

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
          salesOrder: salesOrder.serialize(),
          invoice: createdInvoice ? createdInvoice.serialize() : null,
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

      // ✅ LOGIKA BARU: Buat Stock Out individual untuk setiap unit dari setiap produk
      if (productsWithPendingQty.length > 0) {

        for (const productData of productsWithPendingQty) {
          const { item, pendingQty } = productData

          // Buat Stock Out individual untuk setiap unit pending
          for (let i = 0; i < pendingQty; i++) {
            const stockOut = await StockOut.create({
              noSo: generateNo(),
              salesOrderId: salesOrder.id,
              warehouseId: item.warehouseId,
              postedBy: auth.user?.id,
              date: DateTime.now().toJSDate(),
              status: 'draft',
              description: `Deliver All - ${item.product?.name || item.productId} - Unit ${i + 1}/${pendingQty}`,
            }, { client: trx })

            // Buat 1 StockOutDetail untuk Stock Out ini dengan quantity = 1
            await StockOutDetail.create({
              stockOutId: stockOut.id,
              productId: item.productId,
              quantity: 1, // SELALU 1 unit per Stock Out untuk konsistensi
              description: `Deliver All - ${item.product?.name || 'Product'} - Unit ${i + 1}`,
            }, { client: trx })

            totalStockOutsCreated++
          }
        }
      } else {
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
        ? `Berhasil deliver semua item. ${totalStockOutsCreated} Stock Out dibuat untuk ${productsWithPendingQty.length} produk.`
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
