import UserSession from '#models/user_session'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class UserSessionService {
  /**
   * Membuat session baru untuk user yang login
   */
  static async createSession(userId: number, ipAddress: string, userAgent: string) {
    const deviceType = this.getDeviceType(userAgent)
    
    return await UserSession.create({
      userId,
      sessionId: crypto.randomBytes(32).toString('hex'),
      ipAddress,
      userAgent,
      deviceType,
      isActive: true,
      lastActivity: DateTime.now(),
      loginAt: DateTime.now(),
    })
  }

  /**
   * Update last activity user
   */
  static async updateLastActivity(sessionId: string) {
    const session = await UserSession.query()
      .where('sessionId', sessionId)
      .where('isActive', true)
      .first()

    if (session) {
      session.lastActivity = DateTime.now()
      await session.save()
    }
  }

  /**
   * Logout user (nonaktifkan session)
   */
  static async logoutSession(sessionId: string) {
    const session = await UserSession.query()
      .where('sessionId', sessionId)
      .where('isActive', true)
      .first()

    if (session) {
      session.isActive = false
      session.logoutAt = DateTime.now()
      await session.save()
    }
  }

  /**
   * Mendapatkan semua user yang sedang online
   */
  static async getActiveUsers() {
    const activeSessions = await UserSession.query()
      .where('isActive', true)
      .preload('user')
      .orderBy('lastActivity', 'desc')

    // Transform data untuk memastikan format yang benar
    return activeSessions.map(session => ({
      id: session.id,
      userId: session.userId,
      sessionId: session.sessionId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceType: session.deviceType,
      isActive: session.isActive,
      lastActivity: session.lastActivity.toISO(),
      loginAt: session.loginAt.toISO(),
      logoutAt: session.logoutAt?.toISO() || null,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
      }
    }))
  }

  /**
   * Mendapatkan session aktif untuk user tertentu
   */
  static async getUserActiveSessions(userId: number) {
    return await UserSession.query()
      .where('userId', userId)
      .where('isActive', true)
      .orderBy('lastActivity', 'desc')
  }

  /**
   * Membersihkan session yang sudah expired (lebih dari 24 jam tidak aktif)
   */
  static async cleanupExpiredSessions() {
    const expiredTime = DateTime.now().minus({ hours: 24 })
    
    await UserSession.query()
      .where('isActive', true)
      .where('lastActivity', '<', expiredTime.toSQL())
      .update({
        isActive: false,
        logoutAt: DateTime.now(),
      })
  }

  /**
   * Mendeteksi tipe device berdasarkan user agent
   */
  private static getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }
}
