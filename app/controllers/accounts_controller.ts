import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Account from '#models/account'
import { createAccountValidator, updateAccountValidator } from '#validators/account_validator'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class AccountsController {
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('rows', 10)
      const search = request.input('search', '')
      const category = request.input('category')
      const level = request.input('level')
      const isParent = request.input('isParent')
      const sortField = request.input('sortField', 'code')
      const sortOrder = request.input('sortOrder', 'asc')

      const query = Account.query()
        .preload('parent')
        .preload('children')

      if (search) {
        query.where((subQuery) => {
          subQuery
            .whereILike('code', `%${search}%`)
            .orWhereILike('name', `%${search}%`)
        })
      }

      if (category) {
        query.where('category', category)
      }

      if (level) {
        query.where('level', level)
      }

      if (isParent !== undefined) {
        query.where('is_parent', isParent)
      }

      const accounts = await query
        .orderBy(sortField, sortOrder)
        .paginate(page, limit)

      return response.ok({
        status: 'success',
        data: {
          data: accounts.all(),
          meta: {
            total: accounts.total,
            per_page: accounts.perPage,
            current_page: accounts.currentPage,
            last_page: accounts.lastPage,
            from: accounts.firstPage,
            to: accounts.lastPage
          }
        },
        message: 'Daftar akun berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar akun'
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const account = await Account.query()
        .where('id', params.id)
        .preload('parent')
        .preload('children')
        .preload('journalLines')
        .firstOrFail()

      return response.ok({
        status: 'success',
        data: account,
        message: 'Detail akun berhasil diambil'
      })
    } catch (error) {
      return response.notFound({
        status: 'error',
        message: 'Akun tidak ditemukan'
      })
    }
  }

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const payload = await createAccountValidator.validate(request.all())
      
      // Validasi kode akun unik
      const existingAccount = await Account.query()
        .where('code', payload.code)
        .first()
      
      if (existingAccount) {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Kode akun sudah digunakan'
        })
      }

      // Jika ada parent, validasi parent exists
      if (payload.parentId) {
        const parentAccount = await Account.query()
          .where('id', payload.parentId)
          .first()
        
        if (!parentAccount) {
          await trx.rollback()
          return response.badRequest({
            status: 'error',
            message: 'Akun parent tidak ditemukan'
          })
        }
      }

      const account = await Account.create(payload, { client: trx })

      await account.load('parent')
      await account.load('children')

      await trx.commit()

      return response.created({
        status: 'success',
        data: account,
        message: 'Akun berhasil dibuat'
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
        message: 'Terjadi kesalahan saat membuat akun'
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const account = await Account.findOrFail(params.id)
      const payload = await updateAccountValidator.validate(request.all())
      
      // Validasi kode akun unik jika diupdate
      if (payload.code && payload.code !== account.code) {
        const existingAccount = await Account.query()
          .where('code', payload.code)
          .whereNot('id', params.id)
          .first()
        
        if (existingAccount) {
          await trx.rollback()
          return response.badRequest({
            status: 'error',
            message: 'Kode akun sudah digunakan'
          })
        }
      }

      // Jika ada parent, validasi parent exists dan bukan diri sendiri
      if (payload.parentId) {
        if (payload.parentId === params.id) {
          await trx.rollback()
          return response.badRequest({
            status: 'error',
            message: 'Akun tidak bisa menjadi parent dari dirinya sendiri'
          })
        }

        const parentAccount = await Account.query()
          .where('id', payload.parentId)
          .first()
        
        if (!parentAccount) {
          await trx.rollback()
          return response.badRequest({
            status: 'error',
            message: 'Akun parent tidak ditemukan'
          })
        }
      }

      account.useTransaction(trx)
      account.merge(payload)
      await account.save()

      await account.load('parent')
      await account.load('children')

      await trx.commit()

      return response.ok({
        status: 'success',
        data: account,
        message: 'Akun berhasil diperbarui'
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
        message: 'Akun tidak ditemukan'
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const account = await Account.findOrFail(params.id)

      // Cek apakah akun memiliki children
      const hasChildren = await Account.query()
        .where('parentId', params.id)
        .first()
      
      if (hasChildren) {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Tidak dapat menghapus akun yang memiliki sub-akun'
        })
      }

      // Cek apakah akun digunakan di journal lines
      const hasJournalLines = await account.related('journalLines').query().first()
      if (hasJournalLines) {
        await trx.rollback()
        return response.badRequest({
          status: 'error',
          message: 'Tidak dapat menghapus akun yang sudah digunakan dalam jurnal'
        })
      }

      account.useTransaction(trx)
      await account.delete()

      await trx.commit()

      return response.ok({
        status: 'success',
        message: 'Akun berhasil dihapus'
      })
    } catch (error) {
      await trx.rollback()
      
      return response.notFound({
        status: 'error',
        message: 'Akun tidak ditemukan'
      })
    }
  }

  async getChartOfAccounts({ response }: HttpContext) {
    try {
      // Ambil semua akun parent (level 1)
      const chartOfAccounts = await Account.query()
        .where('isParent', true)
        .whereNull('parentId')
        .preload('children', (query) => {
          query.preload('children')
        })
        .orderBy('code', 'asc')

      return response.ok({
        status: 'success',
        data: chartOfAccounts,
        message: 'Chart of Accounts berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil Chart of Accounts'
      })
    }
  }

  async getByCategory({ params, response }: HttpContext) {
    try {
      const category = params.category
      const validCategories = ['asset', 'liability', 'equity', 'revenue', 'expense']
      
      if (!validCategories.includes(category)) {
        return response.badRequest({
          status: 'error',
          message: 'Kategori tidak valid'
        })
      }

      const accounts = await Account.query()
        .where('category', category)
        .preload('parent')
        .orderBy('code', 'asc')

      return response.ok({
        status: 'success',
        data: accounts,
        message: `Daftar akun kategori ${category} berhasil diambil`
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar akun'
      })
    }
  }

  async getParentAccounts({ response }: HttpContext) {
    try {
      const parentAccounts = await Account.query()
        .where('isParent', true)
        .orderBy('code', 'asc')

      return response.ok({
        status: 'success',
        data: parentAccounts,
        message: 'Daftar akun parent berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil daftar akun parent'
      })
    }
  }

  async getSummary({ response }: HttpContext) {
    try {
      const totalAccounts = await Account.query().count('* as total')
      const parentAccounts = await Account.query().where('isParent', true).count('* as total')
      const childAccounts = await Account.query().where('isParent', false).count('* as total')

      // Hitung per kategori
      const categoryStats = await Account.query()
        .select('category')
        .count('* as total')
        .groupBy('category')

      return response.ok({
        status: 'success',
        data: {
          totalAccounts: totalAccounts[0].$extras.total || 0,
          parentAccounts: parentAccounts[0].$extras.total || 0,
          childAccounts: childAccounts[0].$extras.total || 0,
          categoryStats
        },
        message: 'Ringkasan akun berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil ringkasan akun'
      })
    }
  }
}
