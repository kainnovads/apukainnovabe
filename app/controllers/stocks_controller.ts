import type { HttpContext } from '@adonisjs/core/http'
import Stock from '#models/stock'

export default class StocksController {
  async index({ request, response }: HttpContext) {
    try {
      const page        = request.input('page', 1)
      const limit       = request.input('rows', 10)
      const search      = request.input('search', '')
      const searchValue = search || request.input('search.value', '')
      const sortField   = request.input('sortField')
      const sortOrder   = request.input('sortOrder')
      const productId   = request.input('productId')
      const warehouseId = request.input('warehouseId')
      const all         = request.input('all')

      let dataQuery = Stock.query()

      if (productId) {
        dataQuery.where('product_id', productId)
      }

      if (warehouseId) {
        dataQuery.where('warehouse_id', warehouseId)
      }

      if (searchValue) {
        // Pencarian tidak case sensitive di kolom terkait product & warehouse
        const lowerSearch = searchValue.toLowerCase()
        dataQuery.where((query) => {
          query
            // cari di product: name atau sku
            .orWhereHas('product', (pQuery) => {
              pQuery
                .whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
                .orWhereRaw('LOWER(sku) LIKE ?', [`%${lowerSearch}%`])
            })
            // cari di warehouse: name atau code
            .orWhereHas('warehouse', (wQuery) => {
              wQuery
                .whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
                .orWhereRaw('LOWER(code) LIKE ?', [`%${lowerSearch}%`])
            })
        })
      }

      if (sortField && sortOrder) {
        const actualSortOrder = sortOrder === '1' ? 'asc' : 'desc'
        const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

        if (sortField.includes('.')) {
          const [relation, column] = sortField.split('.')
          const dbColumn = toSnakeCase(column)

          if (relation === 'product') {
            dataQuery
              .leftJoin('products', 'stocks.product_id', 'products.id')
              .orderBy(`products.${dbColumn}`, actualSortOrder)
              .select('stocks.*')
          } else if (relation === 'warehouse') {
            dataQuery
              .leftJoin('warehouses', 'stocks.warehouse_id', 'warehouses.id')
              .orderBy(`warehouses.${dbColumn}`, actualSortOrder)
              .select('stocks.*')
          } else if (relation === 'user') {
            dataQuery
              .leftJoin('users', 'stocks.user_id', 'users.id')
              .orderBy(`users.${dbColumn}`, actualSortOrder)
              .select('stocks.*')
          }
        } else {
          const dbColumn = toSnakeCase(sortField)
          dataQuery.orderBy(dbColumn, actualSortOrder)
        }
      }

      const queryWithPreloads = dataQuery
        .preload('warehouse')
        .preload('product', (productQuery) => {
          productQuery.preload('unit')
        })

      if (all) {
        const stocks = await queryWithPreloads
        return response.ok({ data: stocks })
      }

      const stocks = await queryWithPreloads.paginate(page, limit)

      return response.ok(stocks.toJSON())
    } catch (error) {
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data stock',
        error: {
          name: 'Exception',
          status: 500
        }
      })
    }
  }

  // Mengambil total stock keseluruhan dan total stock per gudang
  async getTotalStock({ response }: HttpContext) {
    try {
      // Total stock keseluruhan
      const totalStock = await Stock.query().count('id as total')

      // Total stock per gudang
      const stockPerWarehouse = await Stock.query()
        .select('warehouse_id')
        .count('id as total')
        .groupBy('warehouse_id')

      return response.ok({
        total: totalStock[0]?.$extras?.total || 0,
        perWarehouse: stockPerWarehouse.map(item => ({
          warehouse_id: item.warehouseId,
          total: item.$extras.total
        }))
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data total stock',
        error: error.message,
      })
    }
  }

  async validateStockBatch({ request, response }: HttpContext) {
    const { items } = request.body()

    if (!Array.isArray(items) || items.length === 0) {
      return response.badRequest({ message: 'Items harus berupa array dan tidak boleh kosong.' })
    }

    try {
      // Buat query builder untuk mengambil stok
      const stockQuery = Stock.query()

      // Buat klausa WHERE dinamis untuk semua item
      // (product_id = ? AND warehouse_id = ?) OR (product_id = ? AND warehouse_id = ?)
      stockQuery.where((builder) => {
        for (const item of items) {
          builder.orWhere((subBuilder) => {
            subBuilder.where('product_id', item.productId).andWhere('warehouse_id', item.warehouseId)
          })
        }
      })

      const availableStocks = await stockQuery

      // Buat map untuk akses cepat ke stok yang tersedia
      const stockMap = new Map()
      for (const stock of availableStocks) {
        stockMap.set(`${stock.productId}-${stock.warehouseId}`, stock.quantity)
      }

      // Validasi setiap item
      const validationResults = items.map((item) => {
        const availableStock = stockMap.get(`${item.productId}-${item.warehouseId}`) || 0
        return {
          productId: item.productId,
          warehouseId: item.warehouseId,
          requestedQuantity: item.quantity,
          availableStock: availableStock,
          hasEnoughStock: availableStock >= item.quantity,
        }
      })

      return response.ok({ data: validationResults })
    } catch (error) {
      console.error('Stock validation error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat memvalidasi stok.',
        error: error.message,
      })
    }
  }

  async exportExcel({ request, response }: HttpContext) {
    try {
      const search = request.input('search', '')
      const searchValue = search || request.input('search.value', '')
      const productId = request.input('productId')
      const warehouseId = request.input('warehouseId')

      // Ambil data perusahaan untuk header
      const Perusahaan = (await import('#models/perusahaan')).default
      const perusahaan = await Perusahaan.first()
      const nmPerusahaan = perusahaan?.nmPerusahaan || ''

      let dataQuery = Stock.query()

      if (productId) {
        dataQuery.where('product_id', productId)
      }

      if (warehouseId) {
        dataQuery.where('warehouse_id', warehouseId)
      }

      if (searchValue) {
        // Pencarian tidak case sensitive di kolom terkait product & warehouse
        const lowerSearch = searchValue.toLowerCase()
        dataQuery.where((query) => {
          query
            // cari di product: name atau sku
            .orWhereHas('product', (pQuery) => {
              pQuery
                .whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
                .orWhereRaw('LOWER(sku) LIKE ?', [`%${lowerSearch}%`])
            })
            // cari di warehouse: name atau code
            .orWhereHas('warehouse', (wQuery) => {
              wQuery
                .whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
                .orWhereRaw('LOWER(code) LIKE ?', [`%${lowerSearch}%`])
            })
        })
      }

      const queryWithPreloads = dataQuery
        .preload('warehouse')
        .preload('product', (productQuery) => {
          productQuery.preload('unit')
        })

      // Ambil semua data tanpa pagination untuk export
      const stocks = await queryWithPreloads.orderBy('id', 'desc')

      // Format data untuk Excel - menggunakan struktur nested object yang sesuai dengan frontend
      const excelData = stocks.map((stock) => ({
        id: stock.id,
        product: {
          sku: stock.product?.sku || '-',
          name: stock.product?.name || '-',
          unit: {
            name: stock.product?.unit?.name || '-',
          },
        },
        warehouse: {
          code: stock.warehouse?.code || '-',
          name: stock.warehouse?.name || '-',
        },
        quantity: Math.floor(stock.quantity),
        createdAt: stock.createdAt.toFormat('dd/MM/yyyy HH:mm'),
        updatedAt: stock.updatedAt.toFormat('dd/MM/yyyy HH:mm'),
      }))

      return response.ok({
        data: excelData,
        total: stocks.length,
        nmPerusahaan: nmPerusahaan,
      })
    } catch (error) {
      console.error('Export Excel error:', error)
      return response.internalServerError({
        message: 'Gagal export data stock ke Excel',
        error: error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const stock = await Stock.findOrFail(params.id)
      
      await stock.delete()

      return response.ok({
        message: 'Stock berhasil dihapus',
        data: { id: stock.id }
      })
    } catch (error) {
      console.error('Delete stock error:', error)
      return response.internalServerError({
        message: 'Gagal menghapus stock',
        error: error.message,
      })
    }
  }
}
