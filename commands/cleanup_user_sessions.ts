import { BaseCommand } from '@adonisjs/core/ace'
import UserSessionService from '#services/user_session_service'

export default class CleanupUserSessions extends BaseCommand {
  static commandName = 'cleanup:user-sessions'
  static description = 'Membersihkan session user yang sudah expired'

  async run() {
    this.logger.info('Memulai cleanup session expired...')
    
    await UserSessionService.cleanupExpiredSessions()
    
    this.logger.info('Cleanup session expired selesai!')
  }
}
