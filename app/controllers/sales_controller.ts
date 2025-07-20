import type { HttpContext } from '@adonisjs/core/http'
import SalesOrder from '#models/sales_order'
import SalesInvoice from '#models/sales_invoice'
import SalesInvoiceItem from '#models/sales_invoice_item'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import Cabang from '#models/cabang'
import SalesOrderItem from '#models/sales_order_item'
import { salesOrderValidator, updateSalesOrderValidator } from '#validators/sale'
import { toRoman } from '#helper/bulan_romawi'
import Mail from '@adonisjs/mail/services/main'
import SalesOrderCreated from '#mails/sales_order_created'
import Customer from '#models/customer'
import Perusahaan from '#models/perusahaan'
import { DateTime } from 'luxon';

export default class SalesController {
  async index({ request, response }: HttpContext) {
    try {
      const page         = request.input('page', 1)
      const limit        = request.input('rows', 10)
      const search       = request.input('search', '')
      const searchValue  = search || request.input('search.value', '')
      const sortField    = request.input('sortField')
      const sortOrder    = request.input('sortOrder')
      const customerId   = request.input('customerId')
      const source       = request.input('source')
      const status       = request.input('status')
      const startDate    = request.input('startDate')
      const endDate      = request.input('endDate')
      const includeItems = request.input('includeItems', false)

      // ✅ OPTIMASI: Efficient base query dengan minimal preloading
      let dataQuery = SalesOrder.query()
        .preload('customer', (query) => {
          query.select(['id', 'name', 'email', 'phone']) // ✅ Select only needed fields
        })
        .preload('perusahaan', (query) => {
          query.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan']) // ✅ Select semua field yang diperlukan
        })
        .preload('cabang', (query) => {
          query.select(['id', 'nmCabang', 'perusahaanId']) // ✅ Perbaikan kolom sesuai model
        })
        .preload('createdByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })

      // ✅ OPTIMASI: Conditional preloading untuk performance
      if (includeItems) {
        dataQuery.preload('salesOrderItems', (query) => {
          query.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'price', 'sku'])
          })
        })
      }

      // ✅ PRELOAD: Selalu preload users karena kolom ini ditampilkan di frontend
      dataQuery.preload('approvedByUser', (query) => {
        query.select(['id', 'fullName'])
      })
      dataQuery.preload('deliveredByUser', (query) => {
        query.select(['id', 'fullName'])
      })
      dataQuery.preload('rejectedByUser', (query) => {
        query.select(['id', 'fullName'])
      })

      if (customerId) {
        dataQuery.where('customer_id', customerId)
      }
      if (source) {
        dataQuery.where('source', source)
      }
      if (status) {
        dataQuery.where('status', status)
      }
      // Debug: Log filter tanggal
      console.log('🔍 Date Filter Debug:', { startDate, endDate });
      
      if (startDate && startDate.trim() !== '') {
        console.log('🔍 Adding startDate filter:', startDate);
        // Validasi format tanggal
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate)) {
          console.log('🔍 Invalid startDate format, skipping filter');
        } else {
          console.log('🔍 Valid startDate format:', startDate);
          dataQuery.where('date', '>=', startDate)
        }
      }
      if (endDate && endDate.trim() !== '') {
        console.log('🔍 Adding endDate filter:', endDate);
        // Validasi format tanggal
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(endDate)) {
          console.log('🔍 Invalid endDate format, skipping filter');
        } else {
          console.log('🔍 Valid endDate format:', endDate);
          dataQuery.where('date', '<=', endDate)
        }
      }

      if (searchValue) {
        // ✅ OPTIMASI: Menggunakan exists() untuk relationship search
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
              .whereRaw('LOWER(no_so) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(status) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(description) LIKE ?', [`%${lowerSearch}%`])
              .orWhereExists((customerQuery) => {
                customerQuery
                  .from('customers')
                  .whereColumn('customers.id', 'sales_orders.customer_id')
                  .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((userQuery) => {
                userQuery
                  .from('users')
                  .whereColumn('users.id', 'sales_orders.created_by')
                  .whereRaw('LOWER(users.fullName) LIKE ?', [`%${lowerSearch}%`])
              })
        })
      }

      // ✅ OPTIMASI: Efficient sorting dengan proper indexing
      let customOrder = false
      if (sortField && sortOrder) {
        customOrder = true
        const actualSortOrder = sortOrder === '1' ? 'asc' : 'desc'
        const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

        if (sortField.includes('.')) {
          const [relation, column] = sortField.split('.')
          const dbColumn = toSnakeCase(column)

          // ✅ OPTIMASI: Efficient joins dengan proper aliasing
          const relationJoinInfo: Record<string, { table: string, foreignKey: string, primaryKey: string }> = {
            customer: { table: 'customers', foreignKey: 'sales_orders.customer_id', primaryKey: 'customers.id' },
            perusahaan: { table: 'perusahaan', foreignKey: 'sales_orders.perusahaan_id', primaryKey: 'perusahaan.id' },
            cabang: { table: 'cabang', foreignKey: 'sales_orders.cabang_id', primaryKey: 'cabang.id' },
            createdByUser: { table: 'users as created_users', foreignKey: 'sales_orders.created_by', primaryKey: 'created_users.id' },
            approvedByUser: { table: 'users as approved_users', foreignKey: 'sales_orders.approved_by', primaryKey: 'approved_users.id' },
            deliveredByUser: { table: 'users as delivered_users', foreignKey: 'sales_orders.delivered_by', primaryKey: 'delivered_users.id' },
            date: { table: 'sales_orders', foreignKey: 'sales_orders.id', primaryKey: 'sales_orders.id' },
          }

          if (relation in relationJoinInfo) {
            const joinInfo = relationJoinInfo[relation]
            dataQuery
              .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
              .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
              .select('sales_orders.*')
          }
        } else {
            const dbColumn = toSnakeCase(sortField)
            dataQuery.orderBy(dbColumn, actualSortOrder)
        }
      }

      // ✅ Default ordering with proper indexing
      if (!customOrder) {
        dataQuery.orderBy('created_at', 'desc')
      }

      // ✅ OPTIMASI: Add query performance monitoring
      const startTime   = Date.now()
      
      // Debug: Log query SQL
      console.log('🔍 Final Query Debug:', dataQuery.toQuery());
      
      // Debug: Cek data yang ada di database
      const allData = await SalesOrder.query().select('id', 'noSo', 'date', 'status').limit(5);
      console.log('🔍 Sample Data in DB:', allData.map(item => ({
        id: item.id,
        noSo: item.noSo,
        date: item.date,
        status: item.status
      })));
      
      // Debug: Cek data dalam rentang tanggal jika ada filter
      if (startDate || endDate) {
        const rangeQuery = SalesOrder.query().select('id', 'noSo', 'date', 'status');
        if (startDate) rangeQuery.where('date', '>=', startDate);
        if (endDate) rangeQuery.where('date', '<=', endDate);
        const rangeData = await rangeQuery.limit(5);
        console.log('🔍 Data in Date Range:', rangeData.map(item => ({
          id: item.id,
          noSo: item.noSo,
          date: item.date,
          status: item.status
        })));
      }
      
      const salesOrders = await dataQuery.paginate(page, limit)
      const queryTime   = Date.now() - startTime

      // ✅ Log slow queries untuk monitoring
      if (queryTime > 1000) {
        console.warn(`🐌 Slow Query Alert: Sales Orders took ${queryTime}ms`)
      }
      
      // Debug: Log hasil
      console.log('🔍 Query Result Count:', salesOrders.all().length);

      return response.ok({
        ...salesOrders.toJSON(),
        _meta: {
          queryTime: queryTime,
          totalQueries: 'optimized'
        }
      })
    } catch (error) {
      return response.internalServerError({
          message: 'Terjadi kesalahan saat mengambil data sales order',
          error: {
              name   : error.name,
              status : error.status || 500,
              code   : error.code,
              message: error.message,
          },
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
        console.log('🔍 Controller Debug - show called with ID:', params.id);
        console.log('🔍 Controller Debug - ID type:', typeof params.id);

        // ✅ OPTIMASI: Efficient single record query
        const so = await SalesOrder.query()
        .where('id', params.id)
        .preload('customer', (query) => {
          query.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
        })
        .preload('perusahaan', (query) => {
          query.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan'])
        })
        .preload('cabang', (query) => {
          query.select(['id', 'nmCabang', 'alamatCabang'])
        })
        .preload('salesOrderItems', (query) => {
            query.preload('product', (productQuery) => {
              productQuery.select(['id', 'name', 'priceSell', 'sku', 'description'])
            }).preload('salesReturnItems', (sriQuery) => {
              sriQuery.preload('salesReturn', (srQuery) => {
                srQuery.select(['id', 'status', 'return_date'])
              })
            })
        })
        .preload('createdByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })
        .preload('approvedByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })
        .preload('deliveredByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })
        .preload('rejectedByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })
        .first()

        if (!so) {
          console.error('❌ Controller Debug - Sales Order not found with ID:', params.id);
          return response.notFound({
            message: `Sales Order dengan ID ${params.id} tidak ditemukan`,
            error: {
              code: 'SO_NOT_FOUND',
              id: params.id
            }
          });
        }

        console.log('✅ Controller Debug - Sales Order found:', so.id);

        return response.ok({
        message: 'Sales Order ditemukan',
        data: so,
        })
    } catch (error) {
        console.error('❌ Controller Debug - Error in show:', {
          message: error.message,
          stack: error.stack,
          params: params
        });

        return response.internalServerError({
          message: 'Terjadi kesalahan saat mengambil Sales Order',
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        });
    }
  }

  async store({ request, response }: HttpContext) {
    // Fungsi generateNo untuk no_po dengan format 0000/APU/PO/Bulan dalam angka romawi/tahun
    async function generateNo() {
      // Ambil nomor urut terakhir dari PO bulan ini
      const now   = new Date()
      const bulan = now.getMonth() + 1
      const tahun = now.getFullYear()

      // Konversi bulan ke angka romawi
      const bulanRomawi = toRoman(bulan)

      // Cari nomor urut terakhir untuk bulan dan tahun ini
      const lastPo = await SalesOrder
          .query()
          .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulan])
          .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun])
          .orderBy('no_so', 'desc')
          .first()

      let lastNumber = 0
      if (lastPo && lastPo.noSo) {
          // Ambil 4 digit pertama dari no_po terakhir
          const match = lastPo.noSo.match(/^(\d{4})/)
          if (match) {
              lastNumber = parseInt(match[1], 10)
          }
      }
      const nextNumber = (lastNumber + 1).toString().padStart(4, '0')

      // Format: 0000/APU/SO/${bulanRomawi}/${tahun}
      return `${nextNumber}/APU/SO/${bulanRomawi}/${tahun}`
    }
    const payload = await request.validateUsing(salesOrderValidator)
    const items = payload.salesOrderItems || []

    if (!Array.isArray(items) || items.length === 0) {
    return response.badRequest({ message: 'Items tidak boleh kosong ya' })
    }

    let attachmentPath: string | null = null

    // Upload file jika ada
    if (payload.attachment && payload.attachment instanceof MultipartFile) {
      try {
        const fileName = `${Date.now()}_${payload.attachment.clientName}`
        await payload.attachment.move(app.publicPath('uploads/sales_orders'), {
          name     : fileName,
          overwrite: true,
        })

        if (!payload.attachment.isValid) {
          return response.badRequest({
            message: 'Gagal upload file attachment',
            error: payload.attachment.errors.map((error: any) => error.message),
          })
        }

        attachmentPath = `uploads/sales_orders/${fileName}`
      } catch (err) {
        return response.internalServerError({
        message: 'Gagal menyimpan file attachment',
        error: err.message,
        })
      }
    }

    const trx = await db.transaction()

    try {
      const subtotal = items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
      )

      const discount = subtotal * (payload.discountPercent / 100)
      const afterDiscount = subtotal - discount
      const tax = afterDiscount * (payload.taxPercent / 100)
      const total = afterDiscount + tax

      const so = await SalesOrder.create({
          customerId     : payload.customerId,
          perusahaanId   : payload.perusahaanId,
          cabangId       : payload.cabangId,
          noPo           : payload.noPo,
          noSo           : payload.noSo || await generateNo(),
          up             : payload.up,
          date           : payload.date,
          dueDate        : payload.dueDate,
          status         : payload.status || 'draft',
          paymentMethod  : payload.paymentMethod,
          source         : payload.source,
          discountPercent: payload.discountPercent,
          taxPercent     : payload.taxPercent,
          total,
          createdBy  : payload.createdBy,
          approvedBy : payload.approvedBy,
          deliveredBy: payload.deliveredBy,
          rejectedBy : payload.rejectedBy,
          approvedAt : payload.approvedAt,
          deliveredAt: payload.deliveredAt,
          rejectedAt : payload.rejectedAt,
          description: payload.description,
          attachment : attachmentPath || undefined,
      }, { client: trx })

      for (const item of items) {
          await SalesOrderItem.create({
          salesOrderId : so.id,
          productId    : item.productId,
          warehouseId  : item.warehouseId,
          quantity     : item.quantity,
          price        : item.price,
          description  : item.description,
          subtotal     : item.subtotal,
          statusPartial: item.statusPartial || false,
          deliveredQty : item.deliveredQty || 0,
          }, { client: trx })
      }

      await trx.commit()

      // Ambil data terkait untuk email
      const customer = await Customer.findOrFail(so.customerId)
      const perusahaan = await Perusahaan.findOrFail(so.perusahaanId)
      const cabang = await Cabang.findOrFail(so.cabangId)

      // Kirim email notifikasi
      try {
        await Mail.send(new SalesOrderCreated(so, customer, perusahaan, cabang))
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
      }

      return response.created({
          message: 'Sales Order berhasil dibuat',
          data: so,
      })
      } catch (error) {
      await trx.rollback()
      console.error('SO Error:', error)
      return response.internalServerError({
          message: 'Gagal membuat Sales Order',
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateSalesOrderValidator)
    const items = payload.salesOrderItems || []

    if (!Array.isArray(items) || items.length === 0) {
        return response.badRequest({ message: 'Items tidak boleh kosong' })
    }

    const trx = await db.transaction()

    try {
        const so = await SalesOrder.findOrFail(params.id, { client: trx })

        // Optional: delete old file
        let attachmentPath = so.attachment
        if (payload.attachment && payload.attachment instanceof MultipartFile) {
            const fileName = `${Date.now()}_${payload.attachment.clientName}`
            await payload.attachment.move(app.publicPath('uploads/sales_orders'), {
                name: fileName,
                overwrite: true,
            })

            if (!payload.attachment.isValid) {
                return response.badRequest({
                message: 'Gagal upload file attachment',
                error: payload.attachment.errors.map((e: any) => e.message),
                })
            }

            attachmentPath = `uploads/sales_orders/${fileName}`
        }

        const subtotal      = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
        const discount      = subtotal * (payload.discountPercent || 0) / 100
        const afterDiscount = subtotal - discount
        const tax           = afterDiscount * (payload.taxPercent || 0) / 100
        const total         = afterDiscount + tax

        // Simpan status lama untuk perbandingan
        const oldStatus = so.status
        const newStatus = payload.status || 'draft'

        // Update SO utama
        so.merge({
        customerId     : payload.customerId,
        perusahaanId   : payload.perusahaanId,
        cabangId       : payload.cabangId,
        noPo           : payload.noPo,
        noSo           : payload.noSo,
        up             : payload.up,
        date           : payload.date,
        dueDate        : payload.dueDate,
        status         : newStatus,
        paymentMethod  : payload.paymentMethod,
        source         : payload.source,
        discountPercent: payload.discountPercent || 0,
        taxPercent     : payload.taxPercent || 0,
        total,
        createdBy  : payload.createdBy,
        approvedBy : payload.approvedBy,
        deliveredBy: payload.deliveredBy,
        rejectedBy : payload.rejectedBy,
        approvedAt : payload.approvedAt,
        deliveredAt: payload.deliveredAt,
        rejectedAt : payload.rejectedAt,
        description: payload.description,
        attachment : attachmentPath || undefined,
        })
        await so.save()

        // ✅ HANYA BUAT INVOICE OTOMATIS jika status berubah ke 'delivered' saja
        // Invoice untuk 'partial' akan dibuat dari sales_items_controller.ts saat status_partial diubah
        let createdInvoice = null
        if (oldStatus !== newStatus && newStatus === 'delivered') {
          createdInvoice = await this.createInvoiceForNewDelivery(so, newStatus)
        }

        // Hapus item lama lalu insert ulang item baru
        await SalesOrderItem.query({ client: trx })
        .where('sales_order_id', so.id)
        .delete()

        for (const item of items) {
        await SalesOrderItem.create({
                salesOrderId: so.id,
                productId      : item.productId,
                warehouseId    : item.warehouseId,
                quantity       : item.quantity,
                price          : item.price,
                description    : item.description,
                subtotal       : item.subtotal,
                statusPartial  : item.statusPartial || false,
                deliveredQty    : item.deliveredQty || 0,
            }, { client: trx })
        }

        await trx.commit()

        return response.ok({
        message: 'Sales Order berhasil diperbarui',
        data: {
            salesOrder: so.serialize(),
            invoice: createdInvoice ? createdInvoice.serialize() : null
        }
        })
    } catch (error) {
        await trx.rollback()
        console.error('PO Update Error:', error)
        return response.internalServerError({ message: 'Gagal memperbarui Sales Order' })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const customer = await SalesOrder.find(params.id)
      if (!customer) {
          return response.notFound({ message: 'SalesOrder tidak ditemukan' })
      }
      await customer.delete()
      return response.ok({ message: 'SalesOrder berhasil dihapus' })
      } catch (error) {
        return response.internalServerError({
        message: 'Gagal menghapus purchase order',
        error: error.message,
      })
    }
  }

  async approveSalesOrder({ params, response, auth }: HttpContext) {
    try {
        const so = await SalesOrder.find(params.id)
        if (!so) {
            return response.notFound({ message: 'SalesOrder tidak ditemukan' })
        }

        so.status = 'approved'
        so.approvedAt = new Date()
        if (auth.user) {
            so.approvedBy = auth.user.id
        }
        await so.save()

        // ✅ TIDAK BUAT INVOICE saat approve, hanya saat status_partial diubah atau delivered
        // Invoice akan dibuat dari sales_items_controller.ts saat user mengubah status_partial

        return response.ok({
            message: 'Sales Order berhasil diapprove',
            data: {
                salesOrder: so.serialize(),
                invoice: null // Tidak ada invoice yang dibuat saat approve
            }
        })
    } catch (error) {
        return response.internalServerError({ message: 'Gagal mengapprove purchase order' })
    }
  }

  async rejectSalesOrder({ params, response, auth }: HttpContext) {
    try {
        const so = await SalesOrder.find(params.id)
        if (!so) {
            return response.notFound({ message: 'SalesOrder tidak ditemukan' })
        }

        so.status = 'rejected'
        so.rejectedAt = new Date()
        if (auth.user) {
            so.rejectedBy = auth.user.id
        }
        await so.save()

        return response.ok({ message: 'Sales Order berhasil direject' })
    } catch (error) {
        return response.internalServerError({ message: 'Gagal mereject purchase order' })
    }
  }

  async getSalesOrderDetails({ params, response }: HttpContext) {
    try {

        const so = await SalesOrder.query()
        .where('id', params.id)
        .preload('customer', (query) => {
          query.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
        })
        .preload('perusahaan', (query) => {
          query.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan'])
        })
        .preload('cabang', (query) => {
          query.select(['id', 'nmCabang', 'alamatCabang'])
        })
        .preload('salesOrderItems', (query) => {
          query.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'priceSell', 'sku'])
          }).preload('salesReturnItems', (sriQuery) => {
            sriQuery.preload('salesReturn', (srQuery) => {
              srQuery.select(['id', 'status', 'returnDate'])
            })
          })
        })
        .preload('createdByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })
        .preload('approvedByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })
        .preload('deliveredByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })
        .preload('rejectedByUser', (query) => {
          query.select(['id', 'fullName', 'email'])
        })
        .first()

        if (!so) {
          return response.notFound({
            message: `Sales Order dengan ID ${params.id} tidak ditemukan`,
            error: {
              code: 'SO_NOT_FOUND',
              id: params.id
            }
          });
        }

        return response.ok({
            message: 'Sales Order ditemukan',
            data: so,
        })
    } catch (error) {
        console.error('❌ Controller Debug - Error in getSalesOrderDetails:', {
          message: error.message,
          stack: error.stack,
          params: params
        });

        return response.internalServerError({
          message: 'Terjadi kesalahan saat mengambil detail Sales Order',
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        });
    }
  }

  // ✅ UBAH: Fungsi untuk membuat invoice baru untuk setiap delivery
  private async createInvoiceForNewDelivery(salesOrder: SalesOrder, newStatus: string, _allItemsDelivered = false) {
    // Hanya buat invoice jika status berubah ke 'delivered'
    // Status 'partial' akan dihandle oleh sales_items_controller.ts
    if (newStatus !== 'delivered') {
      return null
    }

    // ✅ LOAD SEMUA ITEMS
    await salesOrder.load('salesOrderItems')

    let itemsToInvoice = []
    let invoiceDescription = ''
    let deliveredItemsTotal = 0

    // ✅ JIKA STATUS DELIVERED: Cek apakah sudah ada invoice sebelumnya
    const existingInvoicesCount = await SalesInvoice.query()
      .where('salesOrderId', salesOrder.id)
      .count('* as total')

    const totalExistingInvoices = existingInvoicesCount[0]?.$extras.total || 0

    if (totalExistingInvoices > 0) {
      // Sudah ada invoice partial sebelumnya, tidak perlu buat invoice lagi
      console.log(`✅ Sales Order #${salesOrder.noSo} sudah memiliki ${totalExistingInvoices} invoice. Tidak membuat invoice baru untuk status ${newStatus}.`)
      return null
    } else {
      // Belum ada invoice sama sekali, buat invoice untuk semua item yang statusPartial = true
      itemsToInvoice = salesOrder.salesOrderItems.filter(item => item.statusPartial === true)

      if (itemsToInvoice.length === 0) {
        // Jika belum ada item yang partial, buat invoice untuk semua item
        itemsToInvoice = salesOrder.salesOrderItems
        deliveredItemsTotal = Number(salesOrder.total) || 0
        invoiceDescription = `Invoice untuk semua item SO #${salesOrder.noSo || salesOrder.id} - Status: ${newStatus} (${itemsToInvoice.length} items)`
      } else {
        // Ada item yang sudah partial, gunakan total yang sudah dihitung
        deliveredItemsTotal = Number(salesOrder.total) || 0
        invoiceDescription = `Invoice untuk semua item SO #${salesOrder.noSo || salesOrder.id} - Status: ${newStatus} (${itemsToInvoice.length} items completed)`
      }
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
      const invoice = await SalesInvoice.create({
        noInvoice: noInvoice,
        salesOrderId: salesOrder.id,
        customerId: salesOrder.customerId,
        date: now,
        dueDate: salesOrder.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        discountPercent: Number(salesOrder.discountPercent) || 0,
        taxPercent: Number(salesOrder.taxPercent) || 0,
        total: finalTotal,
        paidAmount: 0,
        remainingAmount: finalTotal,
        status: 'unpaid',
        description: invoiceDescription,
      })

      // ✅ BUAT SALES INVOICE ITEMS untuk setiap item yang di-invoice
      for (const item of itemsToInvoice) {
        await SalesInvoiceItem.create({
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
      }

      console.log(`✅ NEW Invoice created untuk SO #${salesOrder.noSo}: ${noInvoice} - Total: ${finalTotal} - Items: ${itemsToInvoice.length}`)
      return invoice
    } catch (error) {
      console.error(`❌ Gagal membuat invoice untuk SO #${salesOrder.noSo}:`, error)
      return null
    }
  }

  async getCabangbyPerusahaan({ request, response }: HttpContext) {
      const perusahaanId = request.input('perusahaanId')
      const cabang = await Cabang.query()
      .where('perusahaanId', perusahaanId)
      return response.ok(cabang)
  }

  async countByStatus({ response }: HttpContext) {
    const total     = await SalesOrder.query().count('* as total')
    const approved  = await SalesOrder.query().where('status', 'approved').count('* as total')
    const rejected  = await SalesOrder.query().where('status', 'rejected').count('* as total')
    const partial   = await SalesOrder.query().where('status', 'partial').count('* as total')
    const delivered = await SalesOrder.query().where('status', 'delivered').count('* as total')

    // Hitung tanggal 4 bulan lalu
    const fourMonthsAgo = DateTime.now().minus({ months: 4 }).toISODate();

    // Query delivered 4 bulan terakhir
    const deliveredLast4Months = await SalesOrder.query()
      .where('status', 'delivered')
      .where('created_at', '>=', fourMonthsAgo)
      .count('* as total');

    return response.ok({
      total               : Number(total[0].total),
      approved            : Number(approved[0].total),
      rejected            : Number(rejected[0].total),
      partial             : Number(partial[0].total),
      delivered           : Number(delivered[0].total),
      deliveredLast4Months: Number(deliveredLast4Months[0].total),
    })
  }
}
