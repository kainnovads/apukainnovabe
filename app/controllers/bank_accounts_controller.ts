import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import BankAccount from '#models/bank_account'
import { createBankAccountValidator, updateBankAccountValidator } from '#validators/bank_account_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class BankAccountsController {
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const rows = request.input('rows', 10)
      const sortField = request.input('sortField', 'created_at')
      const sortOrder = request.input('sortOrder', 'desc')
      const search = request.input('search', '')

      let query = BankAccount.query()
        // .preload('createdByUser')
        // .preload('updatedByUser')

      // Apply search if provided
      if (search) {
        query = query.where((builder) => {
          builder
            .where('account_name', 'like', `%${search}%`)
            .orWhere('account_number', 'like', `%${search}%`)
            .orWhere('bank_name', 'like', `%${search}%`)
        })
      }

      // Get total count for pagination
      const total = await query.clone().count('* as count').first()
      const totalCount = total?.$extras.count || 0

      // Apply sorting and pagination
      query = query
        .orderBy(sortField, sortOrder === 'asc' ? 'asc' : 'desc')
        .offset((page - 1) * rows)
        .limit(rows)

      const bankAccounts = await query

      return response.ok({
        data: bankAccounts,
        meta: {
          total: totalCount,
          page: parseInt(page),
          rows: parseInt(rows),
          lastPage: Math.ceil(totalCount / rows)
        }
      })
    } catch (error) {
      console.error('Error in bank accounts controller:', error)
      return response.internalServerError({
        status: 'error',
        message: `Terjadi kesalahan saat mengambil daftar rekening bank: ${error.message}`,
        error: error.message
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const bankAccount = await BankAccount.query()
        .where('id', params.id)
        .preload('createdByUser')
        .preload('updatedByUser')
        .firstOrFail()

      return response.ok({
        status: 'success',
        data: bankAccount,
        message: 'Detail rekening bank berhasil diambil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Rekening bank tidak ditemukan'
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createBankAccountValidator.validate(request.all())
      
      const bankAccount = await BankAccount.create(payload, { client: trx })

      await bankAccount.load('createdByUser')
      await bankAccount.load('updatedByUser')

      await trx.commit()

      return response.created({
        status: 'success',
        data: bankAccount,
        message: 'Rekening bank berhasil dibuat'
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
        message: 'Terjadi kesalahan saat membuat rekening bank'
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const bankAccount = await BankAccount.findOrFail(params.id)
      const payload = await updateBankAccountValidator.validate(request.all())
      
      bankAccount.useTransaction(trx)
      bankAccount.merge(payload)
      await bankAccount.save()

      await bankAccount.load('createdByUser')
      await bankAccount.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: bankAccount,
        message: 'Rekening bank berhasil diperbarui'
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
        message: 'Rekening bank tidak ditemukan'
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const bankAccount = await BankAccount.findOrFail(params.id)
      bankAccount.useTransaction(trx)
      await bankAccount.delete()

      await trx.commit()

      return response.ok({
        status: 'success',
        message: 'Rekening bank berhasil dihapus'
      })
    } catch (error) {
      await trx.rollback()
      
      return response.notFound({
        status: 'error',
        message: 'Rekening bank tidak ditemukan'
      })
    }
  }
}
