import type { HttpContext } from '@adonisjs/core/http'
import StockIn from '#models/stock_in'
import Stock from '#models/stock'
import db from '@adonisjs/lucid/services/db'
import { updateStockInValidator } from '#validators/stock_in'

export default class StockInsController {

  async index({ request, response }: HttpContext) {
    try {
      const page        = request.input('page', 1)
      const limit       = request.input('rows', 10)
      const search      = request.input('search', '')
      const searchValue = search || request.input('search.value', '')
      const sortField   = request.input('sortField')
      const sortOrder   = request.input('sortOrder')

      let dataQuery = StockIn.query()

      if (searchValue) {
        // Untuk pencarian tidak case sensitive, gunakan LOWER di query
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
            .whereRaw('LOWER(no_si) LIKE ?', [`%${lowerSearch}%`])
            .orWhereHas('purchaseOrder', (pQuery) => {
              pQuery.whereRaw('LOWER(no_po) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereHas('warehouse', (wQuery) => {
              wQuery.whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereHas('postedByUser', (uQuery) => {
              uQuery.whereRaw('LOWER(full_name) LIKE ?', [`%${lowerSearch}%`])
            })
        })
      }

      if (sortField && sortOrder) {
        const actualSortOrder = sortOrder === '1' ? 'asc' : 'desc'
        const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

        if (sortField.includes('.')) {
          const [relation, column] = sortField.split('.')
          const dbColumn = toSnakeCase(column)

          if (relation === 'purchaseOrder') {
            dataQuery
              .leftJoin('purchase_orders', 'stock_ins.purchase_order_id', 'purchase_orders.id')
              .orderBy(`purchase_orders.${dbColumn}`, actualSortOrder)
              .select('stock_ins.*')
          } else if (relation === 'warehouse') {
            dataQuery
              .leftJoin('warehouses', 'stock_ins.warehouse_id', 'warehouses.id')
              .orderBy(`warehouses.${dbColumn}`, actualSortOrder)
              .select('stock_ins.*')
          } else if (relation === 'postedByUser') {
            dataQuery
              .leftJoin('users', 'stock_ins.posted_by', 'users.id')
              .orderBy(`users.${dbColumn}`, actualSortOrder)
              .select('stock_ins.*')
          } else if (relation === 'receivedByUser') {
            dataQuery
              .leftJoin('users', 'stock_ins.received_by', 'users.id')
              .orderBy(`users.${dbColumn}`, actualSortOrder)
              .select('stock_ins.*')
          }
        } else {
          const dbColumn = toSnakeCase(sortField)
          dataQuery.orderBy(dbColumn, actualSortOrder)
        }
      }

      // ✅ Default ordering: yang paling baru di atas
      if (!sortField || !sortOrder) {
        dataQuery.orderBy('created_at', 'desc').orderBy('id', 'desc')
      }

      const stockIns = await dataQuery
        .preload('warehouse')
        .preload('postedByUser')
        .preload('receivedByUser')
        .preload('stockInDetails', (stockInDetailQuery) => {
          stockInDetailQuery.preload('product')
        })
        .preload('purchaseOrder', (poQuery) => {
          poQuery.preload('receivedByUser')
          poQuery.preload('purchaseOrderItems', (poiQuery) => {
            poiQuery.preload('product')
          })
        })
        .paginate(page, limit)

      return response.ok(stockIns.toJSON())
    } catch (error) {
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data stock in',
        error: {
          name: 'Exception',
          status: 500
        }
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const stockIn = await StockIn.query()
        .where('id', params.id)
        .preload('warehouse')
        .preload('postedByUser')
        .preload('receivedByUser')
        .preload('stockInDetails', (stockInDetailQuery) => {
          stockInDetailQuery.preload('product')
        })
        .preload('purchaseOrder', (poQuery) => {
          poQuery.preload('purchaseOrderItems', (poiQuery) => {
            poiQuery.preload('product')
          })
        })
        .first()

      if (!stockIn) {
        return response.notFound({ message: 'Stock In tidak ditemukan' })
      }

      return response.ok(stockIn.toJSON())
    } catch (error) {
      console.log(error)
      return response.internalServerError({
        message: 'Gagal mengambil detail Stock In',
        error: error.message,
      })
    }
  }

  async getStockInDetails({ params, response }: HttpContext) {
    try {
      const stockIn = await StockIn.query()
        .where('id', params.id)
        .preload('warehouse')
        .preload('postedByUser')
        .preload('receivedByUser')
        .preload('stockInDetails', (stockInDetailQuery) => {
          stockInDetailQuery.preload('product')
        })
        .preload('purchaseOrder', (poQuery) => {
          poQuery.preload('purchaseOrderItems', (poiQuery) => {
            poiQuery.preload('product')
          })
        })
        .first()

      if (!stockIn) {
        return response.notFound({ message: 'Stock In tidak ditemukan' })
      }

      return response.ok(stockIn.toJSON())
    } catch (error) {
      console.log(error)
      return response.internalServerError({
        message: 'Gagal mengambil detail Stock In',
        error: error.message,
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const stockIn = await StockIn.find(params.id)
      if (!stockIn) {
        return response.notFound({ message: 'Stock In tidak ditemukan' })
      }
      const payload = await request.validateUsing(updateStockInValidator)
      stockIn.merge({
        date       : payload.date,
        warehouseId: payload.warehouseId,
        status     : payload.status,
      })
      await stockIn.save()
      return response.ok(stockIn)
    } catch (error) {
      return response.badRequest({
        message: 'Gagal memperbarui Stock In',
        error  : error.messages || error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const stockIn = await StockIn.findOrFail(params.id)
      if (!stockIn) {
        return response.notFound({ message: 'Stock In tidak ditemukan' })
      }
      await stockIn.delete()
      return response.ok({ message: 'Stock In berhasil dihapus' })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal menghapus Stock In',
        error: error.message,
      })
    }
  }

  async getNotifications({ request, response }: HttpContext) {
    try {
      const limit = request.input('limit', 10)
      const status = request.input('status', 'not_posted')

      let query = StockIn.query()
        .preload('warehouse')
        .preload('postedByUser')
        .preload('receivedByUser')
        .preload('purchaseOrder', (poQuery) => {
          poQuery.preload('createdByUser')
        })
        .orderBy('created_at', 'desc')

      // Filter berdasarkan status
      if (status === 'not_posted') {
        query = query.where('status', '!=', 'posted')
      } else if (status) {
        query = query.where('status', status)
      }

      const stockIns = await query.limit(limit)

      const notifications = stockIns.map(stockIn => ({
        id: stockIn.id,
        type: 'stock_in',
        noSi: stockIn.noSi,
        quantity: stockIn.quantity,
        status: stockIn.status,
        createdAt: stockIn.createdAt,
        createdBy: stockIn.purchaseOrder?.createdBy || '',
        createdByName: stockIn.purchaseOrder?.createdByUser?.fullName || 'Unknown',
        warehouseName: stockIn.warehouse?.name || 'Unknown Warehouse',
        description: stockIn.description || ''
      }))

      return response.ok({
        message: 'Notifikasi stock in berhasil diambil',
        data: notifications
      })
    } catch (error) {
      console.error('Error fetching stock in notifications:', error)
      return response.internalServerError({
        message: 'Gagal mengambil notifikasi stock in',
        error: error.message
      })
    }
  }

  async postStockIn({ params, response, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const stockIn = await StockIn.query({ client: trx })
        .where('id', params.id)
        .preload('stockInDetails')
        .firstOrFail()

      if (stockIn.status === 'posted') {
        await trx.rollback()
        return response.badRequest({ message: 'Stock In sudah di-post.' })
      }

      if (!stockIn.stockInDetails || stockIn.stockInDetails.length === 0) {
        await trx.rollback()
        return response.badRequest({ message: 'Tidak ada item detail di Stock In ini. Tidak dapat diposting.' })
      }

      // Cek dan update/insert stok untuk setiap item di stock in details
      // ✅ HITUNG TOTAL QUANTITY per produk dari semua StockInDetails
      const productQuantities = new Map<number, number>()

      for (const detail of stockIn.stockInDetails) {
        const currentQty = productQuantities.get(detail.productId) || 0
        productQuantities.set(detail.productId, currentQty + Number(detail.quantity))
      }

      // Update stock untuk setiap produk dengan total quantity
      for (const [productId, totalQuantity] of productQuantities) {
        // Cek apakah stok sudah ada
        const existingStock = await Stock
          .query({ client: trx })
          .where('product_id', productId)
          .andWhere('warehouse_id', stockIn.warehouseId)
          .first()

        if (existingStock) {
          // Jika sudah ada, update quantity
          existingStock.quantity = Number(existingStock.quantity) + totalQuantity
          await existingStock.useTransaction(trx).save()
        } else {
          // Jika belum ada, buat record baru
          await Stock.create({
            productId  : productId,
            warehouseId: stockIn.warehouseId,
            quantity   : totalQuantity
          }, { client: trx })
        }
      }

      stockIn.status   = 'posted'
      stockIn.postedAt = new Date()
      stockIn.postedBy = auth.user?.id || 0
      await stockIn.useTransaction(trx).save()
      await trx.commit()
      return response.ok(stockIn)
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        message: 'Gagal memposting Stock In',
        error: error.message,
      })
    }
  }

  async postAllStockIn({ request, response, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const { ids } = request.body()
      
      if (!Array.isArray(ids) || ids.length === 0) {
        await trx.rollback()
        return response.badRequest({ message: 'ID Stock In harus berupa array dan tidak boleh kosong.' })
      }

      // Define types for results
      type SuccessResult = { id: any; noSi: string }
      type FailedResult = { id: any; reason: string }
      
      const results: {
        success: SuccessResult[]
        failed: FailedResult[]
      } = {
        success: [],
        failed: []
      }

      for (const id of ids) {
        try {
          const stockIn = await StockIn.query({ client: trx })
            .where('id', id)
            .preload('stockInDetails')
            .first()

          if (!stockIn) {
            results.failed.push({
              id,
              reason: 'Stock In tidak ditemukan'
            })
            continue
          }

          if (stockIn.status === 'posted') {
            results.failed.push({
              id,
              reason: 'Stock In sudah di-post'
            })
            continue
          }

          if (!stockIn.stockInDetails || stockIn.stockInDetails.length === 0) {
            results.failed.push({
              id,
              reason: 'Tidak ada item detail di Stock In ini'
            })
            continue
          }

          // Hitung total quantity per produk
          const productQuantities = new Map<number, number>()

          for (const detail of stockIn.stockInDetails) {
            const currentQty = productQuantities.get(detail.productId) || 0
            productQuantities.set(detail.productId, currentQty + Number(detail.quantity))
          }

          // Update stock untuk setiap produk
          for (const [productId, totalQuantity] of productQuantities) {
            const existingStock = await Stock
              .query({ client: trx })
              .where('product_id', productId)
              .andWhere('warehouse_id', stockIn.warehouseId)
              .first()

            if (existingStock) {
              existingStock.quantity = Number(existingStock.quantity) + totalQuantity
              await existingStock.useTransaction(trx).save()
            } else {
              await Stock.create({
                productId  : productId,
                warehouseId: stockIn.warehouseId,
                quantity   : totalQuantity
              }, { client: trx })
            }
          }

          stockIn.status   = 'posted'
          stockIn.postedAt = new Date()
          stockIn.postedBy = auth.user?.id || 0
          await stockIn.useTransaction(trx).save()

          results.success.push({
            id,
            noSi: stockIn.noSi
          })

        } catch (error) {
          results.failed.push({
            id,
            reason: error.message || 'Terjadi kesalahan saat memposting'
          })
        }
      }

      await trx.commit()
      
      return response.ok({
        message: `Berhasil memposting ${results.success.length} Stock In, gagal ${results.failed.length}`,
        results
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        message: 'Gagal memposting Stock In',
        error: error.message,
      })
    }
  }

  async getTotalStockIn({ response }: HttpContext) {
    try {
      // Total semua Stock In
      const totalStockIn = await StockIn.query().count('id as total')

      // Total Stock In dengan status 'draft'
      const totalDraft = await StockIn.query().where('status', 'draft').count('id as total')

      // Total Stock In dengan status 'posted'
      const totalPosted = await StockIn.query().where('status', 'posted').count('id as total')

      return response.ok({
        total : totalStockIn[0]?.$extras.total || 0,
        draft : totalDraft[0]?.$extras.total || 0,
        posted: totalPosted[0]?.$extras.total || 0,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil total Stock In',
        error: error.message,
      })
    }
  }

  async getAllForExport({ response }: HttpContext) {
    try {
      const stockIns = await StockIn.query()
        .preload('warehouse')
        .preload('postedByUser')
        .preload('stockInDetails', (stockInDetailQuery) => {
          stockInDetailQuery.preload('product')
        })
        .preload('purchaseOrder', (poQuery) => {
          poQuery.preload('receivedByUser')
          poQuery.preload('purchaseOrderItems', (poiQuery) => {
            poiQuery.preload('product')
          })
        })
        .orderBy('created_at', 'desc')

      return response.ok({
        data: stockIns,
        meta: {
          total: stockIns.length
        }
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data stock in untuk export',
        error: error.message,
      })
    }
  }
}
