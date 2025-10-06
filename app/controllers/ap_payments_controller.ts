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
      
      console.log('🔍 AP Payment Index - Request params:', { page, limit, search, startDate, endDate, vendorId })

      const query = ApPayment.query()
        .preload('vendor')
        .preload('bankAccount')
        .preload('createdByUser', (q) => q.select(['id', 'fullName', 'email']))
        .preload('updatedByUser', (q) => q.select(['id', 'fullName', 'email']))

      if (search) {
        query.where((subQuery) => {
          subQuery
            .whereILike('payment_number', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
        })
      }

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (vendorId) {
        query.where('vendor_id', vendorId)
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
      console.error('❌ AP Payment Index Error:', error)
      console.error('❌ AP Payment Index Error Message:', error.message)
      console.error('❌ AP Payment Index Error Stack:', error.stack)
      
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar pembayaran hutang',
        error: error.message
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
        .preload('createdByUser', (q) => q.select(['id', 'fullName', 'email']))
        .preload('updatedByUser', (q) => q.select(['id', 'fullName', 'email']))
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

  async store({ request, response, auth }: HttpContext) {
    console.log('🔍 AP Payment Store - Starting...')
    console.log('🔍 AP Payment Store - Auth user:', auth?.user?.id)
    console.log('🔍 AP Payment Store - Request body:', request.all())
    
    const trx = await db.transaction()
    
    try {
      console.log('🔍 AP Payment Store - Validating payload...')
      const payload = await createApPaymentValidator.validate(request.all())
      console.log('🔍 AP Payment Store - Validated payload:', payload)
      
      // Gunakan camelCase agar sesuai dengan properti model
      const paymentData = {
        vendorId: payload.vendorId,
        date: payload.date,
        paymentNumber: payload.paymentNumber,
        invoiceId: payload.invoiceId || null,
        bankAccountId: payload.bankAccountId || null,
        description: payload.description || null,
        amount: payload.amount,
        method: payload.method,
        createdBy: auth?.user?.id || null,
        updatedBy: auth?.user?.id || null,
      }
      
      console.log('🔍 AP Payment Store - Payment data to create:', paymentData)
      console.log('🔍 AP Payment Store - Creating payment...')
      
      const payment = await ApPayment.create(paymentData, { client: trx })
      console.log('🔍 AP Payment Store - Payment created successfully:', payment.id)

      await payment.load('vendor')
      
      // Load optional relations only if they exist
      // if (payment.invoiceId) {
      //   await payment.load('purchaseInvoice')
      // }
      if (payment.bankAccountId) {
        await payment.load('bankAccount')
      }
      if (payment.createdBy) {
        await payment.load('createdByUser')
      }
      if (payment.updatedBy) {
        await payment.load('updatedByUser')
      }

      await trx.commit()

      return response.created({
        status: 'success',
        data: payment,
        message: 'Pembayaran hutang berhasil dibuat'
      })
    } catch (error) {
      await trx.rollback()
      
      console.error('❌ AP Payment Store Error:', error)
      console.error('❌ AP Payment Store Error Message:', error.message)
      console.error('❌ AP Payment Store Error Stack:', error.stack)
      console.error('❌ AP Payment Store Error Name:', error.name)
      
      if (error.messages) {
        console.error('❌ AP Payment Store Validation Errors:', error.messages)
        return response.badRequest({
          status: 'error',
          message: 'Validasi gagal',
          errors: error.messages
        })
      }

      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat pembayaran hutang',
        error: error.message,
        details: error.stack
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payment = await ApPayment.findOrFail(params.id)
      const payload = await updateApPaymentValidator.validate(request.all())
      
      // Gunakan camelCase agar sesuai dengan properti model
      const updateData: any = {}
      if (payload.vendorId !== undefined) updateData.vendorId = payload.vendorId
      if (payload.date !== undefined) updateData.date = payload.date
      if (payload.paymentNumber !== undefined) updateData.paymentNumber = payload.paymentNumber
      if (payload.invoiceId !== undefined) updateData.invoiceId = payload.invoiceId || null
      if (payload.bankAccountId !== undefined) updateData.bankAccountId = payload.bankAccountId || null
      if (payload.description !== undefined) updateData.description = payload.description || null
      if (payload.amount !== undefined) updateData.amount = payload.amount
      if (payload.method !== undefined) updateData.method = payload.method
      // set updatedBy dari user yang login
      updateData.updatedBy = auth?.user?.id || null
      
      payment.useTransaction(trx)
      payment.merge(updateData)
      await payment.save()

      await payment.load('vendor')

      if (payment.bankAccountId) {
        await payment.load('bankAccount')
      }
      if (payment.createdBy) {
        await payment.load('createdByUser')
      }
      if (payment.updatedBy) {
        await payment.load('updatedByUser')
      }

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
