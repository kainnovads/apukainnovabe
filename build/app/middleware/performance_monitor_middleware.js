export default class PerformanceMonitorMiddleware {
    async handle(ctx, next) {
        const startTime = Date.now();
        const { request, response } = ctx;
        const method = request.method();
        const url = request.url();
        const userAgent = request.header('user-agent') || 'unknown';
        const ip = request.ip();
        try {
            await next();
            const endTime = Date.now();
            const duration = endTime - startTime;
            if (duration > 5000) {
                console.error(`🚨 CRITICAL SLOW REQUEST: ${method} ${url} took ${duration}ms`, {
                    ip,
                    userAgent: userAgent.substring(0, 100),
                    timestamp: new Date().toISOString(),
                    status: response.getStatus()
                });
            }
            else if (duration > 2000) {
                console.error(`🐌 VERY SLOW REQUEST: ${method} ${url} took ${duration}ms`, {
                    ip,
                    timestamp: new Date().toISOString(),
                    status: response.getStatus()
                });
            }
            else if (duration > 1000) {
                console.warn(`⚠️ Slow request detected: ${url} took ${duration}ms`);
            }
            else if (duration > 500) {
                console.info(`📊 Moderate request: ${url} took ${duration}ms`);
            }
            response.header('X-Response-Time', `${duration}ms`);
            response.header('X-Performance-Level', duration < 100 ? 'excellent' :
                duration < 500 ? 'good' :
                    duration < 1000 ? 'fair' :
                        duration < 2000 ? 'poor' : 'critical');
        }
        catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.error(`❌ REQUEST ERROR: ${method} ${url} failed after ${duration}ms`, {
                error: error.message,
                ip,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
}
//# sourceMappingURL=performance_monitor_middleware.js.map