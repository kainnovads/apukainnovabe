import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class HealthController {
  /**
   * Health check endpoint untuk monitoring production
   */
  async check({ response }: HttpContext) {
    try {
      // Test database connection
      await db.rawQuery('SELECT 1')
      
      return response.ok({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        app: 'running'
      })
    } catch (error) {
      return response.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      })
    }
  }

  /**
   * API status endpoint
   */
  async status({ response }: HttpContext) {
    return response.ok({
      service: 'ADN Backend API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString()
    })
  }
}
