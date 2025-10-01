import Cabang from "#models/cabang"
import PurchaseOrder from "#models/purchase_order"
import PurchaseOrderItem from "#models/purchase_order_item"
import { purchaseOrderValidator, updatePurchaseOrderValidator } from "#validators/purchase"
import { MultipartFile } from "@adonisjs/core/bodyparser"
import type { HttpContext } from "@adonisjs/core/http"
import db from "@adonisjs/lucid/services/db"
import { toRoman } from '#helper/bulan_romawi'
import StorageService from '#services/storage_service'

export default class PurchasesController {
  private storageService: StorageService

  // Constructor
  constructor() {
      this.storageService = new StorageService()
  }

  async index({ request, response }: HttpContext) {
      try {
          const page         = parseInt(request.input('page', '1'), 10) || 1
          const limit        = parseInt(request.input('rows', '10'), 10) || 10
          const search       = request.input('search', '')
          const searchValue  = search || request.input('search.value', '')
          const sortField    = request.input('sortField')
          const sortOrder    = request.input('sortOrder')
          const includeItems = request.input('includeItems', false)
          const vendorId     = request.input('vendorId')
          const status       = request.input('status')
          const poType       = request.input('poType')

          // ✅ OPTIMASI: Efficient base query dengan minimal preloading
          let dataQuery = PurchaseOrder.query()
            .preload('vendor', (query) => {
              query.select(['id', 'name', 'email', 'phone'])
            })
            .preload('perusahaan', (query) => {
              query.select(['id', 'nmPerusahaan'])
            })
            .preload('cabang', (query) => {
              query.select(['id', 'nmCabang', 'perusahaanId'])
            })
            .preload('createdByUser', (query) => {
              query.select(['id', 'full_name', 'email'])
            })
            .preload('approvedByUser', (query) => {
              query.select(['id', 'full_name'])
            })
            .preload('receivedByUser', (query) => {
              query.select(['id', 'full_name'])
            })

          if (vendorId) {
            dataQuery.where('vendor_id', vendorId)
          }
          if (status) {
            dataQuery.where('status', status)
          }
          if (poType) {
            dataQuery.where('po_type', poType)
          }

          // ✅ OPTIMASI: Conditional preloading untuk performance
          if (includeItems) {
            dataQuery.preload('purchaseOrderItems', (query) => {
              query.preload('product', (productQuery) => {
                productQuery.select(['id', 'name', 'priceBuy', 'priceSell', 'sku'])
                  .preload('productCustomer', (pcQuery) => {
                    pcQuery.select(['id', 'productId', 'customerId', 'priceSell'])
                      .preload('customer', (customerQuery) => {
                        customerQuery.select(['id', 'name'])
                      })
                  })
              })
              .preload('warehouse', (warehouseQuery) => {
                warehouseQuery.select(['id', 'name', 'code'])
              })
            })
          }

          if (searchValue) {
            // ✅ OPTIMASI: Menggunakan exists() untuk relationship search
            const lowerSearch = searchValue.toLowerCase()
            dataQuery = dataQuery.where((query) => {
              query
                  .whereRaw('LOWER(no_po) LIKE ?', [`%${lowerSearch}%`])
                  .orWhereRaw('LOWER(status) LIKE ?', [`%${lowerSearch}%`])
                  .orWhereRaw('LOWER(po_type) LIKE ?', [`%${lowerSearch}%`])
                  .orWhereRaw('LOWER(description) LIKE ?', [`%${lowerSearch}%`])
                  // ✅ Tambah: cari produk berdasarkan SKU, NAME, atau NO_INTERCHANGE
                  .orWhereExists((itemQuery) => {
                    itemQuery
                      .from('purchase_order_items as poi')
                      .leftJoin('products as p', 'poi.product_id', 'p.id')
                      .whereColumn('poi.purchase_order_id', 'purchase_orders.id')
                      .whereRaw('LOWER(p.sku) LIKE ?', [`%${lowerSearch}%`])
                      .orWhereRaw('LOWER(p.name) LIKE ?', [`%${lowerSearch}%`])
                      .orWhereRaw('LOWER(p.no_interchange) LIKE ?', [`%${lowerSearch}%`])
                  })
                  .orWhereExists((vendorQuery) => {
                    vendorQuery
                      .from('vendors')
                      .whereColumn('vendors.id', 'purchase_orders.vendor_id')
                      .whereRaw('LOWER(vendors.name) LIKE ?', [`%${lowerSearch}%`])
                  })
                  .orWhereExists((userQuery) => {
                    userQuery
                      .from('users')
                      .whereColumn('users.id', 'purchase_orders.created_by')
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

                // ✅ OPTIMASI: Efficient joins dengan nama tabel yang benar
                const relationJoinInfo: Record<string, { table: string, foreignKey: string, primaryKey: string }> = {
                  vendor: { table: 'vendors', foreignKey: 'purchase_orders.vendor_id', primaryKey: 'vendors.id' },
                  perusahaan: { table: 'perusahaan', foreignKey: 'purchase_orders.perusahaan_id', primaryKey: 'perusahaan.id' },
                  cabang: { table: 'cabang', foreignKey: 'purchase_orders.cabang_id', primaryKey: 'cabang.id' },
                  createdByUser: { table: 'users as created_users', foreignKey: 'purchase_orders.created_by', primaryKey: 'created_users.id' },
                  approvedByUser: { table: 'users as approved_users', foreignKey: 'purchase_orders.approved_by', primaryKey: 'approved_users.id' },
                  receivedByUser: { table: 'users as received_users', foreignKey: 'purchase_orders.received_by', primaryKey: 'received_users.id' },
                }

                if (relation in relationJoinInfo) {
                  const joinInfo = relationJoinInfo[relation]
                  dataQuery
                    .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
                    .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
                    .select('purchase_orders.*')
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
          const startTime = Date.now()
          const purchaseOrder = await dataQuery.paginate(page, limit)
          const queryTime = Date.now() - startTime

          // ✅ Log slow queries untuk monitoring
          if (queryTime > 1000) {
            console.warn(`🐌 Slow Query Alert: Purchase Orders took ${queryTime}ms`)
          }



          return response.ok({
            ...purchaseOrder.toJSON(),
            _meta: {
              queryTime: queryTime,
              totalQueries: 'optimized'
            }
          })
          } catch (error) {
          return response.internalServerError({
              message: 'Terjadi kesalahan saat mengambil data purchase order',
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
          const po = await PurchaseOrder.query()
          .where('id', params.id)
          .preload('vendor', (vendorQuery) => {
            vendorQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
          })
          .preload('perusahaan', (perusahaanQuery) => {
            perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'logoPerusahaan', 'npwpPerusahaan'])
          })
          .preload('cabang', (cabangQuery) => {
            cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
          })
          .preload('purchaseOrderItems', (purchaseOrderItemsQuery) => {
              purchaseOrderItemsQuery.preload('product', (productQuery) => {
                productQuery.select(['id', 'name', 'priceBuy', 'priceSell', 'sku', 'description'])
              })
              .preload('warehouse', (warehouseQuery) => {
                warehouseQuery.select(['id', 'name', 'code'])
              })
          })
          .preload('createdByUser', (createdByUserQuery) => {
            createdByUserQuery.select(['id', 'full_name', 'email'])
          })
          .preload('approvedByUser', (approvedByUserQuery) => {
            approvedByUserQuery.select(['id', 'full_name', 'email'])
          })
          .preload('receivedByUser', (receivedByUserQuery) => {
            receivedByUserQuery.select(['id', 'full_name', 'email'])
          })
          .preload('rejectedByUser', (rejectedByUserQuery) => {
            rejectedByUserQuery.select(['id', 'full_name', 'email'])
          })
          .firstOrFail()

          return response.ok({
          message: 'Purchase Order ditemukan',
          data: po,
          })
      } catch (error) {
          return response.notFound({ message: 'Purchase Order tidak ditemukan' })
      }
  }

  async store({ request, response }: HttpContext) {
      // Fungsi generateNo untuk no_po dengan format 0000/APU/PO/Bulan dalam angka romawi/tahun
      async function generateNo() {
          // Ambil nomor urut terakhir dari PO tahun ini
          const now   = new Date()
          const bulan = now.getMonth() + 1
          const tahun = now.getFullYear()

          // Konversi bulan ke angka romawi
          const bulanRomawi = toRoman(bulan)

          // Cari nomor urut terakhir untuk tahun ini (tidak berdasarkan bulan)
          const lastPo = await PurchaseOrder
              .query()
              .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun])
              .orderBy('no_po', 'desc')
              .first()

          let lastNumber = 0
          if (lastPo && lastPo.noPo) {
              // Ambil 4 digit pertama dari no_po terakhir
              const match = lastPo.noPo.match(/^(\d{4})/)
              if (match) {
                  lastNumber = parseInt(match[1], 10)
              }
          }
          const nextNumber = (lastNumber + 1).toString().padStart(4, '0')

          // Format: 0000/APU/PO/BULAN_ROMAWI/TAHUN
          return `${nextNumber}/APU/PO/${bulanRomawi}/${tahun}`
      }

      const payload = await request.validateUsing(purchaseOrderValidator)

      const items = payload.purchaseOrderItems || []

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
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'image/jpeg',
                  'image/jpg',
                  'image/png',
                  'image/gif',
                  'image/webp',
                  'image/svg+xml'
              ]

              const allowedExtensions = ['pdf', 'xlsx', 'xls', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

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
                  'purchase_orders',
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

          const discount      = subtotal * (payload.discountPercent || 0) / 100
          const afterDiscount = subtotal - discount
          const tax           = afterDiscount * (payload.taxPercent || 0) / 100
          const total         = afterDiscount + tax

          const po = await PurchaseOrder.create({
              vendorId         : payload.vendorId,
              perusahaanId     : payload.perusahaanId || null,
              cabangId         : payload.cabangId || null,
              noPo             : await generateNo(),
              up               : payload.up,
              extNamaPerusahaan: payload.extNamaPerusahaan || null,
              termOfPayment    : payload.termOfPayment || null,
              date             : payload.date,
              dueDate          : payload.dueDate,
              status           : payload.status || 'draft',
              poType           : payload.poType || 'internal',
              discountPercent  : payload.discountPercent || 0,
              taxPercent       : payload.taxPercent || 0,
              total,
              createdBy  : payload.createdBy,
              approvedBy : payload.approvedBy || null,
              receivedBy : payload.receivedBy || null,
              rejectedBy : payload.rejectedBy || null,
              approvedAt : payload.approvedAt || null,
              receivedAt : payload.receivedAt || null,
              rejectedAt : payload.rejectedAt || null,
              description: payload.description || null,
              attachment : attachmentPath || null,
          }, { client: trx })

          // ✅ OPTIMIZED: Bulk insert instead of loop
          if (items.length > 0) {
            await PurchaseOrderItem.createMany(
              items.map(item => ({
                purchaseOrderId: po.id,
                productId: item.productId,
                warehouseId: item.warehouseId || null,
                quantity: item.quantity,
                price: item.price,
                description: item.description || null,
                subtotal: item.subtotal,
                statusPartial: item.statusPartial || false,
                receivedQty: item.receivedQty || 0,
              })),
              { client: trx }
            )
          }

          await trx.commit()

          return response.created({
              message: 'Purchase Order berhasil dibuat',
              data: po,
          })
          } catch (error) {
          await trx.rollback()
          console.error('PO Error:', error)
          return response.internalServerError({
              message: 'Gagal membuat Purchase Order',
              error: {
                  name: error.name,
                  message: error.message,
                  code: error.code,
                  constraint: error.constraint || null,
                  detail: error.detail || null,
              }
          })
      }
  }

  async update({ params, request, response }: HttpContext) {
      const payload = await request.validateUsing(updatePurchaseOrderValidator)
      const items = payload.purchaseOrderItems || []

      if (!Array.isArray(items) || items.length === 0) {
          return response.badRequest({ message: 'Items tidak boleh kosong' })
      }

      const trx = await db.transaction()

      try {
          const po = await PurchaseOrder.findOrFail(params.id, { client: trx })

          // Handle file upload
          let attachmentPath = po.attachment

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
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      'image/jpeg',
                      'image/jpg',
                      'image/png',
                      'image/gif',
                      'image/webp',
                      'image/svg+xml'
                  ]

                  const allowedExtensions = ['pdf', 'xlsx', 'xls', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

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
                      'purchase_orders',
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

          // Update PO utama
          po.merge({
          vendorId         : payload.vendorId,
          perusahaanId     : payload.perusahaanId,
          cabangId         : payload.cabangId,
          up               : payload.up,
          extNamaPerusahaan: payload.extNamaPerusahaan,
          termOfPayment    : payload.termOfPayment,
          date             : payload.date,
          dueDate          : payload.dueDate,
          status           : payload.status || 'draft',
          poType           : payload.poType || 'internal',
          discountPercent  : payload.discountPercent || 0,
          taxPercent       : payload.taxPercent || 0,
          total,
          createdBy  : payload.createdBy,
          approvedBy : payload.approvedBy,
          receivedBy : payload.receivedBy,
          rejectedBy : payload.rejectedBy,
          approvedAt : payload.approvedAt,
          receivedAt : payload.receivedAt,
          rejectedAt : payload.rejectedAt,
          description: payload.description,
          attachment : attachmentPath || undefined,
          })
          await po.save()

          // ✅ OPTIMIZED: Bulk operations instead of loop
          await PurchaseOrderItem.query({ client: trx })
          .where('purchase_order_id', po.id)
          .delete()

          if (items.length > 0) {
            // ✅ Single bulk insert instead of loop
            await PurchaseOrderItem.createMany(
              items.map(item => ({
                purchaseOrderId: po.id,
                productId: item.productId,
                warehouseId: item.warehouseId || null,
                quantity: item.quantity,
                price: item.price,
                description: item.description,
                subtotal: item.subtotal,
                statusPartial: item.statusPartial || false,
                receivedQty: item.receivedQty || 0,
              })),
              { client: trx }
            )
          }

          await trx.commit()

          return response.ok({
          message: 'Purchase Order berhasil diperbarui',
          data: po,
          })
      } catch (error) {
          await trx.rollback()
          console.error('PO Update Error:', error)
          return response.internalServerError({ message: 'Gagal memperbarui Purchase Order' })
      }
  }

  async destroy({ params, response }: HttpContext) {
      try {
          const customer = await PurchaseOrder.find(params.id)
          if (!customer) {
              return response.notFound({ message: 'PurchaseOrder tidak ditemukan' })
          }
          await customer.delete()
          return response.ok({ message: 'PurchaseOrder berhasil dihapus' })
          } catch (error) {
              return response.internalServerError({
              message: 'Gagal menghapus purchase order',
              error: error.message,
              })
      }
  }

  async approvePurchaseOrder({ params, response, auth }: HttpContext) {
      try {
          const po = await PurchaseOrder.find(params.id)
          if (!po) {
              return response.notFound({ message: 'PurchaseOrder tidak ditemukan' })
          }

          po.status = 'approved'
          po.approvedAt = new Date()
          if (auth.user) {
              po.approvedBy = auth.user.id
          }
          await po.save()

          return response.ok({ message: 'Purchase Order berhasil diapprove' })
      } catch (error) {
          return response.internalServerError({ message: 'Gagal mengapprove purchase order' })
      }
  }

  async rejectPurchaseOrder({ params, response, auth }: HttpContext) {
      try {
          const po = await PurchaseOrder.find(params.id)
          if (!po) {
              return response.notFound({ message: 'PurchaseOrder tidak ditemukan' })
          }

          po.status = 'rejected'
          po.rejectedAt = new Date()
          if (auth.user) {
              po.rejectedBy = auth.user.id
          }
          await po.save()

          return response.ok({ message: 'Purchase Order berhasil direject' })
      } catch (error) {
          return response.internalServerError({ message: 'Gagal mereject purchase order' })
      }
  }

  async getPurchaseOrderDetails({ params, response }: HttpContext) {
    try {
      // ✅ OPTIMASI: Efficient detailed query with select specific fields
      const po = await PurchaseOrder.query()
      .where('id', params.id)
      .preload('vendor', (vendorQuery) => {
        vendorQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
      })
      .preload('perusahaan', (perusahaanQuery) => {
        perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'logoPerusahaan', 'npwpPerusahaan'])
      })
      .preload('cabang', (cabangQuery) => {
        cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
      })
      .preload('purchaseOrderItems', (purchaseOrderItemsQuery) => {
          purchaseOrderItemsQuery.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'priceBuy', 'priceSell', 'sku'])
          })
          .preload('warehouse', (warehouseQuery) => {
            warehouseQuery.select(['id', 'name', 'code'])
          })
      })
      .preload('createdByUser', (createdByUserQuery) => {
        createdByUserQuery.select(['id', 'full_name', 'email'])
      })
      .preload('approvedByUser', (approvedByUserQuery) => {
        approvedByUserQuery.select(['id', 'full_name', 'email'])
      })
      .preload('receivedByUser', (receivedByUserQuery) => {
        receivedByUserQuery.select(['id', 'full_name', 'email'])
      })
      .preload('rejectedByUser', (rejectedByUserQuery) => {
        rejectedByUserQuery.select(['id', 'full_name', 'email'])
      })
      .firstOrFail()

      return response.ok({
          message: 'Purchase Order ditemukan',
          data: po,
      })
    } catch (error) {
      console.error('Error in getPurchaseOrderDetails:', error);
      console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.status
      });

      return response.notFound({ message: 'Purchase Order tidak ditemukan' })
    }
  }

  async getCabangbyPerusahaan({ request, response }: HttpContext) {
    const perusahaanId = request.input('perusahaanId')

    // ✅ OPTIMASI: Select specific fields dan cache untuk performance
    const cabang = await Cabang.query()
    .select(['id', 'nmCabang', 'alamatCabang', 'kodeCabang', 'perusahaanId'])
    .where('perusahaanId', perusahaanId)

    return response.ok(cabang)
  }

  async countByStatus({ response }: HttpContext) {
    try {
      const totalQuery = await db.rawQuery('SELECT COUNT(*) as total FROM purchase_orders')
      const approvedQuery = await db.rawQuery('SELECT COUNT(*) as total FROM purchase_orders WHERE status = ?', ['approved'])
      const receivedQuery = await db.rawQuery('SELECT COUNT(*) as total FROM purchase_orders WHERE status = ?', ['received'])
      const rejectedQuery = await db.rawQuery('SELECT COUNT(*) as total FROM purchase_orders WHERE status = ?', ['rejected'])
      const draftQuery = await db.rawQuery('SELECT COUNT(*) as total FROM purchase_orders WHERE status = ?', ['draft'])

      const result = {
        total    : parseInt(totalQuery[0]?.total || totalQuery.rows?.[0]?.total || 0),
        approved : parseInt(approvedQuery[0]?.total || approvedQuery.rows?.[0]?.total || 0),
        received : parseInt(receivedQuery[0]?.total || receivedQuery.rows?.[0]?.total || 0),
        rejected : parseInt(rejectedQuery[0]?.total || rejectedQuery.rows?.[0]?.total || 0),
        draft    : parseInt(draftQuery[0]?.total || draftQuery.rows?.[0]?.total || 0),
      };

      return response.ok(result)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data statistik purchase order',
        error: error.message
      });
    }
  }

  async getNotifications({ request, response }: HttpContext) {
    try {
      const limit = request.input('limit', 10)
      const status = request.input('status', 'draft')

      let query = PurchaseOrder.query()
        .preload('vendor')
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

      const purchaseOrders = await query.limit(limit)

      const notifications = purchaseOrders.map(po => ({
        id: po.id,
        type: 'purchase_order',
        noPo: po.noPo,
        status: po.status,
        createdAt: po.createdAt,
        createdBy: po.createdBy || '',
        createdByName: po.createdByUser?.fullName || 'Unknown',
        vendorName: po.vendor?.name || 'Unknown Vendor',
        total: po.total || 0,
        description: po.description || ''
      }))

      return response.ok({
        message: 'Notifikasi purchase order berhasil diambil',
        data: notifications
      })
    } catch (error) {
      console.error('Error fetching purchase order notifications:', error)
      return response.internalServerError({
        message: 'Gagal mengambil notifikasi purchase order',
        error: error.message
      })
    }
  }
}
