import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'

export default class DatabaseMonitorMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startTime = Date.now()

    try {
      // Log pool status before request
      await this.logPoolStatus('Before Request')

      // Continue with request
      await next()

    } catch (error) {
      // Log pool status on error
      await this.logPoolStatus('On Error')
      throw error
    } finally {
      // Log pool status after request
      await this.logPoolStatus('After Request')

      const duration = Date.now() - startTime
      if (duration > 5000) {
        console.warn(`⚠️ Slow request detected: ${ctx.request.url()} took ${duration}ms`)
      }
    }
  }

    private async logPoolStatus(stage: string) {
    try {
      const manager = db.manager
      const connection = manager.get('postgres')

      if (connection && 'connection' in connection && connection.connection) {
        const pool = (connection.connection as any).pool

        if (pool) {
          const used = pool.numUsed() || 0
          const free = pool.numFree() || 0
          const pending = pool.numPendingAcquires() || 0
          const max = pool.max || 10

          const usagePercentage = (used / max) * 100

          // Log warning if pool usage is high
          if (usagePercentage > 80) {
            console.warn(
              `🔴 HIGH DB POOL USAGE ${stage}: ${used}/${max} (${usagePercentage.toFixed(1)}%) - Free: ${free}, Pending: ${pending}`
            )
          } else if (usagePercentage > 60) {
            console.log(
              `🟡 DB Pool Usage ${stage}: ${used}/${max} (${usagePercentage.toFixed(1)}%) - Free: ${free}, Pending: ${pending}`
            )
          }

          // Critical alert if pending requests
          if (pending > 5) {
            console.error(
              `🚨 CRITICAL: ${pending} pending database connections! Possible connection leak!`
            )
          }
        }
      }
    } catch (error) {
      // Silently handle monitoring errors
      console.error('Database monitor error:', error.message)
    }
  }
}
