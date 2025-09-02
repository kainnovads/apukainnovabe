import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Tax from '#models/tax'
import { createTaxValidator, updateTaxValidator } from '#validators/tax_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class TaxesController {
  async index({ response }: HttpContext) {
    try {
      const taxes = await Tax.query()
        .preload('createdByUser')
        .preload('updatedByUser')
        .orderBy('createdAt', 'desc')

      return response.ok({
        status: 'success',
        data: taxes,
        message: 'Daftar pajak berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar pajak'
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const tax = await Tax.query()
        .where('id', params.id)
        .preload('createdByUser')
        .preload('updatedByUser')
        .firstOrFail()

      return response.ok({
        status: 'success',
        data: tax,
        message: 'Detail pajak berhasil diambil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Pajak tidak ditemukan'
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createTaxValidator.validate(request.all())
      
      const tax = await Tax.create(payload, { client: trx })

      await tax.load('createdByUser')
      await tax.load('updatedByUser')

      await trx.commit()

      return response.created({
        status: 'success',
        data: tax,
        message: 'Pajak berhasil dibuat'
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
        message: 'Terjadi kesalahan saat membuat pajak'
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const tax = await Tax.findOrFail(params.id)
      const payload = await updateTaxValidator.validate(request.all())
      
      tax.useTransaction(trx)
      tax.merge(payload)
      await tax.save()

      await tax.load('createdByUser')
      await tax.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: tax,
        message: 'Pajak berhasil diperbarui'
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
        message: 'Pajak tidak ditemukan'
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const tax = await Tax.findOrFail(params.id)
      tax.useTransaction(trx)
      await tax.delete()

      await trx.commit()

      return response.ok({
        status: 'success',
        message: 'Pajak berhasil dihapus'
      })
    } catch (error) {
      await trx.rollback()
      
      return response.notFound({
        status: 'error',
        message: 'Pajak tidak ditemukan'
      })
    }
  }

  async getActive({ response }: HttpContext) {
    try {
      const taxes = await Tax.query()
        .where('isActive', true)
        .orderBy('name', 'asc')

      return response.ok({
        status: 'success',
        data: taxes,
        message: 'Daftar pajak aktif berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar pajak aktif'
      })
    }
  }
}
