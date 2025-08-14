import type { HttpContext } from '@adonisjs/core/http'
import StockOut from '#models/stock_out'
import db from '@adonisjs/lucid/services/db'
import { updateStockOutValidator } from '#validators/stock_out'
import Stock from '#models/stock'

export default class StockOutsController {
    async index({ request, response }: HttpContext) {
    try {
      const page        = request.input('page', 1)
      const limit       = request.input('rows', 10)
      const search      = request.input('search', '')
      const searchValue = search || request.input('search.value', '')
      const sortField   = request.input('sortField')
      const sortOrder   = request.input('sortOrder')

      let dataQuery = StockOut.query()

      if (searchValue) {
        // Untuk pencarian tidak case sensitive, gunakan LOWER di query
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
            .whereRaw('LOWER(no_so) LIKE ?', [`%${lowerSearch}%`])
            .orWhereHas('salesOrder', (soQuery) => {
              soQuery.whereRaw('LOWER(no_so) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereHas('warehouse', (wQuery) => {
              wQuery.whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereHas('postedByUser', (uQuery) => {
              uQuery.whereRaw('LOWER(full_name) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereHas('deliveredByUser', (uQuery) => {
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

          if (relation === 'salesOrder') {
            dataQuery
              .leftJoin('sales_orders', 'stock_outs.sales_order_id', 'sales_orders.id')
              .orderBy(`sales_orders.${dbColumn}`, actualSortOrder)
              .select('stock_outs.*')
          } else if (relation === 'warehouse') {
            dataQuery
              .leftJoin('warehouses', 'stock_outs.warehouse_id', 'warehouses.id')
              .orderBy(`warehouses.${dbColumn}`, actualSortOrder)
              .select('stock_outs.*')
          } else if (relation === 'postedByUser') {
            dataQuery
              .leftJoin('users', 'stock_outs.posted_by', 'users.id')
              .orderBy(`users.${dbColumn}`, actualSortOrder)
              .select('stock_outs.*')
          } else if (relation === 'deliveredByUser') {
            dataQuery
              .leftJoin('users', 'stock_outs.delivered_by', 'users.id')
              .orderBy(`users.${dbColumn}`, actualSortOrder)
              .select('stock_outs.*')
          }
        } else {
          const dbColumn = toSnakeCase(sortField)
          dataQuery.orderBy(dbColumn, actualSortOrder)
        }
      }

      const stockOuts = await dataQuery
        .preload('warehouse')
        .preload('postedByUser', (userQuery) => {
          userQuery.select(['id', 'fullName', 'email'])
        })
        .preload('stockOutDetails', (detailQuery) => {
          detailQuery.preload('product', (productQuery) => {
            productQuery.preload('unit')
          })
        })
        .preload('salesOrder', (soQuery) => {
          soQuery.preload('deliveredByUser')
          soQuery.preload('salesOrderItems', (soiQuery) => {
            soiQuery.where('statusPartial', true)
            soiQuery.preload('product')
          })
        })
        .paginate(page, limit)

      return response.ok(stockOuts.toJSON())
    } catch (error) {
      console.error('❌ Error in StockOut index:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        sqlState: error.sqlState
      })
      
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data stock out',
        error: {
          name: error.name || 'Exception',
          message: error.message,
          status: 500
        }
      })
    }
  }

  async getStockOutDetails({ params, response }: HttpContext) {
    try {
      const stockOut = await StockOut.query()
        .where('id', params.id)
        .preload('warehouse')
        .preload('postedByUser', (userQuery) => {
          userQuery.select(['id', 'fullName', 'email'])
        })
        .preload('stockOutDetails', (detailQuery) => {
          detailQuery.preload('product', (productQuery) => {
            productQuery.preload('unit')
          })
        })
        .preload('salesOrder', (soQuery) => {
          soQuery.preload('salesOrderItems', (soiQuery) => {
            soiQuery.where('statusPartial', true)
            soiQuery.preload('product')
          })
        })
        .first()

      if (!stockOut) {
        return response.notFound({ message: 'Stock Out tidak ditemukan' })
      }

      return response.ok(stockOut.toJSON())
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil detail Stock Out',
        error: error.message,
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const stockOut = await StockOut.find(params.id)
      if (!stockOut) {
        return response.notFound({ message: 'Stock Out tidak ditemukan' })
      }
      const payload = await request.validateUsing(updateStockOutValidator)
      stockOut.merge({
        noSo: payload.noSo,
        date: payload.date,
        warehouseId: payload.warehouseId,
        status: payload.status,
      })
      await stockOut.save()
      return response.ok(stockOut)
    } catch (error) {
      return response.badRequest({
        message: 'Gagal memperbarui Stock Out',
        error  : error.messages || error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const stockOut = await StockOut.findOrFail(params.id)
      if (!stockOut) {
        return response.notFound({ message: 'Stock Out tidak ditemukan' })
      }
      await stockOut.delete()
      return response.ok({ message: 'Stock Out berhasil dihapus' })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal menghapus Stock In',
        error: error.message,
      })
    }
  }

  async postStockOut({ params, response, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const stockOut = await StockOut.query({ client: trx })
        .where('id', params.id)
        .preload('stockOutDetails', (detailQuery) => {
          detailQuery.preload('product')
        })
        .firstOrFail()

      if (stockOut.status === 'posted') {
        await trx.rollback()
        return response.badRequest({ message: 'Stock Out sudah di-post.' })
      }

      // ✅ VALIDASI: Pastikan ada stock out details
      if (!stockOut.stockOutDetails || stockOut.stockOutDetails.length === 0) {
        await trx.rollback()
        return response.badRequest({
          message: 'Stock Out tidak memiliki detail item untuk di-post'
        })
      }

      // ✅ Group details by product untuk menghitung total quantity per produk
      const productQuantities = new Map()
      
      for (const detail of stockOut.stockOutDetails) {
        const productId = detail.productId
        const currentQty = productQuantities.get(productId) || 0
        productQuantities.set(productId, currentQty + Number(detail.quantity))
      }

      // Cek dan update stok untuk setiap produk
      for (const [productId, totalQty] of productQuantities) {
        // Cek apakah stok sudah ada
        const existingStock = await Stock
          .query({ client: trx })
          .where('product_id', productId)
          .andWhere('warehouse_id', stockOut.warehouseId)
          .first()

        if (existingStock) {
          // Cek apakah stok mencukupi
          if (Number(existingStock.quantity) < totalQty) {
            await trx.rollback()
            return response.badRequest({
              message: `Stock barang ${existingStock.product?.name || productId} tidak mencukupi. Tersedia: ${existingStock.quantity}, dibutuhkan: ${totalQty}`
            })
          }
          // Jika sudah ada, kurangi quantity
          existingStock.quantity = Number(existingStock.quantity) - totalQty
          await existingStock.useTransaction(trx).save()
          
        } else {
          // Jika belum ada, tidak bisa keluar stock karena stok tidak ada
          await trx.rollback()
          return response.badRequest({
            message: `Stock untuk produk ID ${productId} tidak ditemukan di warehouse`
          })
        }
      }

      stockOut.status   = 'posted'
      stockOut.postedAt = new Date()
      stockOut.postedBy = auth.user?.id || 0
      await stockOut.useTransaction(trx).save()
      await trx.commit()
      
      return response.ok(stockOut)
    } catch (error) {
      await trx.rollback()
      console.error(`❌ Failed to post StockOut ${params.id}:`, error)
      return response.internalServerError({
        message: 'Gagal memposting Stock Out',
        error: error.message,
      })
    }
  }

  async getTotalStockOut({ response }: HttpContext) {
    try {
      // Total semua Stock Out
      const totalStockOut = await StockOut.query().count('id as total')

      // Total Stock Out dengan status 'draft'
      const totalDraft = await StockOut.query().where('status', 'draft').count('id as total')

      // Total Stock Out dengan status 'posted'
      const totalPosted = await StockOut.query().where('status', 'posted').count('id as total')

      return response.ok({
        total : totalStockOut[0]?.$extras.total || 0,
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
}
