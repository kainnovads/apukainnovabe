import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Asset from '#models/asset'
import { createAssetValidator, updateAssetValidator } from '#validators/asset_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class AssetsController {
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search', '')
      const category = request.input('category')
      const isActive = request.input('isActive')

      const query = Asset.query()
        .preload('createdByUser')
        .preload('updatedByUser')

      if (search) {
        query.where((subQuery) => {
          subQuery
            .whereILike('assetCode', `%${search}%`)
            .orWhereILike('name', `%${search}%`)
        })
      }

      if (category) {
        query.where('category', category)
      }

      if (isActive !== undefined) {
        query.where('isActive', isActive)
      }

      const assets = await query
        .orderBy('createdAt', 'desc')
        .paginate(page, limit)

      return response.ok({
        status: 'success',
        data: assets,
        message: 'Daftar aset berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar aset'
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
        message: 'Detail aset berhasil diambil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Aset tidak ditemukan'
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createAssetValidator.validate(request.all())
      
      const asset = await Asset.create(payload, { client: trx })

      await asset.load('createdByUser')
      await asset.load('updatedByUser')

      await trx.commit()

      return response.created({
        status: 'success',
        data: asset,
        message: 'Aset berhasil dibuat'
      })
    } catch (error) {
      await trx.rollback()
      
      if (error.messages) {
        return response.badRequest({
          status: 'error',
          message: 'Validasi gagal',
          errors: error.messages
        })
      }

      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat aset'
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const asset = await Asset.findOrFail(params.id)
      const payload = await updateAssetValidator.validate(request.all())
      
      asset.useTransaction(trx)
      asset.merge(payload)
      await asset.save()

      await asset.load('createdByUser')
      await asset.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: asset,
        message: 'Aset berhasil diperbarui'
      })
    } catch (error) {
      await trx.rollback()
      
      if (error.messages) {
        return response.badRequest({
          status: 'error',
          message: 'Validasi gagal',
          errors: error.messages
        })
      }

      return response.notFound({
        status: 'error',
        message: 'Aset tidak ditemukan'
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
        message: 'Aset berhasil dihapus'
      })
    } catch (error) {
      await trx.rollback()
      
      return response.notFound({
        status: 'error',
        message: 'Aset tidak ditemukan'
      })
    }
  }

  async getCategories({ response }: HttpContext) {
    try {
      const categories = await Asset.query()
        .distinct('category')
        .whereNotNull('category')
        .orderBy('category', 'asc')

      const categoryList = categories.map(item => item.category)

      return response.ok({
        status: 'success',
        data: categoryList,
        message: 'Daftar kategori aset berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar kategori aset'
      })
    }
  }

  async getSummary({ response }: HttpContext) {
    try {
      const totalAssets = await Asset.query().count('* as total')
      const activeAssets = await Asset.query().where('isActive', true).count('* as total')
      const totalValue = await Asset.query().sum('acquisitionCost as total')

      return response.ok({
        status: 'success',
        data: {
          totalAssets: totalAssets[0].$extras.total || 0,
          activeAssets: activeAssets[0].$extras.total || 0,
          totalValue: totalValue[0].$extras.total || 0
        },
        message: 'Ringkasan aset berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil ringkasan aset'
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
          depreciationAmount: Math.min(depreciationAmount, asset.acquisitionCost - asset.residualValue),
          monthsElapsed,
          bookValue: asset.acquisitionCost - depreciationAmount
        },
        message: 'Perhitungan depresiasi berhasil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Aset tidak ditemukan'
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
