import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Asset from '#models/asset'
import { createAssetValidator, updateAssetValidator } from '#validators/asset_validator'
import db from '@adonisjs/lucid/services/db'
import Perusahaan from '#models/perusahaan'

@inject()
export default class AssetsController {
  async index({ request, response }: HttpContext) {
    try {
      const pageRaw = request.input('page', 1)
      const limitRaw = request.input('limit', request.input('rows', 10))
      const page = Number.isFinite(Number(pageRaw)) ? Number(pageRaw) : 1
      const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 10
      const search = String(request.input('search', '') || '')
      const category = request.input('category')
      const statusRaw = request.input('status')
      const sortFieldRaw = request.input('sortField', 'createdAt')
      const sortOrderRaw = String(request.input('sortOrder', 'desc') || 'desc')

      const allowedSortFields = new Set([
        'assetCode',
        'name',
        'category',
        'acquisitionDate',
        'acquisitionCost',
        'location',
        'createdAt',
      ])
      const sortField = allowedSortFields.has(String(sortFieldRaw))
        ? String(sortFieldRaw)
        : 'createdAt'
      const sortOrder = sortOrderRaw.toLowerCase() === 'asc' ? 'asc' : 'desc'

      // Hapus semua console.log

      const query = Asset.query().select([
        'id',
        'assetCode',
        'name',
        'category',
        'acquisitionDate',
        'acquisitionCost',
        'usefulLife',
        'depreciationMethod',
        'residualValue',
        'location',
        'description',
        'serialNumber',
        'warrantyExpiry',
        'status',
        'perusahaanId',
        'vendorId',
        'cabangId',
        'createdAt',
        'updatedAt',
      ])

      if (search) {
        query.where((subQuery) => {
          subQuery
            .whereRaw('LOWER(assetCode) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(name) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(category) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(location) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(cabangId) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(vendorId) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(perusahaanId) LIKE ?', [`%${search.toLowerCase()}%`])
        })
      }

      if (category) {
        query.where('category', category)
      }

      if (statusRaw !== undefined && statusRaw !== '') {
        const status = String(statusRaw)
        query.where('status', status)
      }

      const paginator = await query
        .orderBy(sortField as any, sortOrder as any)
        .paginate(page, limit)

      const serialized = paginator.toJSON() as any
      const metaSrc = serialized?.meta || {}

      const meta = {
        total: metaSrc.total ?? (metaSrc.total || 0),
        per_page: metaSrc.per_page ?? (metaSrc.per_page || limit),
        current_page: metaSrc.current_page ?? (metaSrc.current_page || page),
        last_page: metaSrc.last_page ?? (metaSrc.last_page || 1),
        from: metaSrc.from ?? (metaSrc.from || 0),
        to: metaSrc.to ?? (metaSrc.to || 0),
      }

      return response.ok({
        status: 'success',
        data: serialized.data || [],
        meta,
        message: 'Daftar aset berhasil diambil',
      })
    } catch (error) {
      console.error('Error in AssetsController.index:', error)
      console.error('Error stack:', error.stack)
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar aset',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const asset = await Asset.query()
        .where('id', params.id)
        .preload('createdByUser')
        .preload('updatedByUser')
        .firstOrFail()

      return response.ok({
        status: 'success',
        data: asset,
        message: 'Detail aset berhasil diambil',
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Aset tidak ditemukan',
      })
    }
  }

