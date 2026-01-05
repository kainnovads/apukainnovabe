import ActivityLog from '#models/activity_log'
import type { HttpContext } from '@adonisjs/core/http'

export default class ActivityLogService {
  /**
   * Membuat activity log baru
   */
  static async createLog(
    userId: number,
    action: string,
    options?: {
      latitude   ?: number | null
      longitude  ?: number | null
      device     ?: string | null
      description?: string | null
      ipAddress  ?: string | null
      userAgent  ?: string | null
    }
  ) {
    return await ActivityLog.create({
      userId,
      action,
      latitude: options?.latitude ?? null,
      longitude: options?.longitude ?? null,
      device: options?.device ?? null,
      description: options?.description ?? null,
      ipAddress: options?.ipAddress ?? null,
      userAgent: options?.userAgent ?? null,
    })
  }

  /**
   * Helper untuk membuat log dari HttpContext
   */
  static async logFromContext(
    ctx: HttpContext,
    action: string,
    options?: {
      latitude?: number | null
      longitude?: number | null
      device?: string | null
      description?: string | null
    }
  ) {
    const user = ctx.auth.user
    if (!user) {
      return null
    }

    const ipAddress = ctx.request.ip()
    const userAgent = ctx.request.header('user-agent')

    return await this.createLog(user.id, action, {
      ...options,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    })
  }

  /**
   * Mendeteksi device type dari user agent
   */
  static getDeviceType(userAgent: string | null): string | null {
    if (!userAgent) return null

    const ua = userAgent.toLowerCase()

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    } else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      return 'desktop'
    }

    return 'unknown'
  }

  /**
   * Mendapatkan activity logs untuk user tertentu
   */
  static async getUserLogs(
    userId: number,
    page: number = 1,
    limit: number = 10,
    filters?: {
      startDate?: string
      endDate?: string
      action?: string
      search?: string
    }
  ) {
    const query = ActivityLog.query()
      .where('user_id', userId)
      .preload('user')
      .orderBy('created_at', 'desc')

    if (filters?.startDate) {
      query.where('created_at', '>=', filters.startDate)
    }

    if (filters?.endDate) {
      query.where('created_at', '<=', filters.endDate)
    }

    if (filters?.action) {
      query.where('action', 'like', `%${filters.action}%`)
    }

    if (filters?.search) {
      query.where((q) => {
        q.where('description', 'like', `%${filters.search}%`)
          .orWhere('action', 'like', `%${filters.search}%`)
          .orWhere('device', 'like', `%${filters.search}%`)
      })
    }

    return await query.paginate(page, limit)
  }

  /**
   * Menghapus log lama (untuk cleanup)
   */
  static async cleanupOldLogs(daysToKeep: number = 90) {
    const { DateTime } = await import('luxon')
    const cutoffDate = DateTime.now().minus({ days: daysToKeep })

    const deleted = await ActivityLog.query()
      .where('created_at', '<', cutoffDate.toSQL())
      .delete()

    return deleted
  }
}

