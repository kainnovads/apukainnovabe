import type { HttpContext } from '@adonisjs/core/http'
import { vendorValidator } from '#validators/vendor'
import Vendor from '#models/vendor'
import StorageService from '#services/storage_service'
import { MultipartFile } from '@adonisjs/core/bodyparser'

export default class VendorsController {
  private storageService: StorageService

  // Constructor
  constructor() {
    this.storageService = new StorageService()
  }

  async index({ request, response }: HttpContext) {
    try {
      const page   = request.input('page', 1)
      const limit  = request.input('rows', 10)
      const search = request.input('search', '')
      const searchValue = search || request.input('search.value', '')

      // Query vendor dengan filter search jika ada
      let dataQuery = Vendor.query()


      if (searchValue) {
        // Untuk pencarian tidak case sensitive, gunakan LOWER di query
        const lowerSearch = searchValue.toLowerCase()
        dataQuery = dataQuery.where((query) => {
          query
            .whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(address) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(email) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(phone) LIKE ?', [`%${lowerSearch}%`])
            .orWhereRaw('LOWER(npwp) LIKE ?', [`%${lowerSearch}%`])
        })
      }

      // Gunakan query yang sudah difilter dan di-preload
      const vendor = await dataQuery.paginate(page, limit)

      return response.ok(vendor.toJSON())
    } catch (error) {

      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data vendor',
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
      const vendor = await Vendor.find(params.id)
      if (!vendor) {
        return response.notFound({ message: 'Vendor tidak ditemukan' })
      }
      return response.ok(vendor)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil detail vendor',
        error: error.message,
      })
    }
  }

    async store({ request, response }: HttpContext) {
    try {
      // Validasi data vendor (kecuali logo)
      const payload = await request.validateUsing(vendorValidator)

      // Proses upload logo jika ada file logo
      let logoPath = null
      const logoFile = request.file('logo')

      if (logoFile && logoFile instanceof MultipartFile) {
        try {
          // Validasi file tidak kosong
          if (!logoFile.size || logoFile.size === 0) {
            throw new Error('File logo kosong atau tidak valid')
          }

          // Validasi file adalah image
          const fileType = logoFile.type || ''
          const fileExtension = logoFile.clientName?.split('.').pop()?.toLowerCase() || ''

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
          if (logoFile.size > maxSize) {
            throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
          }

          const uploadResult = await this.storageService.uploadFile(
            logoFile,
            'vendors',
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

      // Tambahkan path logo ke payload jika ada
      const vendor = await Vendor.create({
        ...payload,
        logo: logoPath || '',
      })

      return response.created(vendor)
    } catch (error) {
      return response.badRequest({
        message: 'Gagal membuat vendor',
        error: error.messages || error.message,
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const vendor = await Vendor.find(params.id)
      if (!vendor) {
        return response.notFound({ message: 'Vendor tidak ditemukan' })
      }

      // Validasi data (kecuali logo)
      const payload = await request.validateUsing(vendorValidator)

      // Proses upload logo jika ada file logo baru
      let logoPath = vendor.logo // default: logo lama
      const logoFile = request.file('logo')

      if (logoFile && logoFile instanceof MultipartFile) {
        try {
          // Validasi file tidak kosong
          if (!logoFile.size || logoFile.size === 0) {
            throw new Error('File logo kosong atau tidak valid')
          }

          // Validasi file adalah image
          const fileType = logoFile.type || ''
          const fileExtension = logoFile.clientName?.split('.').pop()?.toLowerCase() || ''

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
          if (logoFile.size > maxSize) {
            throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
          }

          const uploadResult = await this.storageService.uploadFile(
            logoFile,
            'vendors',
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

      // Gabungkan payload dan logoPath
      vendor.merge({
        ...payload,
        logo: logoPath || '',
      })

      await vendor.save()
      return response.ok(vendor)
    } catch (error) {
      return response.badRequest({
        message: 'Gagal memperbarui vendor',
        error: error.messages || error.message,
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const vendor = await Vendor.find(params.id)
      if (!vendor) {
        return response.notFound({ message: 'Vendor tidak ditemukan' })
      }
      await vendor.delete()
      return response.ok({ message: 'Vendor berhasil dihapus' })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal menghapus vendor',
        error: error.message,
      })
    }
  }
}
