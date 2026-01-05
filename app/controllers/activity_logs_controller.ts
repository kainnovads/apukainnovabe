import type { HttpContext } from '@adonisjs/core/http'
import ActivityLog from '#models/activity_log'

export default class ActivityLogsController {
  /**
   * Menampilkan daftar activity logs dengan pagination dan filter
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const page      = request.input('page', 1)
      const limit     = request.input('rows', 10)
      const userId    = request.input('user_id')
      const startDate = request.input('start_date')
      const endDate   = request.input('end_date')
      const action    = request.input('action')
      const search    = request.input('search', '')

      const query = ActivityLog.query().preload('user')

      // Filter berdasarkan user_id (jika bukan superadmin/admin, hanya bisa lihat log sendiri)
      const user = auth.user
      if (user) {
        const userRoles = await user.related('roles').query()
        const isAdmin = userRoles.some(role => ['superadmin', 'admin'].includes(role.name))
        
        if (!isAdmin) {
          query.where('user_id', user.id)
        } else if (userId) {
          query.where('user_id', userId)
        }
      }

      // Filter berdasarkan tanggal
      if (startDate) {
        query.where('created_at', '>=', startDate)
      }
      if (endDate) {
        query.where('created_at', '<=', endDate)
      }

      // Filter berdasarkan action
      if (action) {
        query.where('action', 'like', `%${action}%`)
      }

      // Search di description
      if (search) {
        query.where((q) => {
          q.where('description', 'like', `%${search}%`)
            .orWhere('action', 'like', `%${search}%`)
            .orWhere('device', 'like', `%${search}%`)
        })
      }

      // Order by created_at descending (terbaru dulu)
      query.orderBy('created_at', 'desc')

      const activityLogs = await query.paginate(page, limit)

      return response.ok(activityLogs.toJSON())
    } catch (error) {
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data activity log',
        error: error.message,
      })
    }
  }

  /**
   * Menampilkan detail activity log berdasarkan ID
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const activityLog = await ActivityLog.query()
        .where('id', params.id)
        .preload('user')
        .first()

      if (!activityLog) {
        return response.notFound({ message: 'Activity log tidak ditemukan' })
      }

      // Cek apakah user berhak melihat log ini
      const user = auth.user
      if (user) {
        const userRoles = await user.related('roles').query()
        const isAdmin = userRoles.some(role => ['superadmin', 'admin'].includes(role.name))
        
        if (!isAdmin && activityLog.userId !== user.id) {
          return response.forbidden({ message: 'Anda tidak memiliki akses untuk melihat log ini' })
        }
      }

      return response.ok(activityLog)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil detail activity log',
        error: error.message,
      })
    }
  }

  /**
   * Menyimpan activity log baru
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.unauthorized({ message: 'User tidak terautentikasi' })
      }

      const payload = request.only([
        'latitude',
        'longitude',
        'device',
        'action',
        'description',
      ])

      // Ambil IP address dan user agent dari request
      const ipAddress = request.ip()
      const userAgent = request.header('user-agent')

      const activityLog = await ActivityLog.create({
        userId     : user.id,
        latitude   : payload.latitude ? parseFloat(payload.latitude)  : null,
        longitude  : payload.longitude ? parseFloat(payload.longitude): null,
        device     : payload.device || null,
        action     : payload.action || 'unknown',
        description: payload.description || null,
        ipAddress  : ipAddress || null,
        userAgent  : userAgent || null,
      })

      await activityLog.load('user')

      return response.created({
        success: true,
        message: 'Activity log berhasil disimpan',
        data: activityLog,
      })
    } catch (error) {
      return response.badRequest({
        message: 'Gagal menyimpan activity log',
        error: error.message,
      })
    }
  }

  /**
   * Menghapus activity log
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const activityLog = await ActivityLog.find(params.id)
      if (!activityLog) {
        return response.notFound({ message: 'Activity log tidak ditemukan' })
      }

      // Hanya superadmin dan admin yang bisa menghapus
      const user = auth.user
      if (user) {
        const userRoles = await user.related('roles').query()
        const isAdmin = userRoles.some(role => ['superadmin', 'admin'].includes(role.name))
        
        if (!isAdmin) {
          return response.forbidden({ message: 'Anda tidak memiliki izin untuk menghapus activity log' })
        }
      }

      await activityLog.delete()
      return response.ok({ message: 'Activity log berhasil dihapus' })
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal menghapus activity log',
        error: error.message,
      })
    }
  }

  /**
   * Mendapatkan activity logs berdasarkan user_id
   */
  async getByUserId({ params, request, response, auth }: HttpContext) {
    try {
      const userId = params.id
      const page = request.input('page', 1)
      const limit = request.input('rows', 10)

      // Cek apakah user berhak melihat log user lain
      const user = auth.user
      if (user) {
        const userRoles = await user.related('roles').query()
        const isAdmin = userRoles.some(role => ['superadmin', 'admin'].includes(role.name))
        
        if (!isAdmin && parseInt(userId) !== user.id) {
          return response.forbidden({ message: 'Anda tidak memiliki akses untuk melihat log user lain' })
        }
      }

      const activityLogs = await ActivityLog.query()
        .where('user_id', userId)
        .preload('user')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok(activityLogs.toJSON())
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil activity logs',
        error: error.message,
      })
    }
  }
}

