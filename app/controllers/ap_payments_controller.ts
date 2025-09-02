import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import ApPayment from '#models/ap_payment'
import { createApPaymentValidator, updateApPaymentValidator } from '#validators/ap_payment_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class ApPaymentsController {
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search', '')
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const vendorId = request.input('vendorId')

      const query = ApPayment.query()
        .preload('vendor')
        .preload('purchaseInvoice')
        .preload('bankAccount')
        .preload('createdByUser')
        .preload('updatedByUser')

      if (search) {
        query.where((subQuery) => {
          subQuery
            .whereILike('paymentNumber', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
        })
      }

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (vendorId) {
        query.where('vendorId', vendorId)
      }

      const payments = await query
        .orderBy('date', 'desc')
        .paginate(page, limit)

      return response.ok({
        status: 'success',
        data: payments,
        message: 'Daftar pembayaran hutang berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar pembayaran hutang'
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const payment = await ApPayment.query()
        .where('id', params.id)
        .preload('vendor')
        .preload('purchaseInvoice')
        .preload('bankAccount')
        .preload('createdByUser')
        .preload('updatedByUser')
        .firstOrFail()

      return response.ok({
        status: 'success',
        data: payment,
        message: 'Detail pembayaran hutang berhasil diambil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Pembayaran hutang tidak ditemukan'
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createApPaymentValidator.validate(request.all())
      
      const payment = await ApPayment.create(payload, { client: trx })

      await payment.load('vendor')
      await payment.load('purchaseInvoice')
      await payment.load('bankAccount')
      await payment.load('createdByUser')
      await payment.load('updatedByUser')

      await trx.commit()

      return response.created({
        status: 'success',
        data: payment,
        message: 'Pembayaran hutang berhasil dibuat'
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
        message: 'Terjadi kesalahan saat membuat pembayaran hutang'
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payment = await ApPayment.findOrFail(params.id)
      const payload = await updateApPaymentValidator.validate(request.all())
      
      payment.useTransaction(trx)
      payment.merge(payload)
      await payment.save()

      await payment.load('vendor')
      await payment.load('purchaseInvoice')
      await payment.load('bankAccount')
      await payment.load('createdByUser')
      await payment.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: payment,
        message: 'Pembayaran hutang berhasil diperbarui'
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
        message: 'Pembayaran hutang tidak ditemukan'
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payment = await ApPayment.findOrFail(params.id)
      payment.useTransaction(trx)
      await payment.delete()

      await trx.commit()

      return response.ok({
        status: 'success',
        message: 'Pembayaran hutang berhasil dihapus'
      })
    } catch (error) {
      await trx.rollback()
      
      return response.notFound({
        status: 'error',
        message: 'Pembayaran hutang tidak ditemukan'
      })
    }
  }

  async getSummary({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const vendorId = request.input('vendorId')

      const query = ApPayment.query()

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (vendorId) {
        query.where('vendorId', vendorId)
      }

      const totalAmount = await query.sum('amount as total')
      const totalCount = await query.count('* as total')

      return response.ok({
        status: 'success',
        data: {
          totalAmount: totalAmount[0].$extras.total || 0,
          totalCount: totalCount[0].$extras.total || 0
        },
        message: 'Ringkasan pembayaran hutang berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil ringkasan pembayaran hutang'
      })
    }
  }
}
