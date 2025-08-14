import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Performance Monitor Middleware
 * Memantau performa request dan memberikan warning untuk request yang lambat
 */
export default class PerformanceMonitorMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startTime = Date.now()
    const { request, response } = ctx

    // Ambil informasi request
    const method = request.method()
    const url = request.url()
    const userAgent = request.header('user-agent') || 'unknown'
    const ip = request.ip()

    try {
      // Lanjutkan ke handler berikutnya
      await next()

      const endTime = Date.now()
      const duration = endTime - startTime

      // ✅ MONITORING: Log request berdasarkan durasi
      if (duration > 5000) {
        console.error(`🚨 CRITICAL SLOW REQUEST: ${method} ${url} took ${duration}ms`, {
          ip,
          userAgent: userAgent.substring(0, 100),
          timestamp: new Date().toISOString(),
          status: response.getStatus()
        })
      } else if (duration > 2000) {
        console.error(`🐌 VERY SLOW REQUEST: ${method} ${url} took ${duration}ms`, {
          ip,
          timestamp: new Date().toISOString(),
          status: response.getStatus()
        })
      } else if (duration > 1000) {
        console.warn(`⚠️ Slow request detected: ${url} took ${duration}ms`)
      } else if (duration > 500) {
        console.info(`📊 Moderate request: ${url} took ${duration}ms`)
      }

      // ✅ OPTIMASI: Tambahkan header performa untuk debugging
      response.header('X-Response-Time', `${duration}ms`)
      response.header('X-Performance-Level',
        duration < 100 ? 'excellent' :
        duration < 500 ? 'good' :
        duration < 1000 ? 'fair' :
        duration < 2000 ? 'poor' : 'critical'
      )

    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime

      console.error(`❌ REQUEST ERROR: ${method} ${url} failed after ${duration}ms`, {
        error: error.message,
        ip,
        timestamp: new Date().toISOString()
      })

      throw error
    }
  }
}
