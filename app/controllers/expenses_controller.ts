import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Expense from '#models/expense'
import { createExpenseValidator, updateExpenseValidator } from '#validators/expense_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class ExpensesController {
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search', '')
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const departemenId = request.input('departemenId')

      const query = Expense.query()
        .preload('departemen')
        .preload('bankAccount')
        .preload('createdByUser')
        .preload('updatedByUser')

      if (search) {
        query.where((subQuery) => {
          subQuery
            .whereILike('expenseNumber', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
        })
      }

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (departemenId) {
        query.where('departemenId', departemenId)
      }

      const expenses = await query
        .orderBy('date', 'desc')
        .paginate(page, limit)

      return response.ok({
        status: 'success',
        data: expenses,
        message: 'Daftar pengeluaran berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar pengeluaran'
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const expense = await Expense.query()
        .where('id', params.id)
        .preload('departemen')
        .preload('bankAccount')
        .preload('createdByUser')
        .preload('updatedByUser')
        .firstOrFail()

      return response.ok({
        status: 'success',
        data: expense,
        message: 'Detail pengeluaran berhasil diambil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Pengeluaran tidak ditemukan'
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createExpenseValidator.validate(request.all())
      
      const expense = await Expense.create(payload, { client: trx })

      await expense.load('departemen')
      await expense.load('bankAccount')
      await expense.load('createdByUser')
      await expense.load('updatedByUser')

      await trx.commit()

      return response.created({
        status: 'success',
        data: expense,
        message: 'Pengeluaran berhasil dibuat'
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
        message: 'Terjadi kesalahan saat membuat pengeluaran'
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const expense = await Expense.findOrFail(params.id)
      const payload = await updateExpenseValidator.validate(request.all())
      
      expense.useTransaction(trx)
      expense.merge(payload)
      await expense.save()

      await expense.load('departemen')
      await expense.load('bankAccount')
      await expense.load('createdByUser')
      await expense.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: expense,
        message: 'Pengeluaran berhasil diperbarui'
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
        message: 'Pengeluaran tidak ditemukan'
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const expense = await Expense.findOrFail(params.id)
      expense.useTransaction(trx)
      await expense.delete()

      await trx.commit()

      return response.ok({
        status: 'success',
        message: 'Pengeluaran berhasil dihapus'
      })
    } catch (error) {
      await trx.rollback()
      
      return response.notFound({
        status: 'error',
        message: 'Pengeluaran tidak ditemukan'
      })
    }
  }

  async getSummary({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const departemenId = request.input('departemenId')

      const query = Expense.query()

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (departemenId) {
        query.where('departemenId', departemenId)
      }

      const totalAmount = await query.sum('amount as total')
      const totalCount = await query.count('* as total')

      return response.ok({
        status: 'success',
        data: {
          totalAmount: totalAmount[0].$extras.total || 0,
          totalCount: totalCount[0].$extras.total || 0
        },
        message: 'Ringkasan pengeluaran berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil ringkasan pengeluaran'
      })
    }
  }
}
