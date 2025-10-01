import type { HttpContext } from '@adonisjs/core/http'
import { purchaseInvoiceValidator, updatePurchaseInvoiceValidator } from '#validators/purchase_invoice'
import db from '@adonisjs/lucid/services/db'
import PurchaseInvoice from '#models/purchase_invoice'
import PurchaseInvoiceItem from '#models/purchase_invoice_item'

export default class PurchaseInvoicesController {
  // ✅ OPTIMIZED: Single aggregate query for all purchase invoice statistics
  async getInvoiceStatistics({ response }: HttpContext) {
    try {
      // ✅ Single query instead of 8 separate queries
      const stats = await db
        .from('purchase_invoices')
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
        message: 'Statistik purchase invoice berhasil diambil',
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
      console.error('❌ Error getting purchase invoice statistics:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil statistik purchase invoice',
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
      const vendorId   = request.input('vendorId')
      const status       = request.input('status')

      // ✅ OPTIMASI: Efficient base query dengan minimal preloading
      let dataQuery = PurchaseInvoice.query()
        .preload('purchaseOrder', (poQuery) => {
          poQuery.select(['id', 'noPo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description', 'vendorId', 'perusahaanId', 'cabangId'])

          // Safe preloading dengan conditional loading
          poQuery.preload('vendor', (vendorQuery) => {
            vendorQuery.select(['id', 'name', 'email', 'phone', 'npwp'])
          })

          poQuery.preload('perusahaan', (perusahaanQuery) => {
            perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan'])
          })

          poQuery.preload('cabang', (cabangQuery) => {
            cabangQuery.select(['id', 'nmCabang', 'perusahaanId'])
          })
          
          poQuery.preload('createdByUser', (createdByUserQuery) => {
            createdByUserQuery.select(['id', 'fullName'])
          })

          poQuery.preload('purchaseOrderItems', (soiQuery) => {
            soiQuery.where('statusPartial', true)
            soiQuery.preload('product', (productQuery) => {
              productQuery.select(['id', 'name', 'priceSell', 'sku'])
            })
          })
        })
        // Preload direct vendor dari PurchaseInvoice juga
        .preload('vendor', (vendorQuery) => {
          vendorQuery.select(['id', 'name', 'email', 'phone'])
        })
        // ✅ PRELOAD: Perusahaan dan Cabang langsung dari PurchaseInvoice
        .preload('perusahaan', (perusahaanQuery) => {
          perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan'])
        })
        .preload('cabang', (cabangQuery) => {
          cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
        })
        // ✅ PRELOAD: CreatedByUser dan UpdatedByUser
        .preload('createdByUser', (createdByUserQuery) => {
          createdByUserQuery.select(['id', 'fullName'])
        })
        .preload('updatedByUser', (updatedByUserQuery) => {
          updatedByUserQuery.select(['id', 'fullName'])
        })
        // ✅ PRELOAD: Purchase Invoice Items dengan relationships
        .preload('purchaseInvoiceItems', (piiQuery) => {
          piiQuery.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'priceSell', 'sku'])
          })
          piiQuery.preload('warehouse', (warehouseQuery) => {
            warehouseQuery.select(['id', 'name'])
          })
          piiQuery.preload('purchaseOrderItem', (poiQuery) => {
            poiQuery.select(['id', 'quantity', 'price', 'subtotal', 'statusPartial'])
          })
        })

      if (vendorId) {
        dataQuery.where('vendor_id', vendorId)
      }
      if (status) {
        dataQuery.where('status', status)
      }

      if (searchValue) {
        // ✅ OPTIMASI: Menggunakan exists() untuk relationship search
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
              .whereRaw('LOWER(purchase_invoices.no_invoice) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(purchase_invoices.status) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(purchase_invoices.description) LIKE ?', [`%${lowerSearch}%`])
              .orWhereExists((purchaseOrderQuery) => {
                purchaseOrderQuery
                  .from('purchase_orders')
                  .whereColumn('purchase_orders.id', 'purchase_invoices.purchase_order_id')
                  .whereRaw('LOWER(purchase_orders.no_po) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((vendorQuery) => {
                vendorQuery
                  .from('vendors')
                  .whereColumn('vendors.id', 'purchase_invoices.vendor_id')
                  .whereRaw('LOWER(vendors.name) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((userQuery) => {
                userQuery
                  .from('users')
                  .whereColumn('users.id', 'purchase_invoices.created_by')
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
            vendor: { table: 'vendors', foreignKey: 'purchase_invoices.vendor_id', primaryKey: 'vendors.id' },
            purchaseOrder: { table: 'purchase_orders', foreignKey: 'purchase_invoices.purchase_order_id', primaryKey: 'purchase_orders.id' },
            createdByUser: { table: 'users as created_users', foreignKey: 'purchase_invoices.created_by', primaryKey: 'created_users.id' },
            updatedByUser: { table: 'users as updated_users', foreignKey: 'purchase_invoices.updated_by', primaryKey: 'updated_users.id' },
          }

          if (relation in relationJoinInfo) {
            const joinInfo = relationJoinInfo[relation]
            dataQuery
              .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
              .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
              .select('purchase_invoices.*')
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
        const purchaseInvoices = await dataQuery.paginate(page, limit)
        const queryTime = Date.now() - startTime

        // ✅ Log slow queries untuk monitoring
        if (queryTime > 1000) {
          console.warn(`🐌 Slow Query Alert: Purchase Invoices took ${queryTime}ms`)
        }

        return response.ok({
          ...purchaseInvoices.toJSON(),
          _meta: {
            queryTime: queryTime,
            totalQueries: 'optimized'
          }
        })
      } catch (preloadError) {
        // ✅ Fallback: Query tanpa preloading yang bermasalah
        console.warn('⚠️  Preloading error, falling back to basic query:', preloadError.message)

        const fallbackQuery = PurchaseInvoice.query()
          .preload('purchaseOrder', (poQuery) => {
            poQuery.select(['id', 'noPo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description'])
            // Minimal preloading untuk purchaseOrderItems saja
            poQuery.preload('purchaseOrderItems', (soiQuery) => {
              soiQuery.where('statusPartial', true)
              soiQuery.preload('product', (productQuery) => {
                productQuery.select(['id', 'name', 'priceSell', 'sku'])
              })
            })
          })
          .preload('vendor', (vendorQuery) => {
            vendorQuery.select(['id', 'name', 'email', 'phone'])
          })
          // ✅ TAMBAHAN: Preload purchaseInvoiceItems dengan product di fallback query
          .preload('purchaseInvoiceItems', (piiQuery) => {
            piiQuery.preload('product', (productQuery) => {
              productQuery.select(['id', 'name', 'priceSell', 'sku'])
            })
            piiQuery.preload('warehouse', (warehouseQuery) => {
              warehouseQuery.select(['id', 'name'])
            })
          })
          // ✅ TAMBAHAN: Preload perusahaan, cabang, dan user di fallback query
          .preload('perusahaan', (perusahaanQuery) => {
            perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan'])
          })
          .preload('cabang', (cabangQuery) => {
            cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
          })
          .preload('createdByUser', (createdByUserQuery) => {
            createdByUserQuery.select(['id', 'fullName'])
          })
          .preload('updatedByUser', (updatedByUserQuery) => {
            updatedByUserQuery.select(['id', 'fullName'])
          })

        // Apply same filters
        if (vendorId) {
          fallbackQuery.where('vendor_id', vendorId)
        }
        if (status) {
          fallbackQuery.where('status', status)
        }
        if (searchValue) {
          const lowerSearch = searchValue.toLowerCase()
          fallbackQuery.where((query) => {
            query
              .whereRaw('LOWER(purchase_invoices.no_invoice) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(purchase_invoices.status) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(purchase_invoices.description) LIKE ?', [`%${lowerSearch}%`])
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

        const purchaseInvoices = await fallbackQuery.paginate(page, limit)
        const queryTime = Date.now() - startTime

        return response.ok({
          ...purchaseInvoices.toJSON(),
          _meta: {
            queryTime: queryTime,
            totalQueries: 'fallback_mode',
            warning: 'Some relationships may not be fully loaded due to data inconsistencies'
          }
        })
      }
    } catch (error) {
      return response.internalServerError({
          message: 'Terjadi kesalahan saat mengambil data purchase invoice',
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
      const purchaseInvoice = await PurchaseInvoice.query()
        .where('id', params.id)
        .preload('purchaseOrder', (poQuery) => {
          poQuery.preload('vendor', (vendorQuery) => {
            vendorQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
          })
          poQuery.preload('perusahaan', (perusahaanQuery) => {
            perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan'])
          })
          poQuery.preload('cabang', (cabangQuery) => {
            cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
          })
          poQuery.preload('createdByUser', (createdByUserQuery) => {
            createdByUserQuery.select(['id', 'fullName'])
          })
          poQuery.preload('purchaseOrderItems', (poiQuery) => {
            poiQuery.where('statusPartial', true)
            poiQuery.preload('product', (productQuery) => {
              productQuery.preload('unit', (unitQuery) => {
                unitQuery.select(['id', 'name'])
              })
              productQuery.select(['id', 'name', 'priceSell', 'sku', 'unitId'])
            })
          })
        })
        .preload('vendor', (vendorQuery) => {
          vendorQuery.select(['id', 'name', 'email', 'phone', 'address'])
        })
        // ✅ PRELOAD: Purchase Invoice Items dengan relationships
        .preload('purchaseInvoiceItems', (piiQuery) => {
          piiQuery.preload('product', (productQuery) => {
            productQuery.preload('unit', (unitQuery) => {
              unitQuery.select(['id', 'name'])
            })
            productQuery.select(['id', 'name', 'priceSell', 'sku', 'unitId'])
          })
          piiQuery.preload('warehouse', (warehouseQuery) => {
            warehouseQuery.select(['id', 'name'])
          })
          piiQuery.preload('purchaseOrderItem', (poiQuery) => {
            poiQuery.select(['id', 'quantity', 'price', 'subtotal', 'statusPartial', 'receivedQty'])
          })
        })
        .firstOrFail()

      return response.ok({
        data: purchaseInvoice.serialize()
      })
    } catch (error) {
      return response.notFound({
        message: 'Purchase Invoice tidak ditemukan',
        error: error.message
      })
    }
  }

  async store({ request, response }: HttpContext) {
    // Ambil bulan dan tahun saat ini
    const now   = new Date()
    const bulan = String(now.getMonth() + 1).padStart(2, '0')
    const tahun = String(now.getFullYear()).slice(-2)

    // Hitung nomor urut invoice tahun ini dengan mengambil nomor urut tertinggi
    const currentYearPattern = `-${tahun}`

    // Ambil nomor invoice tertinggi untuk tahun ini (tidak berdasarkan bulan)
    const lastInvoice = await PurchaseInvoice.query()
      .whereRaw(`no_invoice LIKE '%${currentYearPattern}'`)
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

    try {
      const payload = await request.validateUsing(purchaseInvoiceValidator)
      const items = payload.purchaseInvoiceItems || []

      // ✅ DEBUG: Log payload untuk troubleshooting
      console.log('🔍 Backend Debug - Payload received:', {
        vendorId: payload.vendorId,
        purchaseOrderId: payload.purchaseOrderId,
        paymentDate: payload.paymentDate,
        paymentMethod: payload.paymentMethod,
        status: payload.status,
        total: payload.total,
        itemsCount: items.length
      })

      // ✅ VALIDASI TAMBAHAN: Pastikan data yang diperlukan ada
      if (!payload.vendorId) {
        return response.badRequest({
          message: 'Customer ID harus diisi',
          error: 'vendorId_required'
        })
      }

      if (!payload.total || payload.total <= 0) {
        return response.badRequest({
          message: 'Total invoice harus lebih dari 0',
          error: 'invalid_total'
        })
      }

      // ✅ VALIDASI: Jika ada purchase order, pastikan purchase order exists
      if (payload.purchaseOrderId) {
        const purchaseOrder = await db.from('purchase_orders').where('id', payload.purchaseOrderId).first()
        if (!purchaseOrder) {
          return response.badRequest({
            message: 'Purchase Order tidak ditemukan',
            error: 'purchase_order_not_found'
          })
        }
      }

      // ✅ VALIDASI: Pastikan vendor exists
      const vendor = await db.from('vendors').where('id', payload.vendorId).first()
      if (!vendor) {
        return response.badRequest({
          message: 'Customer tidak ditemukan',
          error: 'vendor_not_found'
        })
      }

      const trx = await db.transaction()

      try {
        const PurchaseInv = await PurchaseInvoice.create({
            purchaseOrderId: payload.purchaseOrderId || null,
            vendorId       : payload.vendorId,
            perusahaanId   : payload.perusahaanId || null,
            cabangId       : payload.cabangId || null,
            noInvoice      : noInvoice,
            email          : payload.email || '',
            up             : payload.up || '',
            paymentDate    : payload.paymentDate,
            paymentMethod  : payload.paymentMethod || 'cash', // ✅ NEW: Tambahkan payment method
            status         : payload.status || 'unpaid',
            discountPercent: payload.discountPercent || 0,
            taxPercent     : payload.taxPercent || 0,
            dpp            : payload.dpp || 0,
            total          : payload.total,
            paidAmount     : payload.paidAmount || 0,
            remainingAmount: payload.remainingAmount || (payload.total - (payload.paidAmount || 0)),
            description    : payload.description || '',
            createdBy      : payload.createdBy,
        }, { client: trx })

        // ✅ BUAT PURCHASE INVOICE ITEMS dengan validasi
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

            // ✅ VALIDASI: Pastikan purchase order item exists jika ada
            if (item.purchaseOrderItemId) {
              const purchaseOrderItem = await db.from('purchase_order_items').where('id', item.purchaseOrderItemId).first()
              if (!purchaseOrderItem) {
                throw new Error(`Purchase Order Item dengan ID ${item.purchaseOrderItemId} tidak ditemukan`)
              }
            }

            await PurchaseInvoiceItem.create({
              purchaseInvoiceId  : PurchaseInv.id,
              purchaseOrderItemId: item.purchaseOrderItemId || null,
              productId          : Number(item.productId),
              warehouseId        : item.warehouseId ? Number(item.warehouseId): null,
              quantity           : Number(item.quantity) || 0,
              price              : Number(item.price) || 0,
              subtotal           : Number(item.subtotal) || 0,
              description        : item.description || '',
              receivedQty        : Number(item.receivedQty || 0),
            }, { client: trx })
          }
        }

        await trx.commit()

        return response.created({
            message: 'Purchase Invoice berhasil dibuat',
            data: PurchaseInv,
        })
      } catch (error) {
        await trx.rollback()
        console.error('❌ Purchase Invoice Creation Error:', error)

        // ✅ ERROR HANDLING: Berikan pesan error yang lebih spesifik
        if (error.message.includes('foreign key constraint')) {
          return response.badRequest({
            message: 'Data referensi tidak valid. Pastikan vendor, product, dan warehouse yang dipilih ada.',
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
          message: 'Gagal membuat Purchase Invoice',
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
      }
    } catch (validationError) {
      console.error('❌ Validation Error:', validationError)
      return response.badRequest({
        message: 'Data yang dikirim tidak valid',
        error: 'validation_failed',
        details: validationError.messages || validationError.message
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const purchaseInvoice = await PurchaseInvoice.findOrFail(params.id)
      const payload = await request.validateUsing(updatePurchaseInvoiceValidator)
      const items = payload.purchaseInvoiceItems || []

      // Update purchase invoice
      const updateData: any = {}

      if (payload.purchaseOrderId !== undefined) updateData.purchaseOrderId = payload.purchaseOrderId
      if (payload.vendorId !== undefined) updateData.vendorId = payload.vendorId
      if (payload.perusahaanId !== undefined) updateData.perusahaanId = payload.perusahaanId
      if (payload.cabangId !== undefined) updateData.cabangId = payload.cabangId
      if (payload.email !== undefined) updateData.email = payload.email
      if (payload.up !== undefined) updateData.up = payload.up
      if (payload.paymentDate !== undefined) updateData.paymentDate = payload.paymentDate
      if (payload.paymentMethod !== undefined) updateData.paymentMethod = payload.paymentMethod
      if (payload.status !== undefined) updateData.status = payload.status
      if (payload.discountPercent !== undefined) updateData.discountPercent = payload.discountPercent
      if (payload.taxPercent !== undefined) updateData.taxPercent = payload.taxPercent
      if (payload.dpp !== undefined) updateData.dpp = payload.dpp
      if (payload.total !== undefined) updateData.total = payload.total
      if (payload.paidAmount !== undefined) updateData.paidAmount = payload.paidAmount
      if (payload.remainingAmount !== undefined) updateData.remainingAmount = payload.remainingAmount
      if (payload.description !== undefined) updateData.description = payload.description
      if (payload.updatedBy !== undefined) updateData.updatedBy = payload.updatedBy

      purchaseInvoice.merge(updateData)

      await purchaseInvoice.save()

      await purchaseInvoice.load('createdByUser')
      await purchaseInvoice.load('updatedByUser')

      // ✅ UPDATE PURCHASE INVOICE ITEMS jika ada
      if (items.length > 0) {
        // Hapus item lama
        await PurchaseInvoiceItem.query({ client: trx })
          .where('purchaseInvoiceId', purchaseInvoice.id)
          .delete()

        // Buat item baru
        for (const item of items) {
          await PurchaseInvoiceItem.create({
            purchaseInvoiceId  : purchaseInvoice.id,
            purchaseOrderItemId: item.purchaseOrderItemId,
            productId       : Number(item.productId),
            warehouseId     : Number(item.warehouseId),
            quantity        : Number(item.quantity),
            price           : Number(item.price),
            subtotal        : Number(item.subtotal),
            description     : item.description,
            receivedQty    : Number(item.receivedQty || 0),
          }, { client: trx })
        }
      }

      await trx.commit()

      return response.ok({
        message: 'Purchase Invoice berhasil diperbarui',
        data: purchaseInvoice,
      })
    } catch (error) {
      console.log('🔍 Update Error:', error)
      await trx.rollback()
      console.error('Update Purchase Invoice Error:', error)

      if (error.status === 404) {
        return response.notFound({
          message: 'Purchase Invoice tidak ditemukan',
        })
      }

      return response.internalServerError({
        message: 'Gagal memperbarui Purchase Invoice',
        error: error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const purchaseInvoice = await PurchaseInvoice.findOrFail(params.id)

      // Check if purchase invoice can be deleted (e.g., not paid yet)
      if (purchaseInvoice.status === 'paid') {
        return response.badRequest({
          message: 'Purchase Invoice yang sudah dibayar tidak dapat dihapus',
        })
      }

      await purchaseInvoice.delete()
      await trx.commit()

      return response.ok({
        message: 'Purchase Invoice berhasil dihapus',
      })
    } catch (error) {
      await trx.rollback()
      console.error('Delete Purchase Invoice Error:', error)

      if (error.status === 404) {
        return response.notFound({
          message: 'Purchase Invoice tidak ditemukan',
        })
      }

      return response.internalServerError({
        message: 'Gagal menghapus Purchase Invoice',
        error: error.message,
      })
    }
  }

}
