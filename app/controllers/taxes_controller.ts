import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Tax from '#models/tax'
import { createTaxValidator, updateTaxValidator } from '#validators/tax_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class TaxesController {
  async index({ response }: HttpContext) {
    try {
      console.log('Fetching taxes...')
      
      const taxes = await Tax.query()
        .preload('createdByUser')
        .preload('updatedByUser')
        .orderBy('createdAt', 'desc')

      console.log('Taxes fetched successfully:', taxes.length)
      console.log('First tax sample:', taxes[0] ? {
        id: taxes[0].id,
        name: taxes[0].name,
        createdBy: taxes[0].createdBy,
        createdByUser: taxes[0].createdByUser
      } : 'No taxes found')

      return response.ok({
        status: 'success',
        data: taxes,
        message: 'Daftar pajak berhasil diambil'
      })
    } catch (error) {
      // Log error untuk debugging
      console.error('Error in TaxesController.index:', error)
      console.error('Error stack:', error.stack)
      console.error('Error message:', error.message)
      
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar pajak',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

  async store({ request, response, auth }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createTaxValidator.validate(request.all())
      
      // Tambahkan user ID untuk createdBy dan updatedBy
      const taxData: any = {
        ...payload,
        createdBy: auth?.user?.id || null,
        updatedBy: auth?.user?.id || null
      }
      
      const tax = await Tax.create(taxData, { client: trx })

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
      
      // Log error untuk debugging
      console.error('Error in TaxesController.store:', error)
      console.error('Error stack:', error.stack)
      
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

  async update({ params, request, response, auth }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      // Debug: log params dan auth
      console.log('Update tax params:', params)
      console.log('Update tax auth user:', auth?.user?.id)
      
      const tax = await Tax.findOrFail(params.id)
      console.log('Found tax:', tax.id, tax.name)
      
      const payload = await updateTaxValidator.validate(request.all())
      console.log('Update payload:', payload)
      
      // Tambahkan updatedBy
      const updateData: any = { ...payload }
      updateData.updatedBy = auth?.user?.id || null
      
      console.log('Final update data:', updateData)
      
      tax.useTransaction(trx)
      tax.merge(updateData)
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
      
      // Log error untuk debugging
      console.error('Error in TaxesController.update:', error)
      console.error('Error stack:', error.stack)
      
      if (error.messages) {
        return response.badRequest({
          status: 'error',
          message: 'Validasi gagal',
          errors: error.messages
        })
      }

      // Check if it's a "not found" error
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          status: 'error',
          message: 'Pajak tidak ditemukan'
        })
      }

      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat memperbarui pajak'
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
