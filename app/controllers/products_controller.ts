import type { HttpContext } from '@adonisjs/core/http'
import { productValidator } from '#validators/product'
import app from '@adonisjs/core/services/app'
import Product from '#models/product'

export default class ProductsController {
    async index({ request, response }: HttpContext) {
    try {
      const page        = request.input('page', 1)
      const limit       = request.input('rows', 10)
      const search      = request.input('search', '')
      const searchValue = search || request.input('search.value', '')
      const sortField   = request.input('sortField')
      const sortOrder   = request.input('sortOrder')
      const warehouseId = request.input('warehouseId')
      const includeStocks = request.input('includeStocks', false) // ✅ Conditional loading
      
      // 🔍 DEBUG: Log untuk debugging
      console.log('🔍 Products Controller Debug:', {
        warehouseId,
        includeStocks,
        searchValue
      })

      // ✅ OPTIMASI: Efficient base query dengan minimal preloading
      let dataQuery = Product.query()
        .preload('unit', (query) => {
          query.select(['id', 'name', 'symbol'])
        })
        .preload('category', (query) => {
          query.select(['id', 'name'])
        })

      if (searchValue) {
        // ✅ OPTIMASI: Efficient search dengan proper indexing
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
            .whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(sku) LIKE ?', [`%${lowerSearch}%`])
        })
      }

      // ✅ OPTIMASI: Conditional warehouse filtering dengan efficient preload
             if (warehouseId) {
         if (includeStocks) {
           console.log('🔍 Preloading stocks with warehouse filter:', warehouseId)
           dataQuery.preload('stocks', (stockQuery) => {
             stockQuery
               .select(['id', 'product_id', 'warehouse_id', 'quantity'])
               .where('warehouse_id', warehouseId)
           })
         }

                 // ✅ Filter produk hanya yang ada di warehouse tertentu dan ada stok
         dataQuery.whereExists((stockQuery) => {
           stockQuery
             .from('stocks')
             .whereColumn('stocks.product_id', 'products.id')
             .where('warehouse_id', warehouseId)
             .where('quantity', '>', 0)
         })
             } else if (includeStocks) {
         // ✅ TAMBAHAN: Preload stocks untuk semua warehouse jika includeStocks=true tanpa warehouseId
         console.log('🔍 Preloading stocks without warehouse filter')
         dataQuery.preload('stocks', (stockQuery) => {
           stockQuery.select(['id', 'product_id', 'warehouse_id', 'quantity'])
         })
       }

      // ✅ OPTIMASI: Efficient sorting dengan proper indexing
      if (sortField && sortOrder) {
        const actualSortOrder = sortOrder === '1' ? 'asc' : 'desc'
        const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

        if (sortField.includes('.')) {
          const [relation, column] = sortField.split('.')
          const dbColumn = toSnakeCase(column)

          // ✅ OPTIMASI: Efficient joins dengan nama tabel yang benar
          const relationJoinInfo: Record<string, { table: string, foreignKey: string, primaryKey: string }> = {
            unit: { table: 'units', foreignKey: 'products.unit_id', primaryKey: 'units.id' },
            category: { table: 'categories', foreignKey: 'products.category_id', primaryKey: 'categories.id' },
          }

          if (relation in relationJoinInfo) {
            const joinInfo = relationJoinInfo[relation]
            dataQuery
              .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
              .orderBy(`${joinInfo.table}.${dbColumn}`, actualSortOrder)
              .select('products.*')
          }
        } else {
          const dbColumn = toSnakeCase(sortField)
          dataQuery.orderBy(`products.${dbColumn}`, actualSortOrder)
        }
      } else {
        dataQuery.orderBy('id', 'desc')
      }

             // ✅ OPTIMASI: Add query performance monitoring
       const startTime = Date.now()
       const product = await dataQuery.paginate(page, limit)
       const queryTime = Date.now() - startTime

       // 🔍 DEBUG: Log hasil query untuk debugging
       const productData = product.toJSON()
       console.log('🔍 Products Controller - Query Result Debug:', {
         totalProducts: productData.data?.length || 0,
         firstProduct: productData.data?.length > 0 ? {
           id: productData.data[0]?.id,
           name: productData.data[0]?.name,
           stocks: productData.data[0]?.stocks,
           stocksCount: productData.data[0]?.stocks?.length || 0
         } : null
       })

       // ✅ Log slow queries untuk monitoring
       if (queryTime > 500) {
         console.warn(`🐌 Slow Query Alert: Products took ${queryTime}ms`)
       }

