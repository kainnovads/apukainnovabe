import type { HttpContext } from '@adonisjs/core/http'
import SuratJalan from '#models/surat_jalan'

export default class SuratJalansController {
  async index({ request, response }: HttpContext) {
    try {
      const page         = request.input('page', 1)
      const limit        = request.input('rows', 10)
      const search       = request.input('search', '')
      const searchValue  = search || request.input('search.value', '')
      const sortField    = request.input('sortField')
      const sortOrder    = request.input('sortOrder')
      const customerId   = request.input('customerId')

      // ✅ OPTIMASI: Efficient base query dengan minimal preloading
      let dataQuery = SuratJalan.query()
        .preload('salesOrder', (soQuery) => {
          soQuery.select(['id', 'noSo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description', 'customerId', 'perusahaanId', 'cabangId'])

          // Safe preloading dengan conditional loading
          soQuery.preload('customer', (customerQuery) => {
            customerQuery.select(['id', 'name', 'email', 'phone', 'npwp'])
          })

          soQuery.preload('perusahaan', (perusahaanQuery) => {
            perusahaanQuery.select(['id', 'nmPerusahaan'])
          })

          soQuery.preload('cabang', (cabangQuery) => {
            cabangQuery.select(['id', 'nmCabang', 'perusahaanId'])
          })

          soQuery.preload('salesOrderItems', (soiQuery) => {
            soiQuery.preload('product', (productQuery) => {
              productQuery.select(['id', 'name', 'priceSell', 'sku'])
            })
          })
        })
        // Preload direct customer dari Surat Jalan juga
        .preload('customer', (customerQuery) => {
          customerQuery.select(['id', 'name', 'email', 'phone'])
        })
        // ✅ PRELOAD: Surat Jalan Items dengan relationships
        .preload('suratJalanItems', (siiQuery) => {
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

      if (searchValue) {
        // ✅ OPTIMASI: Menggunakan exists() untuk relationship search
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
              .whereRaw('LOWER(surat_jalans.no_surat_jalan) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(surat_jalans.description) LIKE ?', [`%${lowerSearch}%`])
              .orWhereExists((salesOrderQuery) => {
                salesOrderQuery
                  .from('sales_orders')
                  .whereColumn('sales_orders.id', 'surat_jalans.sales_order_id')
                  .whereRaw('LOWER(sales_orders.no_so) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((customerQuery) => {
                customerQuery
                  .from('customers')
                  .whereColumn('customers.id', 'surat_jalans.customer_id')
                  .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((userQuery) => {
                userQuery
                  .from('users')
                  .whereColumn('users.id', 'surat_jalans.created_by')
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
            customer: { table: 'customers', foreignKey: 'surat_jalans.customer_id', primaryKey: 'customers.id' },
            salesOrder: { table: 'sales_orders', foreignKey: 'surat_jalans.sales_order_id', primaryKey: 'sales_orders.id' },
            createdByUser: { table: 'users as created_users', foreignKey: 'surat_jalans.created_by', primaryKey: 'created_users.id' },
            updatedByUser: { table: 'users as updated_users', foreignKey: 'surat_jalans.updated_by', primaryKey: 'updated_users.id' },
          }

          if (relation in relationJoinInfo) {
            const joinInfo = relationJoinInfo[relation]
            dataQuery
              .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
              .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
              .select('surat_jalans.*')
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
        const suratJalans = await dataQuery.paginate(page, limit)
        const queryTime = Date.now() - startTime

        // ✅ Log slow queries untuk monitoring
        if (queryTime > 1000) {
          console.warn(`🐌 Slow Query Alert: Surat Jalans took ${queryTime}ms`)
        }

        return response.ok({
          ...suratJalans.toJSON(),
          _meta: {
            queryTime: queryTime,
            totalQueries: 'optimized'
          }
        })
      } catch (preloadError) {
        // ✅ Fallback: Query tanpa preloading yang bermasalah
        console.warn('⚠️  Preloading error, falling back to basic query:', preloadError.message)

        const fallbackQuery = SuratJalan.query()
          .preload('salesOrder', (soQuery) => {
            soQuery.select(['id', 'noSo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description'])
            // Minimal preloading untuk salesOrderItems saja
            soQuery.preload('salesOrderItems', (soiQuery) => {
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
        if (searchValue) {
          const lowerSearch = searchValue.toLowerCase()
          fallbackQuery.where((query) => {
            query
              .whereRaw('LOWER(surat_jalans.no_surat_jalan) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(surat_jalans.description) LIKE ?', [`%${lowerSearch}%`])
              .orWhereExists((salesOrderQuery) => {
                salesOrderQuery
                  .from('sales_orders')
                  .whereColumn('sales_orders.id', 'surat_jalans.sales_order_id')
                  .whereRaw('LOWER(sales_orders.no_so) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((customerQuery) => {
                customerQuery
                  .from('customers')
                  .whereColumn('customers.id', 'surat_jalans.customer_id')
                  .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((userQuery) => {
                userQuery
                  .from('users')
                  .whereColumn('users.id', 'surat_jalans.created_by')
                  .whereRaw('LOWER(users.full_name) LIKE ?', [`%${lowerSearch}%`])
              })
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

        const suratJalans = await fallbackQuery.paginate(page, limit)
        const queryTime = Date.now() - startTime

        return response.ok({
          ...suratJalans.toJSON(),
          _meta: {
            queryTime: queryTime,
            totalQueries: 'fallback_mode',
            warning: 'Some relationships may not be fully loaded due to data inconsistencies'
          }
        })
      }
    } catch (error) {
      return response.internalServerError({
          message: 'Terjadi kesalahan saat mengambil data surat jalan',
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
      const suratJalan = await SuratJalan.query()
        .where('id', params.id)
        .preload('salesOrder', (soQuery) => {
          soQuery.preload('customer', (customerQuery) => {
            customerQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
          })
          soQuery.preload('perusahaan', (perusahaanQuery) => {
            perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'logoPerusahaan'])
          })
          soQuery.preload('cabang', (cabangQuery) => {
            cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
          })
          soQuery.preload('salesOrderItems', (soiQuery) => {
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
        // ✅ PRELOAD: Surat Jalan Items dengan relationships
        .preload('suratJalanItems', (siiQuery) => {
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
        data: suratJalan.serialize()
      })
    } catch (error) {
      return response.notFound({
        message: 'Surat Jalan tidak ditemukan',
        error: error.message
      })
    }
  }
}
