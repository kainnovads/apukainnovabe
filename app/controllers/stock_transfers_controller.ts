import StockTransfer from '#models/stock_transfer'
import StockTransferDetail from '#models/stock_transfer_detail'
import Stock from '#models/stock'
import Product from '#models/product'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { stockTransferValidator, updateStockTransferValidator } from '#validators/stock_transfer'
import { toRoman } from '#helper/bulan_romawi'

export default class StockTransfersController {
  async index({ request, response }: HttpContext) {
    try {
      const page        = request.input('page', 1)
      const limit       = request.input('rows', 10)
      const search      = request.input('search', '')
      const searchValue = search || request.input('search.value', '')
      const sortField   = request.input('sortField')
      const sortOrder   = request.input('sortOrder')
      const includeDetails = request.input('includeDetails', false) // ✅ Conditional loading
      const status      = request.input('status')

      // ✅ OPTIMASI: Efficient base query dengan minimal preloading
      let dataQuery = StockTransfer.query()
        .preload('perusahaan', (query) => {
          query.select(['id', 'nmPerusahaan'])
        })
        .preload('cabang', (query) => {
          query.select(['id', 'nmCabang', 'perusahaanId'])
        })
        .preload('fromWarehouse', (query) => {
          query.select(['id', 'name', 'address'])
        })
        .preload('toWarehouse', (query) => {
          query.select(['id', 'name', 'address'])
        })
        .preload('transferByUser', (query) => {
          query.select(['id', 'full_name', 'email'])
        })

      // ✅ OPTIMASI: Conditional preloading untuk performance
      if (includeDetails) {
        dataQuery.preload('stockTransferDetails', (stQuery) => {
          stQuery.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'sku'])
          })
        })
      }

      // ✅ OPTIMASI: Preload users hanya jika diperlukan
      if (status && ['approved', 'rejected'].includes(status)) {
        dataQuery.preload('approvedByUser', (query) => {
          query.select(['id', 'full_name'])
        })
      }

      if (searchValue) {
        // ✅ OPTIMASI: Menggunakan exists() untuk relationship search
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
            .whereRaw('LOWER(no_transfer) LIKE ?', [`%${lowerSearch}%`])
            .orWhereExists((wQuery) => {
              wQuery
                .from('warehouses')
                .whereColumn('warehouses.id', 'stock_transfers.from_warehouse_id')
                .whereRaw('LOWER(warehouses.name) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereExists((wQuery) => {
              wQuery
                .from('warehouses')
                .whereColumn('warehouses.id', 'stock_transfers.to_warehouse_id')
                .whereRaw('LOWER(warehouses.name) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereExists((uQuery) => {
              uQuery
                .from('users')
                .whereColumn('users.id', 'stock_transfers.transfer_by')
                .whereRaw('LOWER(users.full_name) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereExists((pQuery) => {
              pQuery
                .from('perusahaan')
                .whereColumn('perusahaan.id', 'stock_transfers.perusahaan_id')
                .whereRaw('LOWER(perusahaan.nm_perusahaan) LIKE ?', [`%${lowerSearch}%`])
            })
            .orWhereExists((cQuery) => {
              cQuery
                .from('cabang')
                .whereColumn('cabang.id', 'stock_transfers.cabang_id')
                .whereRaw('LOWER(cabang.nm_cabang) LIKE ?', [`%${lowerSearch}%`])
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
            fromWarehouse: { table: 'warehouses as from_warehouses', foreignKey: 'stock_transfers.from_warehouse_id', primaryKey: 'from_warehouses.id' },
            toWarehouse: { table: 'warehouses as to_warehouses', foreignKey: 'stock_transfers.to_warehouse_id', primaryKey: 'to_warehouses.id' },
            transferByUser: { table: 'users as transfer_users', foreignKey: 'stock_transfers.transfer_by', primaryKey: 'transfer_users.id' },
            approvedByUser: { table: 'users as approved_users', foreignKey: 'stock_transfers.approved_by', primaryKey: 'approved_users.id' },
            perusahaan: { table: 'perusahaan', foreignKey: 'stock_transfers.perusahaan_id', primaryKey: 'perusahaan.id' },
            cabang: { table: 'cabang', foreignKey: 'stock_transfers.cabang_id', primaryKey: 'cabang.id' },
          }

          if (relation in relationJoinInfo) {
            const joinInfo = relationJoinInfo[relation]
            dataQuery
              .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
              .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
              .select('stock_transfers.*')
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
      const startTime = Date.now()
      const stockTransfers = await dataQuery.paginate(page, limit)
      const queryTime = Date.now() - startTime

      // ✅ Log slow queries untuk monitoring
      if (queryTime > 1000) {
        console.warn(`🐌 Slow Query Alert: Stock Transfers took ${queryTime}ms`)
      }

      return response.ok({
        ...stockTransfers.toJSON(),
        _meta: {
          queryTime: queryTime,
          totalQueries: 'optimized'
        }
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data stock transfer',
        error: {
          name: 'Exception',
          status: 500
        }
      })
    }
  }

  async getStockTransferDetails({ params, response }: HttpContext) {
    try {
      // ✅ OPTIMASI: Efficient detailed query with select specific fields
      const stockTransfer = await StockTransfer.query()
        .where('id', params.id)
        .preload('perusahaan', (query) => {
          query.select(['id', 'nmPerusahaan'])
        })
        .preload('cabang', (query) => {
          query.select(['id', 'nmCabang', 'alamatCabang'])
        })
        .preload('fromWarehouse', (query) => {
          query.select(['id', 'name', 'address'])
        })
        .preload('toWarehouse', (query) => {
          query.select(['id', 'name', 'address'])
        })
        .preload('transferByUser', (query) => {
          query.select(['id', 'full_name', 'email'])
        })
        .preload('approvedByUser', (query) => {
          query.select(['id', 'full_name', 'email'])
        })
        .preload('rejectedByUser', (query) => {
          query.select(['id', 'full_name', 'email'])
        })
        .preload('stockTransferDetails', (stQuery) => {
          stQuery.preload('product', (productQuery) => {
            productQuery.select(['id', 'name', 'sku', 'kondisi'])
          })
        })
        .first()

      if (!stockTransfer) {
        return response.notFound({ message: 'Stock Transfer tidak ditemukan' })
      }

      return response.ok(stockTransfer.toJSON())
    } catch (error) {
      console.log(error)
      return response.internalServerError({
        message: 'Gagal mengambil detail Stock Transfer',
        error: error.message,
      })
    }
  }

  public async store({ request, auth, response }: HttpContext) {
    // Fungsi generateNo untuk no_po dengan format 0000/APU/PO/Bulan dalam angka romawi/tahun
    async function generateNo() {
      // Ambil nomor urut terakhir dari PO bulan ini
      const now   = new Date()
      const bulan = now.getMonth() + 1
      const tahun = now.getFullYear()

      // Konversi bulan ke angka romawi
      const bulanRomawi = toRoman(bulan)

      // Cari nomor urut terakhir untuk bulan dan tahun ini
      const lastTF = await StockTransfer
          .query()
          .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulan])
          .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun])
          .orderBy('no_transfer', 'desc')
          .first()

      let lastNumber = 0
      if (lastTF && lastTF.noTransfer) {
          // Ambil 4 digit pertama dari no_po terakhir
          const match = lastTF.noTransfer.match(/^(\d{4})/)
          if (match) {
              lastNumber = parseInt(match[1], 10)
          }
      }
      const nextNumber = (lastNumber + 1).toString().padStart(4, '0')

      // Format: 0000/APU/PO/BULAN_ROMAWI/TAHUN
      return `${nextNumber}/APU/BA/${bulanRomawi}/${tahun}`
    }
    const trx = await db.transaction()

    try {
      // Validasi input menggunakan stockTransferValidator
      const payload = await stockTransferValidator.validate(request.all())

      // Validasi agar gudang tujuan tidak sama dengan gudang asal
      if (payload.fromWarehouseId === payload.toWarehouseId) {
        await trx.rollback()
        return response.badRequest({
          message: 'Gudang tujuan tidak boleh sama dengan gudang asal.',
        })
      }

      // validasi stok
      for (const item of payload.stockTransferDetails) {
        const stock = await Stock.query({ client: trx })
          .where('product_id', item.productId)
          .where('warehouse_id', payload.fromWarehouseId)
          .first()

        if (!stock || stock.quantity < item.quantity) {
          const product = await Product.find(item.productId)
          const productName = product ? product.name : `ID ${item.productId}`
          await trx.rollback()
          return response.badRequest({
            message: `Stok untuk produk "${productName}" di gudang asal tidak mencukupi. Stok tersedia: ${
              stock?.quantity || 0
            }, kuantitas diminta: ${item.quantity}.`,
          })
        }
      }

      // Set transferBy dari user yang login dan status default 'draft'
      payload.transferBy = auth.user!.id
      payload.status = 'draft'

      // Buat StockTransfer
      const transfer = await StockTransfer.create({
        id             : randomUUID(),
        noTransfer     : await generateNo(),
        perusahaanId   : payload.perusahaanId,
        cabangId       : payload.cabangId,
        fromWarehouseId: payload.fromWarehouseId,
        toWarehouseId  : payload.toWarehouseId,
        date           : payload.date,
        penerima       : payload.penerima,
        transferBy     : payload.transferBy,
        description    : payload.description,
        status         : payload.status,
      }, { client: trx })

      // Buat detail transfer
      for (const item of payload.stockTransferDetails) {
        await StockTransferDetail.create({
          id             : randomUUID(),
          stockTransferId: transfer.id,
          productId      : item.productId,
          quantity       : item.quantity,
          description    : item.description,
        }, { client: trx })
      }

      await trx.commit()

      const createdTransfer = await StockTransfer.query()
        .where('id', transfer.id)
        .preload('stockTransferDetails', (query) => {
          query.preload('product')
        })
        .firstOrFail()

      return response.created({ message: 'Transfer berhasil dibuat', data: createdTransfer })
    } catch (error) {
      await trx.rollback()
      const message = error.messages?.[0]?.message || 'Gagal membuat transfer'
      return response.badRequest({ message, error })
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const payload = await updateStockTransferValidator.validate(request.all())

      const transfer = await StockTransfer.find(params.id)
      if (!transfer) {
        return response.notFound({ message: 'Transfer tidak ditemukan' })
      }

      transfer.perusahaanId    = payload.perusahaanId || transfer.perusahaanId
      transfer.cabangId        = payload.cabangId || transfer.cabangId
      transfer.fromWarehouseId = payload.fromWarehouseId || transfer.fromWarehouseId
      transfer.toWarehouseId   = payload.toWarehouseId || transfer.toWarehouseId
      transfer.date            = payload.date || transfer.date
      transfer.description     = payload.description || ''
      transfer.penerima        = payload.penerima || ''

      await transfer.save()

      // Hapus semua detail lama
      await StockTransferDetail.query({ client: trx })
      .where('stock_transfer_id', transfer.id)
      .delete()

      // Tambahkan detail baru
      for (const item of payload.stockTransferDetails) {
        await StockTransferDetail.create({
          id             : randomUUID(),
          stockTransferId: transfer.id,
          productId      : item.productId,
          quantity       : item.quantity,
          description    : item.description,
        }, { client: trx })
      }

      await trx.commit()

      const updatedTransfer = await StockTransfer.query()
        .where('id', transfer.id)
        .preload('stockTransferDetails', (query) => {
          query.preload('product')
        })
        .firstOrFail()

      return response.ok({ message: 'Transfer berhasil diperbarui', data: updatedTransfer })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({ message: 'Gagal memperbarui transfer', error })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const stockTransfer = await StockTransfer.findOrFail(params.id)
      if (!stockTransfer) {
        return response.notFound({ message: 'Stock Transfer tidak ditemukan' })
      }
      await stockTransfer.delete()
      return response.ok({ message: 'Stock Transfer berhasil dihapus' })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal menghapus Stock Transfer',
        error: error.message,
      })
    }
  }

  public async approveStockTransfer({ params, auth, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const transfer = await StockTransfer.query().where('id', params.id).preload('stockTransferDetails').firstOrFail()

      if (transfer.status === 'approved') {
        return response.badRequest({ message: 'Transfer sudah di-approve' })
      }

      // Update stocks
      for (const detail of transfer.stockTransferDetails) {
        // Kurangi dari gudang asal
        const fromStock = await Stock.query()
          .where('product_id', detail.productId)
          .andWhere('warehouse_id', transfer.fromWarehouseId)
          .first()

        if (!fromStock || fromStock.quantity < detail.quantity) {
          throw new Error(`Stok tidak cukup untuk produk ID ${detail.productId}`)
        }

        fromStock.quantity -= detail.quantity
        await fromStock.save()

        // Tambahkan ke gudang tujuan
        const toStock = await Stock.query()
          .where('product_id', detail.productId)
          .andWhere('warehouse_id', transfer.toWarehouseId)
          .first()

        if (toStock) {
          toStock.quantity += detail.quantity
          await toStock.save()
        } else {
          await Stock.create({
            productId: detail.productId,
            warehouseId: transfer.toWarehouseId,
            quantity: detail.quantity,
          }, { client: trx })
        }
      }

      // Update status transfer
      transfer.status = 'approved'
      transfer.approvedBy = auth.user!.id
      transfer.approvedAt = DateTime.now()
      await transfer.save()

      await trx.commit()
      return response.ok({ message: 'Transfer berhasil di-approve' })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({ message: 'Gagal approve transfer', error: error.message })
    }
  }

  async rejectStockTransfer({ params, response, auth }: HttpContext) {
    try {
      const transfer = await StockTransfer.find(params.id)
      if (!transfer) {
          return response.notFound({ message: 'Transfer tidak ditemukan' })
      }

      transfer.status = 'rejected'
      transfer.rejectedAt = DateTime.now()
      if (auth.user) {
          transfer.rejectedBy = auth.user.id
      }
      await transfer.save()

      return response.ok({ message: 'Transfer berhasil direject' })
    } catch (error) {
      return response.internalServerError({ message: 'Gagal mereject transfer', error: error.message })
    }
  }

  async getTotalStockTransfer({ response }: HttpContext) {
    try {
      // Total semua Stock Transfer
      const totalStockTransfer = await StockTransfer.query().count('id as total')

      // Total Stock Transfer dengan status 'draft'
      const totalDraft = await StockTransfer.query().where('status', 'draft').count('id as total')

      // Total Stock Transfer dengan status 'approved'
      const totalApproved = await StockTransfer.query().where('status', 'approved').count('id as total')

      // Total Stock Transfer dengan status 'rejected'
      const totalRejected = await StockTransfer.query().where('status', 'rejected').count('id as total')

      return response.ok({
        total   : totalStockTransfer[0]?.$extras.total || 0,
        draft   : totalDraft[0]?.$extras.total || 0,
        approved: totalApproved[0]?.$extras.total || 0,
        rejected: totalRejected[0]?.$extras.total || 0,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil total Stock Transfer',
        error: error.message,
      })
    }
  }

}
