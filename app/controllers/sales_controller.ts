import type { HttpContext } from '@adonisjs/core/http'
import SalesOrder from '#models/sales_order'
// import SalesInvoice from '#models/sales_invoice' // ✅ REMOVED: Tidak digunakan lagi
// import SalesInvoiceItem from '#models/sales_invoice_item' // ✅ REMOVED: Tidak digunakan lagi
import { MultipartFile } from '@adonisjs/core/bodyparser'
import db from '@adonisjs/lucid/services/db'
import Cabang from '#models/cabang'
import SalesOrderItem from '#models/sales_order_item'
import { salesOrderValidator, updateSalesOrderValidator } from '#validators/sale'
import { toRoman } from '#helper/bulan_romawi'
import { DateTime } from 'luxon';
import StorageService from '#services/storage_service'
import { ActivityLogger } from '#helper/activity_log_helper'

export default class SalesController {
  private storageService: StorageService

  // Constructor
  constructor() {
    this.storageService = new StorageService()
  }

  async index({ request, response }: HttpContext) {
    try {
      const page         = parseInt(request.input('page', '1'), 10) || 1
      let limit          = parseInt(request.input('rows', '10'), 10) || 10
      
      // ✅ FIX: Batasi maksimal rows untuk keamanan dan performa (maksimal 1000 untuk dropdown)
      // Ini mencegah abuse dan improve performance
      const maxRows = 1000
      if (limit > maxRows) {
        limit = maxRows
      }
      const search       = request.input('search', '')
      const searchValue  = search || request.input('search.value', '')
      const sortField    = request.input('sortField')
      const sortOrder    = request.input('sortOrder')
      const customerId   = request.input('customerId')
      const source       = request.input('source')
      const status       = request.input('status')
      const startDate    = request.input('startDate')
      const endDate      = request.input('endDate')

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
        .preload('quotation', (query) => {
          query.select(['id', 'noQuotation', 'description'])
        })
      // ✅ TEMP: Always preload salesOrderItems for debugging
      dataQuery.preload('salesOrderItems', (query) => {
        query.preload('product', (productQuery) => {
          productQuery.select(['id', 'name', 'priceSell', 'sku'])
        })
        .preload('warehouse', (warehouseQuery) => {
          warehouseQuery.select(['id', 'name', 'code'])
        })
      })
      
      

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

      if (startDate && startDate.trim() !== '') {
        // Validasi format tanggal
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate)) {
        } else {
          dataQuery.where('date', '>=', startDate)
        }
      }
      if (endDate && endDate.trim() !== '') {
        // Validasi format tanggal
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(endDate)) {
        } else {
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
              // ✅ Tambah: cari produk berdasarkan SKU, NAME, atau NO_INTERCHANGE
              .orWhereExists((itemQuery) => {
                itemQuery
                  .from('sales_order_items as soi')
                  .leftJoin('products as p', 'soi.product_id', 'p.id')
                  .whereColumn('soi.sales_order_id', 'sales_orders.id')
                  .whereRaw('LOWER(p.sku) LIKE ?', [`%${lowerSearch}%`])
                  .orWhereRaw('LOWER(p.name) LIKE ?', [`%${lowerSearch}%`])
                  .orWhereRaw('LOWER(p.no_interchange) LIKE ?', [`%${lowerSearch}%`])
              })
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
            quotation: { table: 'quotations', foreignKey: 'sales_orders.quotation_id', primaryKey: 'quotations.id' },
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

      // ✅ Default ordering dengan data terbaru di atas
      if (!customOrder) {
        dataQuery.orderBy('created_at', 'desc').orderBy('id', 'desc')
      } else {
        // ✅ Tambahkan secondary ordering untuk memastikan konsistensi
        // Jika sorting bukan berdasarkan created_at, tambahkan created_at sebagai secondary sort
        if (sortField !== 'created_at' && !sortField.includes('created_at')) {
          dataQuery.orderBy('created_at', 'desc').orderBy('id', 'desc')
        }
      }

      // ✅ OPTIMASI: Add query performance monitoring
      const startTime   = Date.now()

      const salesOrders = await dataQuery.paginate(page, limit)
      const queryTime   = Date.now() - startTime

      // ✅ Log slow queries untuk monitoring
      if (queryTime > 1000) {
        console.warn(`🐌 Slow Query Alert: Sales Orders took ${queryTime}ms`)
      }

      
      
      

      const responseData = {
        ...salesOrders.toJSON(),
        _meta: {
          queryTime: queryTime,
          totalQueries: 'optimized'
        }
      }
      
      
      
      return response.ok(responseData)
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
        .preload('quotation', (query) => {
          query.select(['id', 'noQuotation', 'description'])
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

  async store({ request, response, auth }: HttpContext) {
    // Fungsi generateNo untuk no_so dengan format 0000/APU/SO/Bulan dalam angka romawi/tahun
    async function generateNo() {
      // Ambil nomor urut terakhir dari SO tahun ini
      const now   = new Date()
      const bulan = now.getMonth() + 1
      const tahun = now.getFullYear()

      // Konversi bulan ke angka romawi
      const bulanRomawi = toRoman(bulan)

      // Cari nomor urut terakhir untuk tahun ini (tidak berdasarkan bulan)
      const lastSo = await SalesOrder
          .query()
          .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun])
          .orderBy('no_so', 'desc')
          .first()

      let lastNumber = 0
      if (lastSo && lastSo.noSo) {
          // Ambil 4 digit pertama dari no_so terakhir
          const match = lastSo.noSo.match(/^(\d{4})/)
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
        // Validasi file tidak kosong
        if (!payload.attachment.size || payload.attachment.size === 0) {
          throw new Error('File attachment kosong atau tidak valid')
        }

        // Validasi file type
        const fileType = payload.attachment.type || ''
        const fileExtension = payload.attachment.clientName?.split('.').pop()?.toLowerCase() || ''

        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml'
        ]

        const allowedExtensions = ['pdf', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

        const isValidMimeType = allowedMimeTypes.includes(fileType)
        const isValidExtension = allowedExtensions.includes(fileExtension)

        if (!isValidMimeType && !isValidExtension) {
          throw new Error(`File harus berupa PDF, Excel, atau gambar. Detected: MIME=${fileType}, Ext=${fileExtension}`)
        }

        // Validasi file size (10MB)
        const maxSize = 10 * 1024 * 1024
        if (payload.attachment.size > maxSize) {
          throw new Error('Ukuran file terlalu besar (maksimal 10MB)')
        }

        const uploadResult = await this.storageService.uploadFile(
          payload.attachment,
          'sales_orders',
          true // public
        )

        attachmentPath = uploadResult.url

      } catch (err) {
        console.error('Attachment upload failed:', err)
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
          quotationId    : payload.quotationId,
          noPo           : payload.noPo,
          noSo           : payload.noSo || await generateNo(),
          up             : payload.up,
          termOfPayment  : payload.termOfPayment,
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

      // ✅ OPTIMIZED: Bulk insert instead of loop
      if (items.length > 0) {
        await SalesOrderItem.createMany(
          items.map(item => ({
            salesOrderId: so.id,
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
            price: item.price,
            description: item.description,
            subtotal: item.subtotal,
            statusPartial: item.statusPartial || false,
            deliveredQty: item.deliveredQty || 0,
          })),
          { client: trx }
        )
      }

      await trx.commit()

      // Log activity
      await ActivityLogger.create({ request, response, auth } as HttpContext, 'sales_order', so.id, so.noSo)

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

        // Handle file upload
        let attachmentPath = so.attachment

        if (payload.attachment && payload.attachment instanceof MultipartFile) {
            try {
                // Validasi file tidak kosong
                if (!payload.attachment.size || payload.attachment.size === 0) {
                    throw new Error('File attachment kosong atau tidak valid')
                }

                // Validasi file type
                const fileType = payload.attachment.type || ''
                const fileExtension = payload.attachment.clientName?.split('.').pop()?.toLowerCase() || ''

                const allowedMimeTypes = [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'image/svg+xml'
                ]

                const allowedExtensions = ['pdf', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

                const isValidMimeType = allowedMimeTypes.includes(fileType)
                const isValidExtension = allowedExtensions.includes(fileExtension)

                if (!isValidMimeType && !isValidExtension) {
                    throw new Error(`File harus berupa PDF, Excel, atau gambar. Detected: MIME=${fileType}, Ext=${fileExtension}`)
                }

                // Validasi file size (10MB)
                const maxSize = 10 * 1024 * 1024
                if (payload.attachment.size > maxSize) {
                    throw new Error('Ukuran file terlalu besar (maksimal 10MB)')
                }

                const uploadResult = await this.storageService.uploadFile(
                    payload.attachment,
                    'sales_orders',
                    true // public
                )

                attachmentPath = uploadResult.url

            } catch (err) {
                console.error('Attachment upload failed:', err)
                return response.internalServerError({
                    message: 'Gagal menyimpan file attachment',
                    error: err.message,
                })
            }
        }

        const subtotal      = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
        const discount      = subtotal * (payload.discountPercent || 0) / 100
        const afterDiscount = subtotal - discount
        const tax           = afterDiscount * (payload.taxPercent || 0) / 100
        const total         = afterDiscount + tax

        // ✅ REMOVED: oldStatus tidak digunakan lagi karena tidak ada automatic invoice creation
        // const oldStatus = so.status
        const newStatus = payload.status || 'draft'

        // Update SO utama
        so.merge({
        customerId     : payload.customerId,
        perusahaanId   : payload.perusahaanId,
        cabangId       : payload.cabangId,
        quotationId    : payload.quotationId,
        noPo           : payload.noPo,
        noSo           : payload.noSo,
        up             : payload.up,
        termOfPayment  : payload.termOfPayment,
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

        // ✅ REMOVED: Automatic invoice creation - Invoice akan dibuat manual oleh user
        // let createdInvoice = null
        // if (oldStatus !== newStatus && newStatus === 'delivered') {
        //   createdInvoice = await this.createInvoiceForNewDelivery(so, newStatus)
        // }

        // ✅ OPTIMIZED: Bulk operations instead of loop
        await SalesOrderItem.query({ client: trx })
        .where('sales_order_id', so.id)
        .delete()

        if (items.length > 0) {
          // ✅ Single bulk insert instead of loop
          await SalesOrderItem.createMany(
            items.map(item => ({
              salesOrderId: so.id,
              productId: item.productId,
              warehouseId: item.warehouseId,
              quantity: item.quantity,
              price: item.price,
              description: item.description,
              subtotal: item.subtotal,
              statusPartial: item.statusPartial || false,
              deliveredQty: item.deliveredQty || 0,
            })),
            { client: trx }
          )
        }

        await trx.commit()

        return response.ok({
        message: 'Sales Order berhasil diperbarui',
        data: so.serialize()
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

        // Log activity
        await ActivityLogger.approve({ request: { input: () => {} } as any, response, auth } as HttpContext, 'sales_order', so.id, so.noSo)

        return response.ok({
            message: 'Sales Order berhasil diapprove',
            data: {
                salesOrder: so.serialize(),
                invoice: null // Tidak ada invoice yang dibuat saat approve
            }
        })
    } catch (error) {
        console.error('Error approving sales order:', error)
        return response.internalServerError({
          message: 'Gagal mengapprove Sales Order',
          error: error.message
        })
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

        // Log activity
        await ActivityLogger.reject({ request: { input: () => {} } as any, response, auth } as HttpContext, 'sales_order', so.id, so.noSo)

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
        .preload('quotation', (query) => {
          query.select(['id', 'noQuotation', 'description'])
        })
        .preload('salesOrderItems', (query) => {
          query.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'priceSell', 'sku'])
          })
          .preload('warehouse', (warehouseQuery) => {
            warehouseQuery.select(['id', 'name', 'code'])
          })
          .preload('salesReturnItems', (sriQuery) => {
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

  // ✅ REMOVED: Automatic invoice creation disabled
  // Invoice akan dibuat manual oleh user dari halaman Sales Invoice
  /*
  private async createInvoiceForNewDelivery(salesOrder: SalesOrder, newStatus: string, _allItemsDelivered = false) {
    // Method ini sudah tidak digunakan - invoice akan dibuat manual
    return null
  }
  */

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

  async getSalesStatistics({ response }: HttpContext) {
    try {
      const now = DateTime.now()

      // 1. Total nominal transaksi 1 bulan terakhir
      const oneMonthAgo = now.minus({ months: 1 }).toISODate()
      const lastMonthSales = await SalesOrder.query()
        .where('status', 'delivered')
        .where('created_at', '>=', oneMonthAgo)
        .sum('total as totalAmount')

      const lastMonthTotal = Number(lastMonthSales[0]?.$extras.totalAmount || 0)

      // 2. Total nominal transaksi 2 bulan lalu untuk perbandingan
      const twoMonthsAgo = now.minus({ months: 2 }).toISODate()
      const twoMonthsAgoSales = await SalesOrder.query()
        .where('status', 'delivered')
        .where('created_at', '>=', twoMonthsAgo)
        .where('created_at', '<', oneMonthAgo)
        .sum('total as totalAmount')

      const twoMonthsAgoTotal = Number(twoMonthsAgoSales[0]?.$extras.totalAmount || 0)

      // 3. Data per minggu (4 minggu terakhir)
      const weeklyData = []
      for (let i = 0; i < 4; i++) {
        const weekStart = now.minus({ weeks: i + 1 }).startOf('week')
        const weekEnd = now.minus({ weeks: i }).startOf('week')

        const weekSales = await SalesOrder.query()
          .where('status', 'delivered')
          .where('created_at', '>=', weekStart.toISODate())
          .where('created_at', '<', weekEnd.toISODate())
          .sum('total as totalAmount')

        weeklyData.push({
          week: `Week ${4 - i}`,
          amount: Number(weekSales[0]?.$extras.totalAmount || 0),
          dateRange: `${weekStart.toFormat('dd/MM')} - ${weekEnd.minus({ days: 1 }).toFormat('dd/MM')}`
        })
      }

      // 4. Hitung performa penjualan (persentase perubahan)
      let performancePercentage = 0
      if (twoMonthsAgoTotal > 0) {
        performancePercentage = ((lastMonthTotal - twoMonthsAgoTotal) / twoMonthsAgoTotal) * 100
      }

      // 5. Data hari ini
      const today = now.startOf('day')
      const todaySales = await SalesOrder.query()
        .where('status', 'delivered')
        .where('created_at', '>=', today.toISODate())
        .sum('total as totalAmount')

      const todayTotal = Number(todaySales[0]?.$extras.totalAmount || 0)

      // 6. Data minggu ini
      const thisWeekStart = now.startOf('week')
      const thisWeekSales = await SalesOrder.query()
        .where('status', 'delivered')
        .where('created_at', '>=', thisWeekStart.toISODate())
        .sum('total as totalAmount')

      const thisWeekTotal = Number(thisWeekSales[0]?.$extras.totalAmount || 0)

      // 7. Data minggu lalu untuk perbandingan
      const lastWeekStart = now.minus({ weeks: 1 }).startOf('week')
      const lastWeekEnd = now.startOf('week')
      const lastWeekSales = await SalesOrder.query()
        .where('status', 'delivered')
        .where('created_at', '>=', lastWeekStart.toISODate())
        .where('created_at', '<', lastWeekEnd.toISODate())
        .sum('total as totalAmount')

      const lastWeekTotal = Number(lastWeekSales[0]?.$extras.totalAmount || 0)

      // 8. Hitung performa mingguan
      let weeklyPerformancePercentage = 0
      if (lastWeekTotal > 0) {
        weeklyPerformancePercentage = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
      }

      return response.ok({
        lastMonth: {
          total: lastMonthTotal,
          performance: performancePercentage
        },
        thisWeek: {
          total: thisWeekTotal,
          performance: weeklyPerformancePercentage
        },
        today: {
          total: todayTotal
        },
        weeklyData: weeklyData.reverse(), // Urutkan dari minggu terlama ke terbaru
        performance: {
          monthly: performancePercentage,
          weekly: weeklyPerformancePercentage
        }
      })
    } catch (error) {
      console.error('Error getting sales statistics:', error)
      return response.internalServerError({
        message: 'Gagal mengambil statistik penjualan',
        error: error.message
      })
    }
  }

  async getSalesByCustomer({ response }: HttpContext) {
    try {
      // Ambil data penjualan berdasarkan customer untuk 1 bulan terakhir
      const oneMonthAgo = DateTime.now().minus({ months: 1 }).toISODate()

      const salesByCustomer = await db
        .from('sales_orders')
        .select(
          'customers.name as customer_name',
          'customers.id as customer_id',
          db.raw('SUM(sales_orders.total) as total_sales')
        )
        .leftJoin('customers', 'sales_orders.customer_id', 'customers.id')
        .where('sales_orders.status', 'delivered')
        .where('sales_orders.created_at', '>=', oneMonthAgo)
        .groupBy('customers.id', 'customers.name')
        .orderBy('total_sales', 'desc')
        .limit(5)

      // Hitung total penjualan untuk subtitle
      const totalSales = salesByCustomer.reduce((sum, item) => sum + Number(item.total_sales), 0)

      // Format data untuk chart
      const chartData = salesByCustomer.map((item, index) => {
        const colors = ['#696cff', '#71dd37', '#ffab00', '#ff3e1d', '#03c3ec']
        return {
          customer: item.customer_name || 'Unknown Customer',
          sales: Number(item.total_sales),
          color: colors[index] || '#696cff',
          percentage: totalSales > 0 ? ((Number(item.total_sales) / totalSales) * 100).toFixed(1) : '0'
        }
      })

      return response.ok({
        totalSales: totalSales,
        customers: chartData
      })
    } catch (error) {
      console.error('Error getting sales by customer:', error)
      return response.internalServerError({
        message: 'Gagal mengambil data penjualan berdasarkan customer',
        error: error.message
      })
    }
  }

  async getTopProducts({ request, response }: HttpContext) {
    try {
      const limit = Math.min(Number(request.input('limit', 10)) || 10, 10)
      const period = request.input('period', '1m')

      // Tentukan rentang tanggal optional (default 1 bulan terakhir)
      let dateFrom: string | null = null
      const now = DateTime.now()
      if (period === '1m') {
        dateFrom = now.minus({ months: 1 }).toISODate()
      } else if (period === '3m') {
        dateFrom = now.minus({ months: 3 }).toISODate()
      } else if (period === '6m') {
        dateFrom = now.minus({ months: 6 }).toISODate()
      }

      // Ambil produk terlaris berdasarkan qty terkirim (delivered orders)
      const query = db
        .from('sales_order_items as soi')
        .leftJoin('sales_orders as so', 'soi.sales_order_id', 'so.id')
        .leftJoin('products as p', 'soi.product_id', 'p.id')
        .where('so.status', 'delivered')
        .groupBy('soi.product_id', 'p.name', 'p.sku')
        .select('soi.product_id as product_id', 'p.name as product_name', 'p.sku as product_sku')
        .select(db.raw('SUM(soi.quantity) as total_qty'))

      if (dateFrom) {
        query.where('so.created_at', '>=', dateFrom)
      }

      const rows = await query.orderByRaw('SUM(soi.quantity) DESC').limit(limit)

      return response.ok(rows.map((r) => ({
        productId: Number(r.product_id),
        name: r.product_name || `#${r.product_id}`,
        sku: r.product_sku || null,
        totalQty: Number(r.total_qty) || 0,
      })))
    } catch (error) {
      console.error('Error getting top products:', error)
      return response.internalServerError({
        message: 'Gagal mengambil produk terlaris',
        error: error.message,
      })
    }
  }

  async getNotifications({ request, response }: HttpContext) {
    try {
      const limit = request.input('limit', 10)
      const status = request.input('status', 'draft')

      let query = SalesOrder.query()
        .preload('customer')
        .preload('createdByUser')
        .preload('approvedByUser')
        .preload('rejectedByUser')
        .orderBy('created_at', 'desc')

      // Filter berdasarkan status yang memerlukan approval
      if (status === 'draft') {
        query = query.where('status', 'draft')
      } else if (status) {
        query = query.where('status', status)
      }

      const salesOrders = await query.limit(limit)

      const notifications = salesOrders.map(so => ({
        id: so.id,
        type: 'sales_order',
        noSo: so.noSo,
        status: so.status,
        createdAt: so.createdAt,
        createdBy: so.createdBy || '',
        createdByName: so.createdByUser?.fullName || 'Unknown',
        customerName: so.customer?.name || 'Unknown Customer',
        total: so.total || 0,
        description: so.description || ''
      }))

      return response.ok({
        message: 'Notifikasi sales order berhasil diambil',
        data: notifications
      })
    } catch (error) {
      console.error('Error fetching sales order notifications:', error)
      return response.internalServerError({
        message: 'Gagal mengambil notifikasi sales order',
        error: error.message
      })
    }
  }
}
