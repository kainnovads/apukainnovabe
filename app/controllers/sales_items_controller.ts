import type { HttpContext } from '@adonisjs/core/http'
import SalesOrderItem from '#models/sales_order_item'
import SalesOrder from '#models/sales_order'
import SalesInvoice from '#models/sales_invoice'
import SalesInvoiceItem from '#models/sales_invoice_item'
import StockOut from '#models/stock_out'
import StockOutDetail from '#models/stock_out_detail'
import { DateTime } from 'luxon'

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
          console.log(`✅ Sales Order #${salesOrder.noSo} sudah memiliki ${totalExistingInvoices} invoice partial. Tidak membuat invoice baru untuk status delivered.`)
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

        console.log('🔍 Found newly delivered item:', {
          found: !!newlyDeliveredItem,
          id: newlyDeliveredItem?.id,
          statusPartial: newlyDeliveredItem?.statusPartial,
          productId: newlyDeliveredItem?.productId,
          warehouseId: newlyDeliveredItem?.warehouseId
        })

        if (!newlyDeliveredItem || !newlyDeliveredItem.statusPartial) {
          console.warn(`⚠️ Item ID ${newlyDeliveredItemId} tidak ditemukan atau statusPartial bukan true`)
          return null
        }

        // ✅ VALIDASI ANTI-DUPLIKASI: Cek apakah item ini sudah pernah di-invoice
        const existingInvoiceForItem = await SalesInvoiceItem.query()
          .where('salesOrderItemId', newlyDeliveredItemId)
          .first()

        if (existingInvoiceForItem) {
          console.log(`✅ Item ID ${newlyDeliveredItemId} sudah pernah di-invoice. Tidak membuat invoice baru.`)
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

        // ✅ BUAT INVOICE BARU
        console.log('🔍 Creating invoice with data:', {
          noInvoice,
          salesOrderId: salesOrder.id,
          customerId: salesOrder.customerId,
          total: finalTotal,
          description: invoiceDescription
        })

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

        console.log('✅ Invoice created successfully:', invoice.id)

        // ✅ BUAT SALES INVOICE ITEMS untuk setiap item yang di-invoice
        console.log(`🔍 Creating invoice items for ${itemsToInvoice.length} items:`, itemsToInvoice.map(item => ({
          id: item.id,
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
          deliveredQty: item.deliveredQty,
          price: item.price,
          subtotal: item.subtotal
        })))

        console.log('🔍 SalesInvoiceItem model loaded:', !!SalesInvoiceItem)

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

        console.log(`✅ NEW Invoice created untuk SO #${salesOrder.noSo}: ${noInvoice} - Total: ${finalTotal} - Items: ${itemsToInvoice.length}`)
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

    try {
      const itemId = params.id
      const { deliveredQty } = request.only(['deliveredQty'])

      console.log('🔍 updateStatusPartial called:', {
        itemId,
        deliveredQty,
        deliveredQtyType: typeof deliveredQty
      })

      const salesOrderItem = await SalesOrderItem.query()
        .where('id', itemId)
        .firstOrFail()

      console.log('🔍 SalesOrderItem found:', {
        id: salesOrderItem.id,
        quantity: salesOrderItem.quantity,
        currentDeliveredQty: salesOrderItem.deliveredQty
      })

      // Validasi: deliveredQty tidak boleh melebihi quantity dan tidak boleh negatif
      if (deliveredQty !== undefined) {
        const numDeliveredQty = Number(deliveredQty)
        console.log('🔍 Validation check:', {
          deliveredQty,
          numDeliveredQty,
          maxQuantity: salesOrderItem.quantity
        })

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

      // Update delivered_qty item SO
      if (deliveredQty !== undefined) {
        salesOrderItem.deliveredQty = Number(deliveredQty)
      }

      // Auto-set statusPartial berdasarkan deliveredQty
      const currentDeliveredQty = Number(deliveredQty) || 0
      salesOrderItem.statusPartial = currentDeliveredQty > 0

      await salesOrderItem.save()

      // Ambil Sales Order terkait beserta semua itemnya
      const salesOrder = await SalesOrder.query()
        .where('id', salesOrderItem.salesOrderId)
        .preload('salesOrderItems')
        .firstOrFail()

      // ✅ PERBAIKAN: Update item yang baru saja diubah di memori untuk logika status yang tepat
      const updatedItem = salesOrder.salesOrderItems.find(item => item.id === salesOrderItem.id)
      if (updatedItem) {
        updatedItem.statusPartial = salesOrderItem.statusPartial
        updatedItem.deliveredQty = salesOrderItem.deliveredQty
      }

            // ✅ ALUR BARU: Setiap increment deliveredQty = 1 Stock Out baru
      if (salesOrderItem.statusPartial === true && Number(salesOrderItem.deliveredQty) > 0) {
        const item = salesOrderItem
        const currentDeliveredQty = Number(item.deliveredQty || 0)

        console.log(`🔍 Creating Stock Out for deliveredQty increment: ${currentDeliveredQty}`)

                // 1. Cek berapa banyak Stock Out yang sudah ada untuk SO + produk + warehouse ini
        const existingStockOuts = await StockOut.query()
          .where('salesOrderId', salesOrder.id)
          .whereHas('stockOutDetails', (detailQuery) => {
            detailQuery.where('productId', item.productId)
          })
          .count('* as total')

        const totalExistingStockOuts = existingStockOuts[0]?.$extras.total || 0

        console.log(`🔍 Existing Stock Outs for product ${item.productId}: ${totalExistingStockOuts}, deliveredQty: ${currentDeliveredQty}`)

        // 2. Hitung berapa banyak Stock Out baru yang perlu dibuat
        const newStockOutsNeeded = currentDeliveredQty - totalExistingStockOuts

        if (newStockOutsNeeded > 0) {
          console.log(`🔍 Creating ${newStockOutsNeeded} new Stock Out(s)`)

          // ✅ BUAT STOCK OUT INDIVIDUAL: 1 deliveredQty = 1 Stock Out
          for (let i = 0; i < newStockOutsNeeded; i++) {
            // Buat Stock Out baru untuk setiap unit
            const stockOut = await StockOut.create({
              noSo: generateNo(),
              salesOrderId: salesOrder.id,
              warehouseId: item.warehouseId,
              postedBy: auth.user?.id,
              date: DateTime.now().toJSDate(),
              status: 'draft',
              description: `Stock Out Unit ${totalExistingStockOuts + i + 1} dari SO #${salesOrder.noSo || salesOrder.id} - Produk: ${item.productId}`,
            })

            // Buat 1 StockOutDetail untuk Stock Out ini
            await StockOutDetail.create({
              stockOutId: stockOut.id,
              productId: item.productId,
              quantity: 1, // Selalu 1 unit per Stock Out
              description: `${item.description || ''} - Unit ${totalExistingStockOuts + i + 1}`,
            })

            console.log(`✅ Created StockOut ${stockOut.id} with 1 detail for unit ${totalExistingStockOuts + i + 1}`)
          }

          console.log(`✅ Created ${newStockOutsNeeded} Stock Out(s) for deliveredQty: ${currentDeliveredQty}`)
        } else if (newStockOutsNeeded < 0) {
          // Jika deliveredQty dikurangi, hapus Stock Out yang berlebihan
          const excessStockOuts = Math.abs(newStockOutsNeeded)
          console.log(`🔍 Removing ${excessStockOuts} excess Stock Out(s)`)

          // Ambil Stock Out yang berlebihan (LIFO - last created first deleted)
          const stockOutsToRemove = await StockOut.query()
            .where('salesOrderId', salesOrder.id)
            .whereHas('stockOutDetails', (detailQuery) => {
              detailQuery.where('productId', item.productId)
            })
            .where('status', 'draft') // Hanya hapus yang masih draft
            .orderBy('createdAt', 'desc')
            .limit(excessStockOuts)

          for (const stockOut of stockOutsToRemove) {
            // Hapus StockOutDetails terlebih dahulu
            await StockOutDetail.query()
              .where('stockOutId', stockOut.id)
              .delete()

            // Kemudian hapus StockOut
            await stockOut.delete()
            console.log(`✅ Deleted StockOut: ${stockOut.id}`)
          }

          console.log(`✅ Removed ${excessStockOuts} Stock Out(s)`)
        }

        console.log(`✅ Stock Out process completed for deliveredQty: ${currentDeliveredQty}`)
      } else if (Number(salesOrderItem.deliveredQty || 0) === 0) {
        // ✅ Jika deliveredQty = 0, hapus semua Stock Out yang terkait untuk produk ini
        console.log(`🔍 DeliveredQty is 0, removing all Stock Outs for product ${salesOrderItem.productId}`)

        const stockOutsToDelete = await StockOut.query()
          .where('salesOrderId', salesOrder.id)
          .whereHas('stockOutDetails', (detailQuery) => {
            detailQuery.where('productId', salesOrderItem.productId)
          })
          .where('status', 'draft') // Hanya hapus yang masih draft

        for (const stockOut of stockOutsToDelete) {
          // Hapus StockOutDetails terlebih dahulu
          await StockOutDetail.query()
            .where('stockOutId', stockOut.id)
            .delete()

          // Kemudian hapus StockOut
          await stockOut.delete()
          console.log(`✅ Deleted StockOut: ${stockOut.id}`)
        }

        console.log(`✅ Deleted all Stock Outs for product ${salesOrderItem.productId}`)
      }

      // Logika untuk menentukan status Sales Order berdasarkan deliveredQty, bukan statusPartial
      let newSalesOrderStatus = salesOrder.status

      // Cek apakah ada item yang memiliki deliveredQty > 0
      const hasAnyItemWithDeliveredQty = salesOrder.salesOrderItems.some(item =>
        Number(item.deliveredQty || 0) > 0
      )

      // Cek apakah semua item sudah delivered penuh (deliveredQty = quantity)
      const allItemsFullyDelivered = salesOrder.salesOrderItems.every(item =>
        Number(item.deliveredQty || 0) === Number(item.quantity || 0)
      )

      // Debug logging
      console.log('🔍 Status Debug:', {
        currentStatus: salesOrder.status,
        hasAnyItemWithDeliveredQty,
        allItemsFullyDelivered,
        approvedBy: salesOrder.approvedBy,
        approvedAt: salesOrder.approvedAt,
        itemsStatus: salesOrder.salesOrderItems.map(item => ({
          id: item.id,
          statusPartial: item.statusPartial,
          deliveredQty: item.deliveredQty,
          quantity: item.quantity,
          isFullyDelivered: Number(item.deliveredQty || 0) === Number(item.quantity || 0)
        }))
      })

      if (allItemsFullyDelivered && hasAnyItemWithDeliveredQty) {
        // Jika semua item sudah delivered penuh
        newSalesOrderStatus = 'delivered'
      } else if (hasAnyItemWithDeliveredQty) {
        // Jika ada item yang sudah sebagian delivered (partial)
        newSalesOrderStatus = 'partial'
      } else {
        // Jika tidak ada item yang delivered, kembali ke status sebelumnya
        // Prioritas: approved -> draft
        if (salesOrder.approvedBy && salesOrder.approvedAt) {
          newSalesOrderStatus = 'approved'
        } else {
          newSalesOrderStatus = 'draft'
        }
      }

      console.log('🔍 Status Update:', {
        oldStatus: salesOrder.status,
        newStatus: newSalesOrderStatus,
        willUpdate: salesOrder.status !== newSalesOrderStatus
      })

      // ✅ BUAT INVOICE OTOMATIS hanya jika:
      // 1. Item memiliki deliveredQty > 0 dan status menjadi partial
      // 2. Status sales order berubah ke 'delivered'
      let createdInvoice = null
      if (salesOrderItem.statusPartial === true && newSalesOrderStatus === 'partial') {
        // Hanya buat invoice untuk item yang baru di-deliver (deliveredQty > 0)
        createdInvoice = await this.createInvoiceForNewDelivery(salesOrder, salesOrderItem.id, newSalesOrderStatus)
      } else if (newSalesOrderStatus === 'delivered' && salesOrder.status !== 'delivered') {
        // Buat invoice untuk semua item jika status berubah ke delivered
        createdInvoice = await this.createInvoiceForNewDelivery(salesOrder, salesOrderItem.id, newSalesOrderStatus)
      }

      // Update status Sales Order jika ada perubahan
      if (salesOrder.status !== newSalesOrderStatus) {
        salesOrder.status = newSalesOrderStatus

        // Jika status baru adalah 'delivered' dan semua item sudah delivered penuh
        if (newSalesOrderStatus === 'delivered' && allItemsFullyDelivered) {
          // Set delivered_at ke tanggal sekarang
          salesOrder.deliveredAt = new Date()

          // Set delivered_by ke user yang sedang login
          if (auth && auth.user && auth.user.id) {
            salesOrder.deliveredBy = auth.user.id
          }

          // Pastikan semua item memiliki statusPartial = true jika deliveredQty penuh
          for (const item of salesOrder.salesOrderItems) {
            // Jika deliveredQty = quantity, pastikan statusPartial = true
            if (Number(item.deliveredQty || 0) === Number(item.quantity || 0)) {
                item.statusPartial = true
                await item.save()
            }
          }
        }

        // Simpan perubahan sales order
        await salesOrder.save()
      }

      return response.ok({
        message: 'Status partial sales item dan Sales Order berhasil diperbarui',
        data: {
          salesOrderItem: salesOrderItem.serialize(),
          salesOrder: salesOrder.serialize(),
          invoice: createdInvoice ? createdInvoice.serialize() : null,
        }
      })
    } catch (error) {
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
}
