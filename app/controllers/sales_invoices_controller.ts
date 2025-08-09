import type { HttpContext } from '@adonisjs/core/http'
import { salesInvoiceValidator, updateSalesInvoiceValidator } from '#validators/sales_invoice'
import db from '@adonisjs/lucid/services/db'
import SalesInvoice from '#models/sales_invoice'
import SalesInvoiceItem from '#models/sales_invoice_item'

export default class SalesInvoicesController {
  async index({ request, response }: HttpContext) {
    try {
      const page         = request.input('page', 1)
      const limit        = request.input('rows', 10)
      const search       = request.input('search', '')
      const searchValue  = search || request.input('search.value', '')
      const sortField    = request.input('sortField')
      const sortOrder    = request.input('sortOrder')
      const customerId   = request.input('customerId')
      const status       = request.input('status')

      // ✅ OPTIMASI: Efficient base query dengan minimal preloading
      let dataQuery = SalesInvoice.query()
        .preload('salesOrder', (soQuery) => {
          soQuery.select(['id', 'noSo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description', 'customerId', 'perusahaanId', 'cabangId'])

          // Safe preloading dengan conditional loading
          soQuery.preload('customer', (customerQuery) => {
            customerQuery.select(['id', 'name', 'email', 'phone', 'npwp'])
          })

          soQuery.preload('perusahaan', (perusahaanQuery) => {
            perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan'])
          })

          soQuery.preload('cabang', (cabangQuery) => {
            cabangQuery.select(['id', 'nmCabang', 'perusahaanId'])
          })

          soQuery.preload('salesOrderItems', (soiQuery) => {
            soiQuery.where('statusPartial', true)
            soiQuery.preload('product', (productQuery) => {
              productQuery.select(['id', 'name', 'priceSell', 'sku'])
            })
          })
        })
        // Preload direct customer dari SalesInvoice juga
        .preload('customer', (customerQuery) => {
          customerQuery.select(['id', 'name', 'email', 'phone'])
        })
        // ✅ PRELOAD: Sales Invoice Items dengan relationships
        .preload('salesInvoiceItems', (siiQuery) => {
          siiQuery.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'priceSell', 'sku'])
          })
          siiQuery.preload('warehouse', (warehouseQuery) => {
            warehouseQuery.select(['id', 'name'])
          })
          siiQuery.preload('salesOrderItem', (soiQuery) => {
            soiQuery.select(['id', 'quantity', 'price', 'subtotal', 'statusPartial'])
          })
        })

      if (customerId) {
        dataQuery.where('customer_id', customerId)
      }
      if (status) {
        dataQuery.where('status', status)
      }

      if (searchValue) {
        // ✅ OPTIMASI: Menggunakan exists() untuk relationship search
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
              .whereRaw('LOWER(sales_invoices.no_invoice) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(sales_invoices.status) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(sales_invoices.description) LIKE ?', [`%${lowerSearch}%`])
              .orWhereExists((salesOrderQuery) => {
                salesOrderQuery
                  .from('sales_orders')
                  .whereColumn('sales_orders.id', 'sales_invoices.sales_order_id')
                  .whereRaw('LOWER(sales_orders.no_so) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((customerQuery) => {
                customerQuery
                  .from('customers')
                  .whereColumn('customers.id', 'sales_invoices.customer_id')
                  .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((userQuery) => {
                userQuery
                  .from('users')
                  .whereColumn('users.id', 'sales_invoices.created_by')
                  .whereRaw('LOWER(users.full_name) LIKE ?', [`%${lowerSearch}%`])
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
            customer: { table: 'customers', foreignKey: 'sales_invoices.customer_id', primaryKey: 'customers.id' },
            salesOrder: { table: 'sales_orders', foreignKey: 'sales_invoices.sales_order_id', primaryKey: 'sales_orders.id' },
            createdByUser: { table: 'users as created_users', foreignKey: 'sales_invoices.created_by', primaryKey: 'created_users.id' },
            updatedByUser: { table: 'users as updated_users', foreignKey: 'sales_invoices.updated_by', primaryKey: 'updated_users.id' },
          }

          if (relation in relationJoinInfo) {
            const joinInfo = relationJoinInfo[relation]
            dataQuery
              .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
              .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
              .select('sales_invoices.*')
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

      // ✅ OPTIMASI: Add query performance monitoring dengan safe preloading
      const startTime = Date.now()

      try {
        const salesInvoices = await dataQuery.paginate(page, limit)
        const queryTime = Date.now() - startTime

        // ✅ Log slow queries untuk monitoring
        if (queryTime > 1000) {
          console.warn(`🐌 Slow Query Alert: Sales Invoices took ${queryTime}ms`)
        }

        return response.ok({
          ...salesInvoices.toJSON(),
          _meta: {
            queryTime: queryTime,
            totalQueries: 'optimized'
          }
        })
      } catch (preloadError) {
        // ✅ Fallback: Query tanpa preloading yang bermasalah
        console.warn('⚠️  Preloading error, falling back to basic query:', preloadError.message)

        const fallbackQuery = SalesInvoice.query()
          .preload('salesOrder', (soQuery) => {
            soQuery.select(['id', 'noSo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description'])
            // Minimal preloading untuk salesOrderItems saja
            soQuery.preload('salesOrderItems', (soiQuery) => {
              soiQuery.where('statusPartial', true)
              soiQuery.preload('product', (productQuery) => {
                productQuery.select(['id', 'name', 'priceSell', 'sku'])
              })
            })
          })
          .preload('customer', (customerQuery) => {
            customerQuery.select(['id', 'name', 'email', 'phone'])
          })

        // Apply same filters
        if (customerId) {
          fallbackQuery.where('customer_id', customerId)
        }
        if (status) {
          fallbackQuery.where('status', status)
        }
        if (searchValue) {
          const lowerSearch = searchValue.toLowerCase()
          fallbackQuery.where((query) => {
            query
              .whereRaw('LOWER(sales_invoices.no_invoice) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(sales_invoices.status) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(sales_invoices.description) LIKE ?', [`%${lowerSearch}%`])
          })
        }

                // Apply sorting to fallback query
        if (sortField && sortOrder) {
          const actualSortOrder = sortOrder === '1' ? 'asc' : 'desc'
          const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

          if (!sortField.includes('.')) {
            const dbColumn = toSnakeCase(sortField)
            fallbackQuery.orderBy(dbColumn, actualSortOrder)
          } else {
            // For relationship sorting, use simple created_at order
            fallbackQuery.orderBy('created_at', 'desc')
          }
        } else {
          fallbackQuery.orderBy('created_at', 'desc')
        }

        const salesInvoices = await fallbackQuery.paginate(page, limit)
        const queryTime = Date.now() - startTime

        return response.ok({
          ...salesInvoices.toJSON(),
          _meta: {
            queryTime: queryTime,
            totalQueries: 'fallback_mode',
            warning: 'Some relationships may not be fully loaded due to data inconsistencies'
          }
        })
      }
    } catch (error) {
      return response.internalServerError({
          message: 'Terjadi kesalahan saat mengambil data sales invoice',
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
      const salesInvoice = await SalesInvoice.query()
        .where('id', params.id)
        .preload('salesOrder', (soQuery) => {
          soQuery.preload('customer', (customerQuery) => {
            customerQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
          })
          soQuery.preload('perusahaan', (perusahaanQuery) => {
            perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan'])
          })
          soQuery.preload('cabang', (cabangQuery) => {
            cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
          })
          soQuery.preload('salesOrderItems', (soiQuery) => {
            soiQuery.where('statusPartial', true)
            soiQuery.preload('product', (productQuery) => {
              productQuery.preload('unit', (unitQuery) => {
                unitQuery.select(['id', 'name'])
              })
              productQuery.select(['id', 'name', 'priceSell', 'sku', 'unitId'])
            })
          })
        })
        .preload('customer', (customerQuery) => {
          customerQuery.select(['id', 'name', 'email', 'phone', 'address'])
        })
        // ✅ PRELOAD: Sales Invoice Items dengan relationships
        .preload('salesInvoiceItems', (siiQuery) => {
          siiQuery.preload('product', (productQuery) => {
            productQuery.preload('unit', (unitQuery) => {
              unitQuery.select(['id', 'name'])
            })
            productQuery.select(['id', 'name', 'priceSell', 'sku', 'unitId'])
          })
          siiQuery.preload('warehouse', (warehouseQuery) => {
            warehouseQuery.select(['id', 'name'])
          })
          siiQuery.preload('salesOrderItem', (soiQuery) => {
            soiQuery.select(['id', 'quantity', 'price', 'subtotal', 'statusPartial', 'deliveredQty'])
          })
        })
        .firstOrFail()

      return response.ok({
        data: salesInvoice.serialize()
      })
    } catch (error) {
      return response.notFound({
        message: 'Sales Invoice tidak ditemukan',
        error: error.message
      })
    }
  }

  async store({ request, response }: HttpContext) {
    // Ambil bulan dan tahun saat ini
    const now   = new Date()
    const bulan = String(now.getMonth() + 1).padStart(2, '0')
    const tahun = String(now.getFullYear()).slice(-2)

    // Hitung nomor urut invoice bulan ini dengan mengambil nomor urut tertinggi
    const currentMonthPattern = `-${bulan}${tahun}`

    // Ambil nomor invoice tertinggi untuk bulan ini
    const lastInvoice = await SalesInvoice.query()
      .whereRaw(`no_invoice LIKE '%${currentMonthPattern}'`)
      .orderByRaw(`CAST(SUBSTRING(no_invoice, 1, 4) AS INTEGER) DESC`)
      .first()

    let nextNumber = 1
    if (lastInvoice && lastInvoice.noInvoice) {
      // Extract nomor urut dari format 0001-0625
      const match = lastInvoice.noInvoice.match(/^(\d{4})-/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const noUrut    = String(nextNumber).padStart(4, '0')
    const noInvoice = `${noUrut}-${bulan}${tahun}`

    const payload   = await request.validateUsing(salesInvoiceValidator)
    const items     = payload.salesInvoiceItems || []

    const trx = await db.transaction()

    try {
      const SalesInv = await SalesInvoice.create({
          salesOrderId   : payload.salesOrderId,
          customerId     : payload.customerId,
          noInvoice      : noInvoice,
          up             : payload.up || '',
          date           : payload.date,
          dueDate        : payload.dueDate,
          status         : payload.status || 'unpaid',
          discountPercent: payload.discountPercent || 0,
          taxPercent     : payload.taxPercent || 0,
          dpp            : payload.dpp || 0,
          total          : payload.total, // Sudah grand total dari frontend
          paidAmount     : payload.paidAmount || 0,
          remainingAmount: payload.remainingAmount || (payload.total - (payload.paidAmount || 0)),
          description    : payload.description || '',
      }, { client: trx })

      // ✅ BUAT SALES INVOICE ITEMS
      for (const item of items) {
        await SalesInvoiceItem.create({
          salesInvoiceId  : SalesInv.id,
          salesOrderItemId: item.salesOrderItemId,
          productId       : Number(item.productId),
          warehouseId     : Number(item.warehouseId),
          quantity        : Number(item.quantity),
          price           : Number(item.price),
          subtotal        : Number(item.subtotal),
          description     : item.description,
          deliveredQty    : Number(item.deliveredQty || 0),
          isReturned      : item.isReturned || false,
        }, { client: trx })
      }

      await trx.commit()

      return response.created({
          message: 'Sales Invoice berhasil dibuat',
          data: SalesInv,
      })
      } catch (error) {
      await trx.rollback()
      console.error('SI Error:', error)
      return response.internalServerError({
          message: 'Gagal membuat Sales Invoice',
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const salesInvoice = await SalesInvoice.findOrFail(params.id)
      const payload = await request.validateUsing(updateSalesInvoiceValidator)
      const items = payload.salesInvoiceItems || []

      // Update sales invoice
      const updateData: any = {}

      if (payload.salesOrderId !== undefined) updateData.salesOrderId = payload.salesOrderId
      if (payload.customerId !== undefined) updateData.customerId = payload.customerId
      if (payload.up !== undefined) updateData.up = payload.up
      if (payload.date !== undefined) updateData.date = payload.date
      if (payload.dueDate !== undefined) updateData.dueDate = payload.dueDate
      if (payload.status !== undefined) updateData.status = payload.status
      if (payload.discountPercent !== undefined) updateData.discountPercent = payload.discountPercent
      if (payload.taxPercent !== undefined) updateData.taxPercent = payload.taxPercent
      if (payload.dpp !== undefined) updateData.dpp = payload.dpp
      if (payload.total !== undefined) updateData.total = payload.total
      if (payload.paidAmount !== undefined) updateData.paidAmount = payload.paidAmount
      if (payload.remainingAmount !== undefined) updateData.remainingAmount = payload.remainingAmount
      if (payload.description !== undefined) updateData.description = payload.description

      salesInvoice.merge(updateData)

      await salesInvoice.save()

      // ✅ UPDATE SALES INVOICE ITEMS jika ada
      if (items.length > 0) {
        // Hapus item lama
        await SalesInvoiceItem.query({ client: trx })
          .where('salesInvoiceId', salesInvoice.id)
          .delete()

        // Buat item baru
        for (const item of items) {
          await SalesInvoiceItem.create({
            salesInvoiceId  : salesInvoice.id,
            salesOrderItemId: item.salesOrderItemId,
            productId       : Number(item.productId),
            warehouseId     : Number(item.warehouseId),
            quantity        : Number(item.quantity),
            price           : Number(item.price),
            subtotal        : Number(item.subtotal),
            description     : item.description,
            deliveredQty    : Number(item.deliveredQty || 0),
            isReturned      : item.isReturned || false,
          }, { client: trx })
        }
      }

      await trx.commit()

      return response.ok({
        message: 'Sales Invoice berhasil diperbarui',
        data: salesInvoice,
      })
    } catch (error) {
      console.log('🔍 Update Error:', error)
      await trx.rollback()
      console.error('Update Sales Invoice Error:', error)

      if (error.status === 404) {
        return response.notFound({
          message: 'Sales Invoice tidak ditemukan',
        })
      }

      return response.internalServerError({
        message: 'Gagal memperbarui Sales Invoice',
        error: error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const salesInvoice = await SalesInvoice.findOrFail(params.id)

      // Check if sales invoice can be deleted (e.g., not paid yet)
      if (salesInvoice.status === 'paid') {
        return response.badRequest({
          message: 'Sales Invoice yang sudah dibayar tidak dapat dihapus',
        })
      }

      await salesInvoice.delete()
      await trx.commit()

      return response.ok({
        message: 'Sales Invoice berhasil dihapus',
      })
    } catch (error) {
      await trx.rollback()
      console.error('Delete Sales Invoice Error:', error)

      if (error.status === 404) {
        return response.notFound({
          message: 'Sales Invoice tidak ditemukan',
        })
      }

      return response.internalServerError({
        message: 'Gagal menghapus Sales Invoice',
        error: error.message,
      })
    }
  }

}