  async store({ request, response, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const payload = await createAssetValidator.validate(request.all())

      // Ambil nmPerusahaan untuk format kode
      let perusahaanName = 'KNV'
      if (payload.perusahaanId) {
        const perusahaan = await Perusahaan.find(payload.perusahaanId)
        if (perusahaan?.nmPerusahaan) {
          const words = perusahaan.nmPerusahaan.trim().split(/\s+/).filter(Boolean)
          let abbrev = words
            .map((w) => w[0])
            .join('')
            .toUpperCase()
          if (abbrev.length < 3) {
            const compact = perusahaan.nmPerusahaan.replace(/\s+/g, '')
            abbrev = compact.slice(0, 3).toUpperCase()
          }
          perusahaanName = abbrev.slice(0, 3)
        }
      }

      // Generate kode bila tidak disediakan
      let assetCode = payload.assetCode
      if (!assetCode || assetCode.trim() === '') {
        const prefix = `AST-${perusahaanName}-`
        const last = await Asset.query()
          .where('perusahaanId', payload.perusahaanId)
          .andWhere('assetCode', 'like', `${prefix}%`)
          .orderBy('assetCode', 'desc')
          .limit(1)

        let nextNumber = 1
        if (last.length > 0) {
          const lastCode = last[0].assetCode
          const match = lastCode?.match(/(\d+)$/)
          if (match) nextNumber = Number(match[1]) + 1
        }
        assetCode = `${prefix}${String(nextNumber).padStart(4, '0')}`
      }

      // Map status dan tambahkan user ID
      const assetData: any = {
        ...payload,
        assetCode,
        status: payload.status,
        createdBy: auth?.user?.id || null,
        updatedBy: auth?.user?.id || null,
      }

      const asset = await Asset.create(assetData, { client: trx })

      await asset.load('createdByUser')
      await asset.load('updatedByUser')

      await trx.commit()

      return response.created({
        status: 'success',
        data: asset,
        message: 'Aset berhasil dibuat',
      })
    } catch (error) {
      await trx.rollback()

      // Log error untuk debugging
      console.error('Error in AssetsController.store:', error)
      console.error('Error stack:', error.stack)

      if (error.messages) {
        return response.badRequest({
          status: 'error',
          message: 'Validasi gagal',
          errors: error.messages,
        })
      }

      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat aset',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const asset = await Asset.findOrFail(params.id)
      const payload = await updateAssetValidator.validate(request.all())

      // Siapkan data update tanpa memodifikasi payload validasi secara langsung
      const updateData: any = { ...payload }
      // Status sudah ada di payload, tidak perlu assignment ulang

      // Tambahkan updatedBy
      updateData.updatedBy = auth?.user?.id || null

      asset.useTransaction(trx)
      asset.merge(updateData)
      await asset.save()

      await asset.load('createdByUser')
      await asset.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: asset,
        message: 'Aset berhasil diperbarui',
      })
    } catch (error) {
      await trx.rollback()

      // Log error untuk debugging
      console.error('Error in AssetsController.update:', error)
      console.error('Error stack:', error.stack)

      if (error.messages) {
        return response.badRequest({
          status: 'error',
          message: 'Validasi gagal',
          errors: error.messages,
        })
      }

      return response.notFound({
        status: 'error',
        message: 'Aset tidak ditemukan',
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const asset = await Asset.findOrFail(params.id)
      asset.useTransaction(trx)
      await asset.delete()

      await trx.commit()

      return response.ok({
        status: 'success',
        message: 'Aset berhasil dihapus',
      })
    } catch (error) {
      await trx.rollback()

      return response.notFound({
        status: 'error',
        message: 'Aset tidak ditemukan',
      })
    }
  }

  async getCategories({ response }: HttpContext) {
    try {
      const categories = await Asset.query()
        .distinct('category')
        .whereNotNull('category')
        .orderBy('category', 'asc')

      const categoryList = categories.map((item) => item.category)

      return response.ok({
        status: 'success',
        data: categoryList,
        message: 'Daftar kategori aset berhasil diambil',
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar kategori aset',
      })
    }
  }

  async getSummary({ response }: HttpContext) {
    try {
      const totalAssets = await Asset.query().count('* as total')
      const activeAssets = await Asset.query().where('status', 'active').count('* as total')
      const totalValue = await Asset.query().sum('acquisitionCost as total')

      return response.ok({
        status: 'success',
        data: {
          totalAssets: totalAssets[0].$extras.total || 0,
          activeAssets: activeAssets[0].$extras.total || 0,
          totalValue: totalValue[0].$extras.total || 0,
        },
        message: 'Ringkasan aset berhasil diambil',
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil ringkasan aset',
      })
    }
  }

  async calculateDepreciation({ params, response }: HttpContext) {
    try {
      const asset = await Asset.findOrFail(params.id)

      // Hitung depresiasi berdasarkan metode yang dipilih
      let depreciationAmount = 0
      const monthsElapsed = this.calculateMonthsElapsed(asset.acquisitionDate)

      if (asset.depreciationMethod === 'straight_line') {
        const annualDepreciation = (asset.acquisitionCost - asset.residualValue) / asset.usefulLife
        depreciationAmount = (annualDepreciation / 12) * monthsElapsed
      } else if (asset.depreciationMethod === 'declining_balance') {
        const rate = 2 / asset.usefulLife // Double declining balance
        let bookValue = asset.acquisitionCost
        for (let i = 0; i < monthsElapsed; i++) {
          const monthlyDepreciation = bookValue * (rate / 12)
          bookValue -= monthlyDepreciation
          depreciationAmount += monthlyDepreciation
        }
      }

      return response.ok({
        status: 'success',
        data: {
          asset,
          depreciationAmount: Math.min(
            depreciationAmount,
            asset.acquisitionCost - asset.residualValue
          ),
          monthsElapsed,
          bookValue: asset.acquisitionCost - depreciationAmount,
        },
        message: 'Perhitungan depresiasi berhasil',
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Aset tidak ditemukan',
      })
    }
  }

  private calculateMonthsElapsed(acquisitionDate: Date): number {
    const now = new Date()
    const acquisition = new Date(acquisitionDate)
    const diffTime = Math.abs(now.getTime() - acquisition.getTime())
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
    return Math.max(0, diffMonths)
  }
}
