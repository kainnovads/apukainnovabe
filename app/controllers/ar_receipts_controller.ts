import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import ArReceipt from '#models/ar_receipt'
import { createArReceiptValidator, updateArReceiptValidator } from '#validators/ar_receipt_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class ArReceiptsController {
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search', '')
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const customerId = request.input('customerId')

      const query = ArReceipt.query()
        .preload('customer')
        .preload('salesInvoice')
        .preload('bankAccount')
        .preload('createdByUser')
        .preload('updatedByUser')

      if (search) {
        query.where((subQuery) => {
          subQuery
            .whereILike('receiptNumber', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
        })
      }

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (customerId) {
        query.where('customerId', customerId)
      }

      const receipts = await query
        .orderBy('date', 'desc')
        .paginate(page, limit)

      return response.ok({
        status: 'success',
        data: receipts,
        message: 'Daftar penerimaan piutang berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar penerimaan piutang'
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const receipt = await ArReceipt.query()
        .where('id', params.id)
        .preload('customer')
        .preload('salesInvoice')
        .preload('bankAccount')
        .preload('createdByUser')
        .preload('updatedByUser')
        .firstOrFail()

      return response.ok({
        status: 'success',
        data: receipt,
        message: 'Detail penerimaan piutang berhasil diambil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Penerimaan piutang tidak ditemukan'
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createArReceiptValidator.validate(request.all())
      
      const receipt = await ArReceipt.create(payload, { client: trx })

      await receipt.load('customer')
      await receipt.load('salesInvoice')
      await receipt.load('bankAccount')
      await receipt.load('createdByUser')
      await receipt.load('updatedByUser')

      await trx.commit()

      return response.created({
        status: 'success',
        data: receipt,
        message: 'Penerimaan piutang berhasil dibuat'
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
        message: 'Terjadi kesalahan saat membuat penerimaan piutang'
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const receipt = await ArReceipt.findOrFail(params.id)
      const payload = await updateArReceiptValidator.validate(request.all())
      
      receipt.useTransaction(trx)
      receipt.merge(payload)
      await receipt.save()

      await receipt.load('customer')
      await receipt.load('salesInvoice')
      await receipt.load('bankAccount')
      await receipt.load('createdByUser')
      await receipt.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: receipt,
        message: 'Penerimaan piutang berhasil diperbarui'
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
        message: 'Penerimaan piutang tidak ditemukan'
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const receipt = await ArReceipt.findOrFail(params.id)
      receipt.useTransaction(trx)
      await receipt.delete()

      await trx.commit()

      return response.ok({
        status: 'success',
        message: 'Penerimaan piutang berhasil dihapus'
      })
    } catch (error) {
      await trx.rollback()
      
      return response.notFound({
        status: 'error',
        message: 'Penerimaan piutang tidak ditemukan'
      })
    }
  }

  async getSummary({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const customerId = request.input('customerId')

      const query = ArReceipt.query()

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (customerId) {
        query.where('customerId', customerId)
      }

      const totalAmount = await query.sum('amount as total')
      const totalCount = await query.count('* as total')

      return response.ok({
        status: 'success',
        data: {
          totalAmount: totalAmount[0].$extras.total || 0,
          totalCount: totalCount[0].$extras.total || 0
        },
        message: 'Ringkasan penerimaan piutang berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil ringkasan penerimaan piutang'
      })
    }
  }
}
