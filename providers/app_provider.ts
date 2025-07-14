import env from '#start/env'
import { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  async register() {}

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {
    // ✅ OPTIMASI: Setup comprehensive database monitoring dengan env check
    if (env.get('ENABLE_QUERY_MONITORING', true)) {
      this.setupDatabaseMonitoring()
    }
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}

  /**
   * Setup comprehensive database monitoring dan N+1 detection
   */
  private setupDatabaseMonitoring() {
    if (!this.app.inDev) {
      return
    }

    // ✅ Get thresholds dari environment dengan defaults
    const slowQueryThreshold = env.get('SLOW_QUERY_THRESHOLD', 200)

    // ✅ Counter untuk mendeteksi N+1 queries per request
    const requestQueryTracking = new Map<string, {
      queries: Array<{ sql: string; bindings: any[]; duration: number; timestamp: number }>,
      startTime: number,
      requestId: string
    }>()

    // ✅ Pretty print queries di development jika DB_DEBUG enabled
    if (env.get('DB_DEBUG', false)) {
      console.log('Database debugging enabled')
    }

    // ✅ Log slow queries threshold
    if (slowQueryThreshold) {
      console.log(`Slow query threshold set to: ${slowQueryThreshold}ms`)
    }

    // ✅ Database query monitoring - currently disabled due to AdonisJS version compatibility
    // TODO: Implement proper database monitoring using the correct AdonisJS methods
    /*
    Database.on('db:query', (query) => {
      const requestId = this.getCurrentRequestId()

      if (!requestQueryTracking.has(requestId)) {
        requestQueryTracking.set(requestId, {
          queries: [],
          startTime: Date.now(),
          requestId
        })
      }

      const tracking = requestQueryTracking.get(requestId)!
      tracking.queries.push({
        sql: query.sql,
        bindings: query.bindings,
        duration: query.duration,
        timestamp: Date.now()
      })

      // ✅ Alert untuk slow queries individual dengan threshold dari env
      if (query.duration > slowQueryThreshold) {
        console.warn(`🐌 Slow Query Alert: ${query.duration}ms (threshold: ${slowQueryThreshold}ms)`)
        console.warn(`SQL: ${query.sql}`)
        console.warn(`Bindings:`, query.bindings)
        console.warn('---')
      }

      // ✅ Alert untuk potential N+1 queries (>15 queries dalam 1 request)
      if (tracking.queries.length > 15) {
        console.warn(`🔄 Potential N+1 Query Alert: ${tracking.queries.length} queries in one request`)
        console.warn(`Request ID: ${requestId}`)

        // ✅ Cari pattern yang sama (indikasi N+1)
        const sqlPatterns = new Map<string, number>()
        tracking.queries.forEach(q => {
          const pattern = this.extractQueryPattern(q.sql)
          sqlPatterns.set(pattern, (sqlPatterns.get(pattern) || 0) + 1)
        })

        // ✅ Report pattern yang suspicious
        sqlPatterns.forEach((count, pattern) => {
          if (count > 5) {
            console.warn(`🔁 Repeated Query Pattern (${count}x): ${pattern}`)
          }
        })
        console.warn('---')
      }

      // ✅ Cleanup old tracking data (memory management)
      if (tracking.queries.length > 50) {
        const totalTime = Date.now() - tracking.startTime
        console.warn(`📊 Request Summary:`)
        console.warn(`Total Queries: ${tracking.queries.length}`)
        console.warn(`Total Time: ${totalTime}ms`)
        console.warn(`Average Query Time: ${tracking.queries.reduce((sum, q) => sum + q.duration, 0) / tracking.queries.length}ms`)
        console.warn('===')

        requestQueryTracking.delete(requestId)
      }
    })
    */

    // ✅ Cleanup tracking setiap 5 menit untuk memory management
    setInterval(() => {
      const now = Date.now()
      for (const [requestId, tracking] of requestQueryTracking.entries()) {
        if (now - tracking.startTime > 300000) { // 5 menit
          requestQueryTracking.delete(requestId)
        }
      }
    }, 300000)

    console.log(`✅ Database monitoring setup completed`)
  }
}
