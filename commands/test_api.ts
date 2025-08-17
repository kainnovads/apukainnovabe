import { BaseCommand } from '@adonisjs/core/ace'
import UserSessionService from '#services/user_session_service'

export default class TestApi extends BaseCommand {
  static commandName = 'test:api'
  static description = 'Test API endpoint'

  async run() {
    this.logger.info('Testing API endpoint...')
    
    try {
      const activeUsers = await UserSessionService.getActiveUsers()
      this.logger.info(`Active users found: ${activeUsers.length}`)
      
      activeUsers.forEach((user, index) => {
        this.logger.info(`${index + 1}. User: ${user.user.fullName} (${user.user.email})`)
        this.logger.info(`   Device: ${user.deviceType}`)
        this.logger.info(`   Last Activity: ${user.lastActivity}`)
        this.logger.info(`   Session ID: ${user.sessionId}`)
      })
      
      // Test response format
      const response = {
        success: true,
        data: activeUsers
      }
      
      this.logger.info('Response format:')
      this.logger.info(JSON.stringify(response, null, 2))
      
    } catch (error) {
      this.logger.error('Error:', error.message)
    }
  }
}
