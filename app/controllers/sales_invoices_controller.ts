import type { HttpContext } from '@adonisjs/core/http'
import { salesInvoiceValidator, updateSalesInvoiceValidator } from '#validators/sales_invoice'
import db from '@adonisjs/lucid/services/db'
import SalesInvoice from '#models/sales_invoice'
import SalesInvoiceItem from '#models/sales_invoice_item'

export default class SalesInvoicesController {
  // ✅ OPTIMIZED: Single aggregate query for all statistics
  async getInvoiceStatistics({ response }: HttpContext) {
    try {
      // ✅ Single query instead of 8 separate queries
      const stats = await db
        .from('sales_invoices')
        .select([
          db.raw('COUNT(*) as total_count'),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as unpaid_count', ['unpaid']),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as partial_count', ['partial']),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as paid_count', ['paid']),
          db.raw('SUM(CASE WHEN status = ? THEN total ELSE 0 END) as unpaid_total', ['unpaid']),
          db.raw('SUM(CASE WHEN status = ? THEN total ELSE 0 END) as partial_total', ['partial']),
          db.raw('SUM(CASE WHEN status = ? THEN total ELSE 0 END) as paid_total', ['paid']),
          db.raw('SUM(total) as grand_total')
        ])
        .first()

      const totalCount = Number(stats.total_count) || 0
      const unpaidCount = Number(stats.unpaid_count) || 0
      const partialCount = Number(stats.partial_count) || 0
      const paidCount = Number(stats.paid_count) || 0
      
      const unpaidAmount = Number(stats.unpaid_total) || 0
      const partialAmount = Number(stats.partial_total) || 0
      const paidAmount = Number(stats.paid_total) || 0
      const grandAmount = Number(stats.grand_total) || 0

      // Hitung total outstanding (unpaid + partial)
      const outstandingTotal = unpaidAmount + partialAmount

      return response.ok({
        message: 'Statistik invoice berhasil diambil',
        data: {
          counts: {
            total: totalCount,
            unpaid: unpaidCount,
            partial: partialCount,
            paid: paidCount
          },
          amounts: {
            total: grandAmount,
            unpaid: unpaidAmount,
            partial: partialAmount,
            paid: paidAmount,
            outstanding: outstandingTotal
          },
          percentages: {
            unpaid: totalCount > 0 ? Math.round((unpaidCount / totalCount) * 100) : 0,
            partial: totalCount > 0 ? Math.round((partialCount / totalCount) * 100) : 0,
            paid: totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0
          }
        }
      })
    } catch (error) {
      console.error('❌ Error getting invoice statistics:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil statistik invoice',
        error: {
          name: error.name,
          status: error.status || 500,
          code: error.code,
          message: error.message,
        },
      })
    }
  }

  async index({ request, response }: HttpContext) {
    try {
      const page         = parseInt(request.input('page', '1'), 10) || 1
      const limit        = parseInt(request.input('rows', '10'), 10) || 10
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
        console.warn('⚠️  Preloading error, falling back to basic query')

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
          // ✅ TAMBAHAN: Preload salesInvoiceItems dengan product di fallback query
          .preload('salesInvoiceItems', (siiQuery) => {
            siiQuery.preload('product', (productQuery) => {
              productQuery.select(['id', 'name', 'priceSell', 'sku'])
            })
            siiQuery.preload('warehouse', (warehouseQuery) => {
              warehouseQuery.select(['id', 'name'])
            })
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

    try {
      const payload = await request.validateUsing(salesInvoiceValidator)
      
      // ✅ FIX: Validasi perusahaanId harus ada untuk generate nomor invoice
      if (!payload.perusahaanId) {
        return response.badRequest({
          message: 'Perusahaan ID harus diisi untuk generate nomor invoice',
          error: 'perusahaan_id_required'
        })
      }

      // Hitung nomor urut invoice tahun ini dengan mengambil nomor urut tertinggi
      // ✅ FIX: Dipisahkan berdasarkan perusahaan_id
      // Cari semua invoice yang berakhiran dengan tahun saat ini (tidak berdasarkan bulan)
      const currentYearPattern = `-${tahun}`
      const currentYearPattern4Digit = `-${now.getFullYear()}`

      // Ambil nomor invoice tertinggi untuk tahun ini dari perusahaan yang sama
      // TIDAK berdasarkan bulan, hanya berdasarkan tahun dan perusahaan_id
      const lastInvoice = await SalesInvoice.query()
        .where('perusahaan_id', payload.perusahaanId)
        .where((query) => {
          query
            .whereRaw(`no_invoice LIKE '%${currentYearPattern4Digit}'`) // Format -YYYY
            .orWhereRaw(`no_invoice LIKE '%${currentYearPattern}'`) // Format -YY (semua bulan dalam tahun yang sama)
            .orWhereRaw(`no_invoice LIKE '%${tahun}'`) // Format -MMYY (semua bulan dalam tahun yang sama)
        })
        .orderByRaw(`CAST(SUBSTRING(no_invoice, 1, 4) AS INTEGER) DESC`)
        .first()

      let nextNumber = 1
      if (lastInvoice && lastInvoice.noInvoice) {
        // Extract nomor urut dari format apapun (0001-YYYY, 0001-YY, atau 0001-MMYY)
        const match = lastInvoice.noInvoice.match(/^(\d{4})-/)
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1
        }
      }

      const noUrut    = String(nextNumber).padStart(4, '0')
      const noInvoice = `${noUrut}-${bulan}${tahun}`

      const items = payload.salesInvoiceItems || []

      // ✅ VALIDASI TAMBAHAN: Pastikan data yang diperlukan ada
      if (!payload.customerId) {
        return response.badRequest({
          message: 'Customer ID harus diisi',
          error: 'customerId_required'
        })
      }

      if (!payload.date || !payload.dueDate) {
        return response.badRequest({
          message: 'Tanggal invoice dan jatuh tempo harus diisi',
          error: 'date_required'
        })
      }

      if (!payload.total || payload.total <= 0) {
        return response.badRequest({
          message: 'Total invoice harus lebih dari 0',
          error: 'invalid_total'
        })
      }

      // ✅ VALIDASI: Jika ada sales order, pastikan sales order exists
      if (payload.salesOrderId) {
        const salesOrder = await db.from('sales_orders').where('id', payload.salesOrderId).first()
        if (!salesOrder) {
          return response.badRequest({
            message: 'Sales Order tidak ditemukan',
            error: 'sales_order_not_found'
          })
        }
      }

      // ✅ VALIDASI: Pastikan customer exists
      const customer = await db.from('customers').where('id', payload.customerId).first()
      if (!customer) {
        return response.badRequest({
          message: 'Customer tidak ditemukan',
          error: 'customer_not_found'
        })
      }

      const trx = await db.transaction()

      try {
        const SalesInv = await SalesInvoice.create({
            salesOrderId   : payload.salesOrderId || null,
            customerId     : payload.customerId,
            perusahaanId   : payload.perusahaanId || null,
            noInvoice      : noInvoice,
            email          : payload.email || '',
            up             : payload.up || '',
            date           : payload.date,
            dueDate        : payload.dueDate,
            status         : payload.status || 'unpaid',
            discountPercent: payload.discountPercent || 0,
            taxPercent     : payload.taxPercent || 0,
            dpp            : payload.dpp || 0,
            total          : payload.total,
            paidAmount     : payload.paidAmount || 0,
            remainingAmount: payload.remainingAmount || (payload.total - (payload.paidAmount || 0)),
            description    : payload.description || '',
            ttdDigital     : payload.ttdDigital || false,
        }, { client: trx })

        // ✅ BUAT SALES INVOICE ITEMS dengan validasi
        if (items.length > 0) {
          for (const item of items) {
            // ✅ VALIDASI: Pastikan product exists
            if (item.productId) {
              const product = await db.from('products').where('id', item.productId).first()
              if (!product) {
                throw new Error(`Product dengan ID ${item.productId} tidak ditemukan`)
              }
            }

            // ✅ VALIDASI: Pastikan warehouse exists jika ada
            if (item.warehouseId) {
              const warehouse = await db.from('warehouses').where('id', item.warehouseId).first()
              if (!warehouse) {
                throw new Error(`Warehouse dengan ID ${item.warehouseId} tidak ditemukan`)
              }
            }

            // ✅ VALIDASI: Pastikan sales order item exists jika ada
            if (item.salesOrderItemId) {
              const salesOrderItem = await db.from('sales_order_items').where('id', item.salesOrderItemId).first()
              if (!salesOrderItem) {
                throw new Error(`Sales Order Item dengan ID ${item.salesOrderItemId} tidak ditemukan`)
              }
            }

            await SalesInvoiceItem.create({
              salesInvoiceId  : SalesInv.id,
              salesOrderItemId: item.salesOrderItemId || null,
              productId       : Number(item.productId),
              warehouseId     : item.warehouseId ? Number(item.warehouseId) : null,
              quantity        : Number(item.quantity) || 0,
              price           : Number(item.price) || 0,
              subtotal        : Number(item.subtotal) || 0,
              description     : item.description || '',
              deliveredQty    : Number(item.deliveredQty || 0),
              isReturned      : item.isReturned || false,
            }, { client: trx })
          }
        }

        await trx.commit()

        return response.created({
            message: 'Sales Invoice berhasil dibuat',
            data: SalesInv,
        })
      } catch (error) {
        await trx.rollback()
        console.error('❌ Sales Invoice Creation Error:', error)

        // ✅ ERROR HANDLING: Berikan pesan error yang lebih spesifik
        if (error.message.includes('foreign key constraint')) {
          return response.badRequest({
            message: 'Data referensi tidak valid. Pastikan customer, product, dan warehouse yang dipilih ada.',
            error: 'foreign_key_constraint_failed',
            details: error.message
          })
        }

        if (error.message.includes('duplicate key')) {
          return response.badRequest({
            message: 'Nomor invoice sudah ada. Silakan coba lagi.',
            error: 'duplicate_invoice_number'
          })
        }

        return response.internalServerError({
          message: 'Gagal membuat Sales Invoice',
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
      }
    } catch (validationError) {
      console.error('❌ Validation Error:', validationError)
      
      // ✅ VineJS Error Structure: Return proper validation errors
      return response.unprocessableEntity({
        message: 'Data yang dikirim tidak valid',
        error: 'validation_failed',
        errors: validationError.messages || []
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
      if (payload.email !== undefined) updateData.email = payload.email
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
      if (payload.ttdDigital !== undefined) updateData.ttdDigital = payload.ttdDigital
      
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
