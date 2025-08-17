import { BaseCommand } from '@adonisjs/core/ace'
import db from '@adonisjs/lucid/services/db'

export default class SimpleCheck extends BaseCommand {
  static commandName = 'simple:check'
  static description = 'Simple check for data'

  async run() {
    this.logger.info('Simple check...')
    
    try {
      // Cek tabel users
      const users = await db.from('users').select('*').limit(3)
      this.logger.info(`Users found: ${users.length}`)
      users.forEach(user => {
        this.logger.info(`- ${user.email} (${user.full_name})`)
      })
      
      // Cek tabel user_sessions
      const sessions = await db.from('user_sessions').select('*').limit(3)
      this.logger.info(`Sessions found: ${sessions.length}`)
      sessions.forEach(session => {
        this.logger.info(`- Session ID: ${session.session_id} - Active: ${session.is_active}`)
      })
      
    } catch (error) {
      this.logger.error('Error:', error.message)
    }
  }
}
