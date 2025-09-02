import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Journal from '#models/journal'
import JournalLine from '#models/journal_line'
import { createJournalValidator, updateJournalValidator, postJournalValidator, cancelJournalValidator } from '#validators/journal_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class JournalsController {
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search', '')
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const status = request.input('status')
      const referenceType = request.input('referenceType')

      const query = Journal.query()
        .preload('journalLines', (query) => {
          query.preload('account')
        })
        .preload('createdByUser')
        .preload('updatedByUser')

      if (search) {
        query.where((subQuery) => {
          subQuery
            .whereILike('journalNumber', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
        })
      }

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (status) {
        query.where('status', status)
      }

      if (referenceType) {
        query.where('referenceType', referenceType)
      }

      const journals = await query
        .orderBy('date', 'desc')
        .orderBy('journalNumber', 'desc')
        .paginate(page, limit)

      return response.ok({
        status: 'success',
        data: journals,
        message: 'Daftar jurnal berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar jurnal'
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const journal = await Journal.query()
        .where('id', params.id)
        .preload('journalLines', (query) => {
          query.preload('account')
        })
        .preload('createdByUser')
        .preload('updatedByUser')
        .firstOrFail()

      return response.ok({
        status: 'success',
        data: journal,
        message: 'Detail jurnal berhasil diambil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Jurnal tidak ditemukan'
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createJournalValidator.validate(request.all())
      
      // Validasi nomor jurnal unik
      const existingJournal = await Journal.query()
        .where('journalNumber', payload.journalNumber)
        .first()
      
      if (existingJournal) {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Nomor jurnal sudah digunakan'
        })
      }

      // Validasi balance (debit = credit)
      const totalDebit = payload.journalLines.reduce((sum, line) => sum + line.debit, 0)
      const totalCredit = payload.journalLines.reduce((sum, line) => sum + line.credit, 0)
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Total debit dan credit harus sama'
        })
      }

      // Validasi setiap line item
      for (const line of payload.journalLines) {
        const account = await db.query()
          .from('accounts')
          .where('id', line.accountId)
          .first()
        
        if (!account) {
          await trx.rollback()
          return response.badRequest({
            status: 'error',
            message: `Akun dengan ID ${line.accountId} tidak ditemukan`
          })
        }

        // Validasi debit atau credit harus salah satu saja
        if (line.debit > 0 && line.credit > 0) {
          await trx.rollback()
          return response.badRequest({
            status: 'error',
            message: 'Setiap line item harus debit atau credit saja, tidak boleh keduanya'
          })
        }
      }

      // Buat journal
      const { journalLines, ...journalData } = payload
      const journal = await Journal.create(journalData, { client: trx })

      // Buat journal lines
      for (const lineData of journalLines) {
        await JournalLine.create({
          ...lineData,
          journalId: journal.id
        }, { client: trx })
      }

      await journal.load('journalLines', (query) => {
        query.preload('account')
      })
      await journal.load('createdByUser')
      await journal.load('updatedByUser')

      await trx.commit()

      return response.created({
        status: 'success',
        data: journal,
        message: 'Jurnal berhasil dibuat'
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
        message: 'Terjadi kesalahan saat membuat jurnal'
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const journal = await Journal.findOrFail(params.id)
      const payload = await updateJournalValidator.validate(request.all())
      
      // Validasi status - tidak bisa edit jika sudah posted
      if (journal.status === 'posted') {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Tidak dapat mengedit jurnal yang sudah diposting'
        })
      }

      // Validasi nomor jurnal unik jika diupdate
      if (payload.journalNumber && payload.journalNumber !== journal.journalNumber) {
        const existingJournal = await Journal.query()
          .where('journalNumber', payload.journalNumber)
          .whereNot('id', params.id)
          .first()
        
        if (existingJournal) {
          await trx.rollback()
          return response.badRequest({
            status: 'error',
            message: 'Nomor jurnal sudah digunakan'
          })
        }
      }

      // Update journal lines jika ada
      if (payload.journalLines) {
        // Validasi balance
        const totalDebit = payload.journalLines.reduce((sum, line) => sum + line.debit, 0)
        const totalCredit = payload.journalLines.reduce((sum, line) => sum + line.credit, 0)
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          await trx.rollback()
          return response.badRequest({
            status: 'error',
            message: 'Total debit dan credit harus sama'
          })
        }

        // Validasi setiap line item
        for (const line of payload.journalLines) {
          const account = await db.query()
            .from('accounts')
            .where('id', line.accountId)
            .first()
          
          if (!account) {
            await trx.rollback()
            return response.badRequest({
              status: 'error',
              message: `Akun dengan ID ${line.accountId} tidak ditemukan`
            })
          }

          if (line.debit > 0 && line.credit > 0) {
            await trx.rollback()
            return response.badRequest({
              status: 'error',
              message: 'Setiap line item harus debit atau credit saja, tidak boleh keduanya'
            })
          }
        }

        // Hapus journal lines lama
        await JournalLine.query()
          .where('journalId', params.id)
          .delete()

        // Buat journal lines baru
        for (const lineData of payload.journalLines) {
          await JournalLine.create({
            ...lineData,
            journalId: journal.id
          }, { client: trx })
        }
      }

      // Update journal
      const { journalLines, ...journalData } = payload
      journal.useTransaction(trx)
      journal.merge(journalData)
      await journal.save()

      await journal.load('journalLines', (query) => {
        query.preload('account')
      })
      await journal.load('createdByUser')
      await journal.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: journal,
        message: 'Jurnal berhasil diperbarui'
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
        message: 'Jurnal tidak ditemukan'
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const journal = await Journal.findOrFail(params.id)

      // Validasi status - tidak bisa hapus jika sudah posted
      if (journal.status === 'posted') {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Tidak dapat menghapus jurnal yang sudah diposting'
        })
      }

      journal.useTransaction(trx)
      await journal.delete()

      await trx.commit()

      return response.ok({
        status: 'success',
        message: 'Jurnal berhasil dihapus'
      })
    } catch (error) {
      await trx.rollback()
      
      return response.notFound({
        status: 'error',
        message: 'Jurnal tidak ditemukan'
      })
    }
  }

  async post({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const journal = await Journal.findOrFail(params.id)
      const payload = await postJournalValidator.validate(request.all())

      // Validasi status
      if (journal.status !== 'draft') {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Hanya jurnal draft yang dapat diposting'
        })
      }

      // Update status menjadi posted
      journal.useTransaction(trx)
      journal.status = 'posted'
      journal.updatedBy = payload.updatedBy
      await journal.save()

      await journal.load('journalLines', (query) => {
        query.preload('account')
      })
      await journal.load('createdByUser')
      await journal.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: journal,
        message: 'Jurnal berhasil diposting'
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
        message: 'Jurnal tidak ditemukan'
      })
    }
  }

  async cancel({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const journal = await Journal.findOrFail(params.id)
      const payload = await cancelJournalValidator.validate(request.all())

      // Validasi status
      if (journal.status === 'cancelled') {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Jurnal sudah dibatalkan'
        })
      }

      // Update status menjadi cancelled
      journal.useTransaction(trx)
      journal.status = 'cancelled'
      journal.updatedBy = payload.updatedBy
      await journal.save()

      await journal.load('journalLines', (query) => {
        query.preload('account')
      })
      await journal.load('createdByUser')
      await journal.load('updatedByUser')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: journal,
        message: 'Jurnal berhasil dibatalkan'
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
        message: 'Jurnal tidak ditemukan'
      })
    }
  }

  async getSummary({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')
      const status = request.input('status')

      const query = Journal.query()

      if (startDate && endDate) {
        query.whereBetween('date', [startDate, endDate])
      }

      if (status) {
        query.where('status', status)
      }

      const totalJournals = await query.count('* as total')
      const draftJournals = await Journal.query().where('status', 'draft').count('* as total')
      const postedJournals = await Journal.query().where('status', 'posted').count('* as total')
      const cancelledJournals = await Journal.query().where('status', 'cancelled').count('* as total')

      return response.ok({
        status: 'success',
        data: {
          totalJournals: totalJournals[0].$extras.total || 0,
          draftJournals: draftJournals[0].$extras.total || 0,
          postedJournals: postedJournals[0].$extras.total || 0,
          cancelledJournals: cancelledJournals[0].$extras.total || 0
        },
        message: 'Ringkasan jurnal berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil ringkasan jurnal'
      })
    }
  }

  async getTrialBalance({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')

      if (!startDate || !endDate) {
        return response.badRequest({
          status: 'error',
          message: 'Tanggal awal dan akhir diperlukan'
        })
      }

      // Ambil trial balance dari journal lines yang sudah posted
      const trialBalance = await db.query()
        .select(
          'accounts.id',
          'accounts.code',
          'accounts.name',
          'accounts.category',
          'accounts.normal_balance'
        )
        .sum('journal_lines.debit as total_debit')
        .sum('journal_lines.credit as total_credit')
        .from('accounts')
        .leftJoin('journal_lines', 'accounts.id', 'journal_lines.account_id')
        .leftJoin('journals', 'journal_lines.journal_id', 'journals.id')
        .where('journals.status', 'posted')
        .whereBetween('journals.date', [startDate, endDate])
        .orWhereNull('journals.id') // Include accounts with no transactions
        .groupBy('accounts.id', 'accounts.code', 'accounts.name', 'accounts.category', 'accounts.normal_balance')
        .orderBy('accounts.code', 'asc')

      return response.ok({
        status: 'success',
        data: {
          period: { startDate, endDate },
          trialBalance
        },
        message: 'Trial balance berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil trial balance'
      })
    }
  }

  async generateJournalNumber({ response }: HttpContext) {
    try {
      // Generate journal number dengan format: JRN-YYYYMMDD-XXX
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
      
      // Ambil nomor terakhir hari ini
      const lastJournal = await Journal.query()
        .where('journalNumber', 'like', `JRN-${dateStr}-%`)
        .orderBy('journalNumber', 'desc')
        .first()

      let sequence = 1
      if (lastJournal) {
        const lastSequence = parseInt(lastJournal.journalNumber.split('-')[2])
        sequence = lastSequence + 1
      }

      const journalNumber = `JRN-${dateStr}-${sequence.toString().padStart(3, '0')}`

      return response.ok({
        status: 'success',
        data: { journalNumber },
        message: 'Nomor jurnal berhasil digenerate'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat generate nomor jurnal'
      })
    }
  }
}
