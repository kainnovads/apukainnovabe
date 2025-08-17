import { BaseCommand } from '@adonisjs/core/ace'
import db from '@adonisjs/lucid/services/db'

export default class DebugData extends BaseCommand {
  static commandName = 'debug:data'
  static description = 'Debug data from database'

  async run() {
    this.logger.info('Debugging data...')
    
    try {
      // Cek tabel user_sessions
      const sessions = await db.from('user_sessions')
        .select('*')
        .where('is_active', true)
        .limit(5)
      
      this.logger.info(`Active sessions found: ${sessions.length}`)
      
      for (const session of sessions) {
        this.logger.info(`Session ID: ${session.session_id}`)
        this.logger.info(`User ID: ${session.user_id}`)
        this.logger.info(`Device: ${session.device_type}`)
        this.logger.info(`Active: ${session.is_active}`)
        this.logger.info(`Last Activity: ${session.last_activity}`)
        
        // Cek user data
        const user = await db.from('users')
          .select('id', 'email', 'full_name')
          .where('id', session.user_id)
          .first()
        
        if (user) {
          this.logger.info(`User: ${user.full_name} (${user.email})`)
        }
        
        this.logger.info('---')
      }
      
    } catch (error) {
      this.logger.error('Error:', error.message)
      this.logger.error('Stack:', error.stack)
    }
  }
}
