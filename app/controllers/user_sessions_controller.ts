import type { HttpContext } from '@adonisjs/core/http'
import UserSessionService from '#services/user_session_service'

export default class UserSessionsController {
  /**
   * Mendapatkan daftar user yang sedang online
   */
  async getActiveUsers({ response }: HttpContext) {
    const activeUsers = await UserSessionService.getActiveUsers()
    
    return response.json({
      success: true,
      data: activeUsers,
    })
  }

  /**
   * Mendapatkan session aktif untuk user tertentu
   */
  async getUserSessions({ params, response }: HttpContext) {
    const userId = params.id
    const sessions = await UserSessionService.getUserActiveSessions(userId)
    
    return response.json({
      success: true,
      data: sessions,
    })
  }

  /**
   * Force logout user dari session tertentu
   */
  async forceLogout({ params, response }: HttpContext) {
    const sessionId = params.sessionId
    await UserSessionService.logoutSession(sessionId)
    
    return response.json({
      success: true,
      message: 'User berhasil di-logout',
    })
  }

  /**
   * Cleanup session yang expired
   */
  async cleanupExpired({ response }: HttpContext) {
    await UserSessionService.cleanupExpiredSessions()
    
    return response.json({
      success: true,
      message: 'Session expired berhasil dibersihkan',
    })
  }
}
