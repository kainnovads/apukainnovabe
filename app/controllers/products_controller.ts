import type { HttpContext } from '@adonisjs/core/http'
import { productValidator } from '#validators/product'
import Product from '#models/product'
import StorageService from '#services/storage_service'
import { MultipartFile } from '@adonisjs/core/bodyparser'


export default class ProductsController {
    private storageService: StorageService

    // Constructor
    constructor() {
        this.storageService = new StorageService()
    }

    async index({ request, response }: HttpContext) {
    try {
      const page        = request.input('page', 1)
      const limit       = request.input('rows', 10)
      const search      = request.input('search', '')
      const searchValue = search || request.input('search.value', '')
      const sortField   = request.input('sortField')
      const sortOrder   = request.input('sortOrder')
      const warehouseId = request.input('warehouseId')
      const includeStocks = request.input('includeStocks', false)

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
      // ✅ OPTIMASI PERFORMA: Tambahkan monitoring dan caching
      const startTime = Date.now()

      // ✅ OPTIMASI: Select specific fields dan eager loading dengan limit
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
            .where('quantity', '>', 0) // ✅ OPTIMASI: Hanya ambil stock yang ada
            .limit(50) // ✅ OPTIMASI: Batasi jumlah stock yang dimuat
            .preload('warehouse', (warehouseQuery) => {
              warehouseQuery.select(['id', 'name'])
            })
        })
        .first()

      const queryTime = Date.now() - startTime

      // ✅ MONITORING: Log slow queries
      if (queryTime > 1000) {
        console.error(`🐌 SLOW QUERY ALERT: Product.show(${params.id}) took ${queryTime}ms`)
      } else if (queryTime > 500) {
        console.warn(`⚠️ Slow Query: Product.show(${params.id}) took ${queryTime}ms`)
      }

      if (!product) {
        return response.notFound({ message: 'Product tidak ditemukan' })
      }

      // ✅ OPTIMASI: Tambahkan metadata performa
      return response.ok({
        ...product.toJSON(),
        _meta: {
          queryTime: queryTime,
          stocksLoaded: product.stocks?.length || 0,
          performanceLevel: queryTime < 100 ? 'excellent' : queryTime < 500 ? 'good' : queryTime < 1000 ? 'fair' : 'poor'
        }
      })
    } catch (error) {
      console.error('Product.show error:', error)
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
        return response.status(422).json({
          message: 'Part Number sudah ada, silakan gunakan Part Number lain.',
          errors: {
            sku: ['Part Number sudah ada, silakan gunakan Part Number lain.']
          }
        })
      }

      // Proses upload image jika ada file image
      let imagePath: string | null = null

      // Upload file jika ada - ubah cara mengambil file untuk konsistensi dengan customer
      if (payload.image && payload.image instanceof MultipartFile) {
        try {
          // Validasi file tidak kosong
          if (!payload.image.size || payload.image.size === 0) {
            throw new Error('File gambar kosong atau tidak valid')
          }

          // Validasi file adalah image
          const fileType = payload.image.type || ''
          const fileExtension = payload.image.clientName?.split('.').pop()?.toLowerCase() || ''

          const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/x-png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
          ]

          const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

          const isValidMimeType = allowedMimeTypes.includes(fileType)
          const isValidExtension = allowedExtensions.includes(fileExtension)

          if (!isValidMimeType && !isValidExtension) {
            throw new Error(`File harus berupa gambar (JPEG, PNG, GIF, WebP). Detected: MIME=${fileType}, Ext=${fileExtension}`)
          }

          // Validasi file size
          const maxSize = 5 * 1024 * 1024 // 5MB
          if (payload.image.size > maxSize) {
            throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
          }

          const uploadResult = await this.storageService.uploadFile(
            payload.image,
            'products',
            true // public
          )

          imagePath = uploadResult.url

        } catch (err) {
          console.error('Image upload failed:', err)
          return response.internalServerError({
            message: 'Gagal menyimpan file gambar',
            error: err.message,
          })
        }
      }

      // Tambahkan path image ke payload jika ada
      const product = await Product.create({
        ...payload,
        image: imagePath || '',
      })

      return response.created(product)
    } catch (error) {
      // Cek error duplikat SKU
      if (error.code === '23505' && error.detail && error.detail.includes('products_sku_unique')) {
        return response.status(422).json({
          message: 'SKU sudah digunakan, silakan gunakan SKU lain.',
          errors: {
            sku: ['SKU sudah digunakan, silakan gunakan SKU lain.']
          }
        })
      }
      // Handle validation errors specifically
      if (error.messages) {
        return response.status(422).json({
          message: 'Gagal validasi data product',
          errors: error.messages,
        })
      }
      return response.badRequest({
        message: 'Gagal membuat product',
        error: error.message,
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
          return response.status(422).json({
            message: 'SKU sudah digunakan, silakan gunakan SKU lain.',
            errors: {
              sku: ['SKU sudah digunakan, silakan gunakan SKU lain.']
            }
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
        berat     : payload.berat ?? product.berat,
      }

      // Proses upload image jika ada file image baru
      let imagePath = product.image // default: image lama

      // Upload file jika ada - ubah cara mengambil file untuk konsistensi dengan customer
      if (payload.image && payload.image instanceof MultipartFile) {
        try {
          // Validasi file tidak kosong
          if (!payload.image.size || payload.image.size === 0) {
            throw new Error('File gambar kosong atau tidak valid')
          }

          // Validasi file adalah image
          const fileType = payload.image.type || ''
          const fileExtension = payload.image.clientName?.split('.').pop()?.toLowerCase() || ''

          const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/x-png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
          ]

          const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

          const isValidMimeType = allowedMimeTypes.includes(fileType)
          const isValidExtension = allowedExtensions.includes(fileExtension)

          if (!isValidMimeType && !isValidExtension) {
            throw new Error(`File harus berupa gambar (JPEG, PNG, GIF, WebP). Detected: MIME=${fileType}, Ext=${fileExtension}`)
          }

          // Validasi file size
          const maxSize = 5 * 1024 * 1024 // 5MB
          if (payload.image.size > maxSize) {
            throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
          }

          const uploadResult = await this.storageService.uploadFile(
            payload.image,
            'products',
            true // public
          )

          imagePath = uploadResult.url

        } catch (err) {
          console.error('Image upload failed:', err)
          return response.internalServerError({
            message: 'Gagal menyimpan file gambar',
            error: err.message,
          })
        }
      }

      // Gabungkan data update dan imagePath
      product.merge({
        ...dataUpdate,
        image: imagePath || '',
      })

      await product.save()
      return response.ok(product)
    } catch (error) {
      // Cek error duplikat SKU
      if (error.code === '23505' && error.detail && error.detail.includes('products_sku_unique')) {
        return response.status(422).json({
          message: 'SKU sudah digunakan, silakan gunakan SKU lain.',
          errors: {
            sku: ['SKU sudah digunakan, silakan gunakan SKU lain.']
          }
        })
      }
      // Handle validation errors specifically
      if (error.messages) {
        return response.status(422).json({
          message: 'Gagal validasi data product',
          errors: error.messages,
        })
      }
      return response.badRequest({
        message: 'Gagal memperbarui product',
        error: error.message,
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
