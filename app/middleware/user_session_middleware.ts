import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import UserSessionService from '#services/user_session_service'

export default class UserSessionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Jika user sudah login, update last activity
    if (ctx.auth.user) {
      const sessionId = ctx.request.header('x-session-id')
      if (sessionId) {
        await UserSessionService.updateLastActivity(sessionId)
      }
    }

    await next()
  }
}