      return response.ok({
        ...product.toJSON(),
        _meta: {
          queryTime: queryTime,
          totalQueries: 'optimized'
        }
      })
    } catch (error) {
      console.error(error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data produk',
        error: error.message,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      // ✅ OPTIMASI: Select specific fields dan eager loading
      const product = await Product.query()
        .where('id', params.id)
        .preload('unit', (query) => {
          query.select(['id', 'name', 'symbol'])
        })
        .preload('category', (query) => {
          query.select(['id', 'name'])
        })
        .preload('stocks', (query) => {
          query
            .select(['id', 'product_id', 'warehouse_id', 'quantity'])
            .preload('warehouse', (warehouseQuery) => {
              warehouseQuery.select(['id', 'name'])
            })
        })
        .first()

      if (!product) {
        return response.notFound({ message: 'Product tidak ditemukan' })
      }
      return response.ok(product)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil detail product',
        error: error.message,
      })
    }
  }

    async store({ request, response }: HttpContext) {
    try {
      // Validasi data product (kecuali image)
      const payload = await request.validateUsing(productValidator)

      // Cek apakah SKU sudah ada
      const existingProduct = await Product.findBy('sku', payload.sku)
      if (existingProduct) {
        return response.badRequest({
          message: 'SKU sudah digunakan, silakan gunakan SKU lain.',
          error: 'products_sku_unique'
        })
      }

      // Proses upload image jika ada file image
      let logoPath = null
      const imageFile = request.file('image', {
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
        size: '2mb',
      })

      if (imageFile) {
        // Simpan file image ke folder public/uploads/logo_vendor
        const fileName = `${new Date().getTime()}_${imageFile.clientName}`
        await imageFile.move(app.publicPath('uploads/product'), {
          name: fileName,
          overwrite: true,
        })
        logoPath = `uploads/product/${fileName}`
      }

      // Tambahkan path image ke payload jika ada
      const product = await Product.create({
        ...payload,
        image: logoPath || '',
      })

      return response.created(product)
    } catch (error) {
      // Cek error duplikat SKU
      if (error.code === '23505' && error.detail && error.detail.includes('products_sku_unique')) {
        return response.badRequest({
          message: 'SKU sudah digunakan, silakan gunakan SKU lain.',
          error: error.detail,
        })
      }
      return response.badRequest({
        message: 'Gagal membuat product',
        error: error.messages || error.message,
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const product = await Product.find(params.id)
      if (!product) {
        return response.notFound({ message: 'Product tidak ditemukan' })
      }

      // Validasi data (kecuali image)
      const payload = await request.validateUsing(productValidator)

      // Cek duplikasi SKU hanya jika SKU berubah
      if (payload.sku && payload.sku !== product.sku) {
        const existingProduct = await Product.findBy('sku', payload.sku)
        if (existingProduct) {
          return response.badRequest({
            message: 'SKU sudah digunakan, silakan gunakan SKU lain.',
            error: 'products_sku_unique'
          })
        }
      }

      const dataUpdate = {
        name      : payload.name ?? product.name,
        sku       : payload.sku ?? product.sku,
        unitId    : payload.unitId ?? product.unitId,
        categoryId: payload.categoryId ?? product.categoryId,
        stockMin  : payload.stockMin ?? product.stockMin,
        priceBuy  : payload.priceBuy ?? product.priceBuy,
        priceSell : payload.priceSell ?? product.priceSell,
        isService : payload.isService ?? product.isService,
        kondisi   : payload.kondisi ?? product.kondisi,
      }

      // Proses upload image jika ada file image baru
      let logoPath = product.image // default: image lama
      const imageFile = request.file('image', {
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
        size: '2mb',
      })

      if (imageFile) {
        // Simpan file image ke folder public/uploads/product
        const fileName = `${new Date().getTime()}_${imageFile.clientName}`
        await imageFile.move(app.publicPath('uploads/product'), {
          name: fileName,
          overwrite: true,
        })
        logoPath = `uploads/product/${fileName}`
      }

      // Gabungkan data update dan logoPath
      product.merge({
        ...dataUpdate,
        image: logoPath || '',
      })

      await product.save()
      return response.ok(product)
    } catch (error) {
      // Cek error duplikat SKU
      if (error.code === '23505' && error.detail && error.detail.includes('products_sku_unique')) {
        return response.badRequest({
          message: 'SKU sudah digunakan, silakan gunakan SKU lain.',
          error: error.detail,
        })
      }
      return response.badRequest({
        message: 'Gagal memperbarui product',
        error: error.messages || error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const product = await Product.find(params.id)
      if (!product) {
        return response.notFound({ message: 'Product tidak ditemukan' })
      }
      await product.delete()
      return response.ok({ message: 'Product berhasil dihapus' })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal menghapus product',
        error: error.message,
      })
    }
  }
}
