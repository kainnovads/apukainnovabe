import { customerValidator } from '#validators/customer'
import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import { MultipartFile } from "@adonisjs/core/bodyparser"
import db from '@adonisjs/lucid/services/db'
import ProductCustomer from '#models/product_customer'
import StorageService from '#services/storage_service'

export default class CustomersController {
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
      const sortField   = request.input('sortField', 'id')
      const sortOrder   = request.input('sortOrder', 'asc')

      // Query customer dengan filter search jika ada
      let dataQuery = Customer.query().orderBy(sortField, sortOrder as 'asc' | 'desc')


      if (searchValue) {
        // Untuk pencarian tidak case sensitive, gunakan LOWER di query
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
            .whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(code) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(address) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(email) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(phone) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(npwp) LIKE ?', [`%${lowerSearch}%`])
        })
      }

      // Gunakan query yang sudah difilter dan di-preload
      const customer = await dataQuery.paginate(page, limit)

      return response.ok(customer.toJSON())
    } catch (error) {

      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data customer',
        error: {
          name: error.name,
          status: error.status || 500,
          code: error.code,
          message: error.message,
        },
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const customer = await Customer.query()
        .where('id', params.id)
        .preload('products', (query) => query.preload('unit').orderBy('product_customers.created_at', 'asc'))
        .first()

      if (!customer) {
        return response.notFound({ message: 'Customer tidak ditemukan' })
      }

      // Serialize customer data and manually construct product data with pivot info
      const customerJSON = customer.serialize()
      const productList = customer.products.map((p) => {
        return {
          id: p.id,
          productId: p.id,
          name: p.name,
          sku: p.sku,
          priceSell: p.$extras.pivot_price_sell,
          unit: p.unit,
        }
      })

      customerJSON.customerProducts = productList

      // Remove the original products array to avoid redundancy
      delete customerJSON.products

      return response.ok({ data: customerJSON })
    } catch (error) {
      console.log(error)
      return response.internalServerError({
        message: 'Gagal mengambil detail customer',
        error: error.message,
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(customerValidator)
    const items = payload.customerProducts || []

    if (!Array.isArray(items) || items.length === 0) {
      return response.badRequest({ message: 'items tidak boleh kosong' })
    }

    // Validasi unik productId
    const productIds = items.map(item => item.productId)
    const uniqueProductIds = [...new Set(productIds)]
    
    if (productIds.length !== uniqueProductIds.length) {
      return response.badRequest({ 
        message: 'Produk yang sama tidak boleh ditambahkan lebih dari sekali',
        errors: {
          customerProducts: ['Produk yang sama tidak boleh dipilih lebih dari sekali']
        }
      })
    }

    let logoPath: string | null = null

    // Upload file jika ada
    if (payload.logo && payload.logo instanceof MultipartFile) {
      try {
        // Validasi file tidak kosong
        if (!payload.logo.size || payload.logo.size === 0) {
          throw new Error('File logo kosong atau tidak valid')
        }

        // Validasi file adalah image
        const fileType = payload.logo.type || ''
        const fileExtension = payload.logo.clientName?.split('.').pop()?.toLowerCase() || ''

        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
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
        if (payload.logo.size > maxSize) {
          throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
        }

        const uploadResult = await this.storageService.uploadFile(
          payload.logo,
          'customers',
          true // public
        )

        logoPath = uploadResult.url

      } catch (err) {
        console.error('Logo upload failed:', err)
        return response.internalServerError({
          message: 'Gagal menyimpan file logo',
          error: err.message,
        })
      }
    }

    const trx = await db.transaction()

    try {
      const customer = await Customer.create({
        name           : payload.name,
        code           : payload.code,
        email          : payload.email,
        phone          : payload.phone,
        address        : payload.address,
        npwp           : payload.npwp,
        logo           : logoPath || undefined,
      })

      for (const item of items) {
        await ProductCustomer.create({
          customerId: customer.id,
          productId: item.productId,
          priceSell: item.priceSell,
        }, { client: trx })
      }

      await trx.commit()

      return response.created({
        message: 'Customer berhasil dibuat',
        data: customer,
      })
    } catch (error) {
      await trx.rollback()
      console.error('Customer Error:', error)
      return response.internalServerError({
        message: 'Gagal membuat Customer',
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(customerValidator)
    const items = payload.customerProducts || []

    const trx = await db.transaction()

    if (!Array.isArray(items) || items.length === 0) {
      await trx.rollback()
      return response.badRequest({ message: 'Items tidak boleh kosong' })
    }

    // Validasi unik productId
    const productIds = items.map(item => item.productId)
    const uniqueProductIds = [...new Set(productIds)]
    
    if (productIds.length !== uniqueProductIds.length) {
      await trx.rollback()
      return response.badRequest({ 
        message: 'Produk yang sama tidak boleh ditambahkan lebih dari sekali',
        errors: {
          customerProducts: ['Produk yang sama tidak boleh dipilih lebih dari sekali']
        }
      })
    }

    try {
      const customer = await Customer.findOrFail(params.id, { client: trx })

      // Handle file upload
      let logoPath = customer.logo

      // Upload file jika ada
      if (payload.logo && payload.logo instanceof MultipartFile) {
        try {
          // Validasi file tidak kosong
          if (!payload.logo.size || payload.logo.size === 0) {
            throw new Error('File logo kosong atau tidak valid')
          }

          // Validasi file adalah image
          const fileType = payload.logo.type || ''
          const fileExtension = payload.logo.clientName?.split('.').pop()?.toLowerCase() || ''

          const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
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
          if (payload.logo.size > maxSize) {
            throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
          }

          const uploadResult = await this.storageService.uploadFile(
            payload.logo,
            'customers',
            true // public
          )

          logoPath = uploadResult.url

        } catch (err) {
          console.error('Logo upload failed:', err)
          return response.internalServerError({
            message: 'Gagal menyimpan file logo',
            error: err.message,
          })
        }
      }

      // Update Customer utama
      const updateData = {
        name: payload.name,
        code: payload.code,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        npwp: payload.npwp || '',
        logo: logoPath || '',
      }
      
      customer.merge(updateData)
      await customer.save()
      
      // Reload data customer untuk memastikan data yang dikembalikan adalah yang terbaru
      await customer.refresh()

      // Hapus item lama lalu insert ulang
      await ProductCustomer.query({ client: trx })
        .where('customer_id', customer.id)
        .delete()

      for (const item of items) {
        await ProductCustomer.create({
          customerId: customer.id,
          productId: item.productId,
          priceSell: item.priceSell,
        }, { client: trx })
      }

      await trx.commit()

      // Reload customer dengan products untuk response yang lengkap
      const updatedCustomer = await Customer.query()
        .where('id', customer.id)
        .preload('products', (query) => query.preload('unit').orderBy('product_customers.created_at', 'asc'))
        .first()

      if (updatedCustomer) {
        // Serialize customer data and manually construct product data with pivot info
        const customerJSON = updatedCustomer.serialize()
        const productList = updatedCustomer.products.map((p) => {
          return {
            id: p.id,
            productId: p.id,
            name: p.name,
            sku: p.sku,
            priceSell: p.$extras.pivot_price_sell,
            unit: p.unit,
          }
        })

        customerJSON.customerProducts = productList
        delete customerJSON.products

        return response.ok({
          message: 'Customer berhasil diperbarui',
          data: customerJSON,
        })
      }

      return response.ok({
        message: 'Customer berhasil diperbarui',
        data: customer,
      })
    } catch (error) {
      await trx.rollback()
      console.error('Customer Update Error:', error)
      return response.internalServerError({ message: 'Gagal memperbarui Customer' })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const customer = await Customer.find(params.id)
      if (!customer) {
        return response.notFound({ message: 'Customer tidak ditemukan' })
      }
      await customer.delete()
      return response.ok({ message: 'Customer berhasil dihapus' })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal menghapus customer',
        error: error.message,
      })
    }
  }
}
