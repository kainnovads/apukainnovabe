import type { HttpContext } from '@adonisjs/core/http'
import { toRoman } from '#helper/bulan_romawi'
import SalesOrder from '#models/sales_order'
import SalesReturn from '#models/sales_return'
import SalesReturnItem from '#models/sales_return_item'
import Stock from '#models/stock'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { salesReturnValidator, updateSalesReturnValidator } from '#validators/sales_return'

export default class SalesReturnsController {
  async index({ request, response }: HttpContext) {
    try {
      const page         = request.input('page', 1)
      const limit        = request.input('rows', 10)
      const search       = request.input('search', '')
      const searchValue  = search || request.input('search.value', '')
      const sortField    = request.input('sortField')
      const sortOrder    = request.input('sortOrder')
      const customerId   = request.input('customerId')
      const perusahaanId = request.input('perusahaanId')
      const status       = request.input('status')
      const includeItems = request.input('includeItems', false) // ✅ Conditional loading

      // ✅ OPTIMASI: Efficient base query dengan minimal preloading
      let dataQuery = SalesReturn.query()
        .preload('customer', (query) => {
          query.select(['id', 'name', 'email', 'phone'])
        })
        .preload('perusahaan', (query) => {
          query.select(['id', 'nmPerusahaan'])
        })
        .preload('cabang', (query) => {
          query.select(['id', 'nmCabang', 'perusahaanId'])
        })
        .preload('salesOrder', (query) => {
          query.select(['id', 'no_so', 'date', 'status'])
        })
        .preload('createdByUser', (query) => {
          query.select(['id', 'full_name', 'email'])
        })

      // ✅ OPTIMASI: Conditional preloading untuk performance
      if (includeItems) {
        dataQuery.preload('salesReturnItems', (query) => {
          query
            .preload('product', (productQuery) => {
              productQuery.select(['id', 'name', 'sku', 'priceSell'])
            })
            .preload('warehouse', (warehouseQuery) => {
              warehouseQuery.select(['id', 'name'])
            })
        })
      }

      // ✅ OPTIMASI: Preload users hanya jika diperlukan
      if (status && ['approved', 'rejected'].includes(status)) {
        dataQuery.preload('approvedByUser', (query) => {
          query.select(['id', 'full_name'])
        })
        dataQuery.preload('rejectedByUser', (query) => {
          query.select(['id', 'full_name'])
        })
      }

      if (customerId) {
        dataQuery.where('customer_id', customerId)
      }
      if (perusahaanId) {
        dataQuery.where('perusahaan_id', perusahaanId)
      }
      if (status) {
        dataQuery.where('status', status)
      }

      if (searchValue) {
        // ✅ OPTIMASI: Menggunakan exists() untuk relationship search
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
              .whereRaw('LOWER(no_sr) LIKE ?', [`%${lowerSearch}%`])
              .orWhereRaw('LOWER(description) LIKE ?', [`%${lowerSearch}%`])
              .orWhereExists((customerQuery) => {
                customerQuery
                  .from('customers')
                  .whereColumn('customers.id', 'sales_returns.customer_id')
                  .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`])
              })
              .orWhereExists((userQuery) => {
                userQuery
                  .from('users')
                  .whereColumn('users.id', 'sales_returns.created_by')
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
            customer: { table: 'customers', foreignKey: 'sales_returns.customer_id', primaryKey: 'customers.id' },
            perusahaan: { table: 'perusahaan', foreignKey: 'sales_returns.perusahaan_id', primaryKey: 'perusahaan.id' },
            cabang: { table: 'cabang', foreignKey: 'sales_returns.cabang_id', primaryKey: 'cabang.id' },
            createdByUser: { table: 'users as created_users', foreignKey: 'sales_returns.created_by', primaryKey: 'created_users.id' },
            approvedByUser: { table: 'users as approved_users', foreignKey: 'sales_returns.approved_by', primaryKey: 'approved_users.id' },
            rejectedByUser: { table: 'users as rejected_users', foreignKey: 'sales_returns.rejected_by', primaryKey: 'rejected_users.id' },
          }

          if (relation in relationJoinInfo) {
            const joinInfo = relationJoinInfo[relation]
            dataQuery
              .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
              .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
              .select('sales_returns.*')
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
      const salesReturns = await dataQuery.paginate(page, limit)
      const queryTime = Date.now() - startTime

      // ✅ Log slow queries untuk monitoring
      if (queryTime > 1000) {
        console.warn(`🐌 Slow Query Alert: Sales Returns took ${queryTime}ms`)
      }

      return response.ok({
        ...salesReturns.toJSON(),
        _meta: {
          queryTime: queryTime,
          totalQueries: 'optimized'
        }
      })
      } catch (error) {
      return response.internalServerError({
          message: 'Terjadi kesalahan saat mengambil data sales return',
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
        // ✅ OPTIMASI: Efficient detailed query with select specific fields
        const sr = await SalesReturn.query()
        .where('id', params.id)
        .preload('customer', (query) => {
          query.select(['id', 'name', 'email', 'phone', 'address'])
        })
        .preload('perusahaan', (query) => {
          query.select(['id', 'nmPerusahaan'])
        })
        .preload('cabang', (query) => {
          query.select(['id', 'nmCabang', 'alamatCabang'])
        })
        .preload('salesOrder', (query) => {
          query.select(['id', 'no_so', 'date', 'status', 'total'])
        })
        .preload('salesReturnItems', (query) => {
            query
              .preload('product', (productQuery) => {
                productQuery.select(['id', 'name', 'sku', 'price', 'description'])
              })
              .preload('warehouse', (warehouseQuery) => {
                warehouseQuery.select(['id', 'name'])
              })
        })
        .preload('createdByUser', (query) => {
          query.select(['id', 'full_name', 'email'])
        })
        .preload('approvedByUser', (query) => {
          query.select(['id', 'full_name', 'email'])
        })
        .preload('rejectedByUser', (query) => {
          query.select(['id', 'full_name', 'email'])
        })
        .firstOrFail()

        return response.ok({
          message: 'Sales Return ditemukan',
        data: sr,
        })
    } catch (error) {
        return response.notFound({ message: 'Sales Return tidak ditemukan' })
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
      const lastSr = await SalesReturn
          .query()
          .whereRaw('EXTRACT(MONTH FROM return_date) = ?', [bulan])
          .whereRaw('EXTRACT(YEAR FROM return_date) = ?', [tahun])
          .orderBy('no_sr', 'desc')
          .first()

      let lastNumber = 0
      if (lastSr && lastSr.noSr) {
          // Ambil 4 digit pertama dari no_po terakhir
          const match = lastSr.noSr.match(/^(\d{4})/)
          if (match) {
              lastNumber = parseInt(match[1], 10)
          }
      }
      const nextNumber = (lastNumber + 1).toString().padStart(4, '0')

      // Format: 0000/APU/SR/BULAN_ROMAWI/TAHUN
      return `${nextNumber}/APU/SR/${bulanRomawi}/${tahun}`
    }
    const payload = await request.validateUsing(salesReturnValidator)
    const items = payload.salesReturnItems || []

    if (!Array.isArray(items) || items.length === 0) {
    return response.badRequest({ message: 'Items tidak boleh kosong ya' })
    }

    let attachmentPath: string | null = null

    // Upload file jika ada
    if (payload.attachment && payload.attachment instanceof MultipartFile) {
      try {
        const fileName = `${Date.now()}_${payload.attachment.clientName}`
        await payload.attachment.move(app.publicPath('uploads/sales_returns'), {
          name     : fileName,
          overwrite: true,
        })

        if (!payload.attachment.isValid) {
          return response.badRequest({
            message: 'Gagal upload file attachment',
            error: payload.attachment.errors.map((error: any) => error.message),
          })
        }

        attachmentPath = `uploads/sales_returns/${fileName}`
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

      const total = subtotal

      const sr = await SalesReturn.create({
          customerId       : payload.customerId,
          perusahaanId     : payload.perusahaanId,
          cabangId         : payload.cabangId,
          salesOrderId     : payload.salesOrderId,
          noSr             : payload.noSr || await generateNo(),
          returnDate       : payload.returnDate,
          status           : payload.status || 'draft',
          totalReturnAmount: total,
          createdBy        : payload.createdBy,
          approvedBy       : payload.approvedBy,
          rejectedBy       : payload.rejectedBy,
          approvedAt       : payload.approvedAt ? DateTime.fromJSDate(payload.approvedAt): undefined,
          rejectedAt       : payload.rejectedAt ? DateTime.fromJSDate(payload.rejectedAt): undefined,
          description      : payload.description,
          attachment       : attachmentPath || undefined,
      }, { client: trx })

      for (const item of items) {
          await SalesReturnItem.create({
          salesReturnId   : sr.id,
          salesOrderItemId: item.salesOrderItemId,
          productId       : item.productId,
          warehouseId     : item.warehouseId,
          quantity        : item.quantity,
          price           : item.price,
          reason          : item.reason,
          description     : item.description,
          }, { client: trx })
      }

      await trx.commit()

      return response.created({
          message: 'Sales Return berhasil dibuat',
          data: sr,
      })
      } catch (error) {
      await trx.rollback()
      console.error('SR Error:', error)
      return response.internalServerError({
          message: 'Gagal membuat Sales Return',
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateSalesReturnValidator)
    const items = payload.salesReturnItems || []

    if (!Array.isArray(items) || items.length === 0) {
        return response.badRequest({ message: 'Items tidak boleh kosong' })
    }

    const trx = await db.transaction()

    try {
        const sr = await SalesReturn.findOrFail(params.id, { client: trx })

        // Optional: delete old file
        let attachmentPath = sr.attachment
        if (payload.attachment && payload.attachment instanceof MultipartFile) {
            const fileName = `${Date.now()}_${payload.attachment.clientName}`
            await payload.attachment.move(app.publicPath('uploads/sales_returns'), {
                name: fileName,
                overwrite: true,
            })

            if (!payload.attachment.isValid) {
                return response.badRequest({
                message: 'Gagal upload file attachment',
                error: payload.attachment.errors.map((e: any) => e.message),
                })
            }

            attachmentPath = `uploads/sales_returns/${fileName}`
        }

        // Update SO utama
        sr.merge({
        customerId       : payload.customerId,
        perusahaanId     : payload.perusahaanId,
        cabangId         : payload.cabangId,
        salesOrderId     : payload.salesOrderId,
        noSr             : payload.noSr,
        returnDate       : payload.returnDate,
        status           : payload.status || 'draft',
        totalReturnAmount: payload.totalReturnAmount || 0,
        createdBy        : payload.createdBy,
        approvedBy       : payload.approvedBy,
        rejectedBy       : payload.rejectedBy,
        approvedAt       : payload.approvedAt ? DateTime.fromJSDate(payload.approvedAt): undefined,
        rejectedAt       : payload.rejectedAt ? DateTime.fromJSDate(payload.rejectedAt): undefined,
        description      : payload.description,
        attachment       : attachmentPath || undefined,
        })
        await sr.save()

        // Hapus item lama lalu insert ulang item baru
        await SalesReturnItem.query({ client: trx })
        .where('sales_return_id', sr.id)
        .delete()

        for (const item of items) {
        await SalesReturnItem.create({
                salesReturnId: sr.id,
                salesOrderItemId: item.salesOrderItemId,
                productId    : item.productId,
                warehouseId  : item.warehouseId,
                quantity     : item.quantity,
                price        : item.price,
                reason       : item.reason,
                description  : item.description,
            }, { client: trx })
        }

        await trx.commit()

        return response.ok({
        message: 'Sales Return berhasil diperbarui',
        data: sr,
        })
    } catch (error) {
        await trx.rollback()
        console.error('SR Update Error:', error)
        return response.internalServerError({ message: 'Gagal memperbarui Sales Return' })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const sr = await SalesReturn.find(params.id)
      if (!sr) {
          return response.notFound({ message: 'SalesReturn tidak ditemukan' })
      }
      await sr.delete()
      return response.ok({ message: 'SalesReturn berhasil dihapus' })
      } catch (error) {
        return response.internalServerError({
        message: 'Gagal menghapus sales return',
        error: error.message,
      })
    }
  }

  async approveSalesReturn({ params, response, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const sr = await SalesReturn.query({ client: trx })
        .where('id', params.id)
        .preload('salesReturnItems')
        .first()

      if (!sr) {
        await trx.rollback()
        return response.notFound({ message: 'SalesReturn tidak ditemukan' })
      }

      sr.status = 'approved'
      sr.approvedAt = DateTime.now()
      if (auth.user) {
        sr.approvedBy = auth.user.id
      }
      await sr.save()

      // Kembalikan stok
      for (const item of sr.salesReturnItems) {
        if (item.warehouseId) {
          const stock = await Stock.query({ client: trx })
            .where('product_id', item.productId)
            .andWhere('warehouse_id', item.warehouseId)
            .first()

          if (stock) {
            stock.quantity = Number(stock.quantity) + Number(item.quantity)
            await stock.save()
          } else {
            await Stock.create(
              {
                productId: item.productId,
                warehouseId: item.warehouseId,
                quantity: item.quantity,
              },
              { client: trx }
            )
          }
        } else {
          await trx.rollback()
          return response.internalServerError({
            message: `Gagal approve: Gudang tidak ditemukan untuk item retur ${item.id}.`,
          })
        }
      }

      await trx.commit()

      return response.ok({ message: 'Sales Return berhasil diapprove dan stok telah dikembalikan' })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        message: 'Gagal mengapprove sales return',
        error: error.message,
      })
    }
  }

  async rejectSalesReturn({ params, response, auth }: HttpContext) {
    try {
        const sr = await SalesReturn.find(params.id)
        if (!sr) {
            return response.notFound({ message: 'SalesReturn tidak ditemukan' })
        }

        sr.status = 'rejected'
        sr.rejectedAt = DateTime.fromJSDate(new Date())
        if (auth.user) {
            sr.rejectedBy = auth.user.id
        }
        await sr.save()

        return response.ok({ message: 'Sales Return berhasil direject' })
    } catch (error) {
        return response.internalServerError({ message: 'Gagal mereject sales return' })
    }
  }

  async getSalesReturnDetails({ params, response }: HttpContext) {
    try {
      const sr = await SalesReturn.query()
      .where('id', params.id)
      .preload('salesReturnItems', (query) => {
        query.preload('product')
      })
      .preload('createdByUser', (query) => {
        query.select('id', 'name')
      })
      .preload('approvedByUser', (query) => {
        query.select('id', 'name')
      })
      .preload('rejectedByUser', (query) => {
        query.select('id', 'name')
      })
      .firstOrFail()

      return response.ok({
        message: 'Sales Return ditemukan',
        data: sr,
      })
    } catch (error) {
      return response.notFound({ message: 'Sales Return tidak ditemukan' })
    }
  }

  async getSalesOrder({ params, response }: HttpContext) {
    try {
      const so = await SalesOrder.query()
        .where('customer_id', params.id)
        .where('status', 'delivered')
        .preload('customer')
        .preload('perusahaan')
        .preload('cabang')
        .preload('salesOrderItems', (query) => {
          query.where('statusPartial', true)
          query.preload('product')
          query.preload('warehouse')
        })
        .preload('createdByUser')
        .preload('approvedByUser')
        .preload('deliveredByUser')
        .preload('rejectedByUser')
        .exec()

      return response.ok({
        message: 'Sales Order ditemukan',
        data: so,
      })
    } catch (error) {
      return response.notFound({ message: 'Sales Order tidak ditemukan' })
    }
  }
}
