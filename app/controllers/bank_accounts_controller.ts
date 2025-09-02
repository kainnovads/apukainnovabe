import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import BankAccount from '#models/bank_account'
import { createBankAccountValidator, updateBankAccountValidator } from '#validators/bank_account_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class BankAccountsController {
  async index({ response }: HttpContext) {
    try {
      const bankAccounts = await BankAccount.query()
        .preload('createdByUser')
        .preload('updatedByUser')
        .orderBy('createdAt', 'desc')

      return response.ok({
        status: 'success',
        data: bankAccounts,
        message: 'Daftar rekening bank berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar rekening bank'
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
