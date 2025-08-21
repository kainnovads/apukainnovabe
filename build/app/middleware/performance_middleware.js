import env from '#start/env';
export default class PerformanceMiddleware {
    async handle(ctx, next) {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        let queryCount = 0;
        let queryDuration = 0;
        const slowEndpointThreshold = env.get('SLOW_ENDPOINT_THRESHOLD', 1000);
        try {
            const response = await next();
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1_000_000;
            const endMemory = process.memoryUsage();
            const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
            const performanceData = {
                endpoint: `${ctx.request.method()} ${ctx.request.url()}`,
                duration: Math.round(duration * 100) / 100,
                queryCount,
                queryDuration: Math.round(queryDuration * 100) / 100,
                memoryUsed: Math.round(memoryDelta / 1024 / 1024 * 100) / 100,
                timestamp: new Date().toISOString(),
            };
            if (process.env.NODE_ENV === 'development') {
                ctx.response.header('X-Response-Time', `${performanceData.duration}ms`);
                ctx.response.header('X-Query-Count', queryCount.toString());
                ctx.response.header('X-Query-Time', `${performanceData.queryDuration}ms`);
                ctx.response.header('X-Memory-Delta', `${performanceData.memoryUsed}MB`);
            }
            this.analyzePerformance(performanceData, slowEndpointThreshold);
            return response;
        }
        finally {
        }
    }
    analyzePerformance(data, slowEndpointThreshold) {
        const { endpoint, duration, queryCount, queryDuration, memoryUsed } = data;
        if (duration > slowEndpointThreshold * 2) {
            console.warn('\n🚨 CRITICAL: Very Slow Endpoint');
            console.warn(`📍 Endpoint: ${endpoint}`);
            console.warn(`⏱️  Duration: ${duration}ms (threshold: ${slowEndpointThreshold}ms)`);
            console.warn(`🗄️  Queries: ${queryCount} (${queryDuration}ms)`);
            console.warn(`💾 Memory: ${memoryUsed}MB`);
            console.warn('🔧 Suggestion: Consider caching, query optimization, or pagination');
            console.warn('='.repeat(60));
        }
        else if (duration > slowEndpointThreshold) {
            console.warn('\n⚠️  SLOW: Endpoint Performance Issue');
            console.warn(`📍 Endpoint: ${endpoint}`);
            console.warn(`⏱️  Duration: ${duration}ms (threshold: ${slowEndpointThreshold}ms)`);
            console.warn(`🗄️  Queries: ${queryCount} (${queryDuration}ms)`);
            console.warn('🔧 Suggestion: Review query efficiency and data loading');
            console.warn('-'.repeat(50));
        }
        if (queryCount > 20) {
            console.warn('\n🔄 N+1 QUERY ALERT');
            console.warn(`📍 Endpoint: ${endpoint}`);
            console.warn(`🗄️  Queries: ${queryCount} queries detected`);
            console.warn(`⏱️  Query Time: ${queryDuration}ms`);
            console.warn('🔧 Suggestion: Use eager loading (.preload()) or exists() instead of whereHas()');
            console.warn('-'.repeat(50));
        }
        if (memoryUsed > 50) {
            console.warn('\n💾 HIGH MEMORY USAGE');
            console.warn(`📍 Endpoint: ${endpoint}`);
            console.warn(`💾 Memory Delta: ${memoryUsed}MB`);
            console.warn(`🗄️  Queries: ${queryCount}`);
            console.warn('🔧 Suggestion: Check for memory leaks, large data sets, or inefficient data processing');
            console.warn('-'.repeat(50));
        }
        if (queryCount > 10 && queryCount <= 20) {
            console.info(`ℹ️  ${endpoint}: ${queryCount} queries (${duration}ms) - Consider optimization`);
        }
        if (process.env.NODE_ENV === 'development' && (duration > slowEndpointThreshold / 2 || queryCount > 5)) {
            console.log(`\n📊 Performance Summary:`);
            console.log(`📍 ${endpoint}`);
            console.log(`⏱️  Response: ${duration}ms`);
            console.log(`🗄️  Queries: ${queryCount} (${queryDuration}ms)`);
            console.log(`💾 Memory: ${memoryUsed}MB`);
            const rating = this.getPerformanceRating(duration, queryCount, slowEndpointThreshold);
            console.log(`🎯 Rating: ${rating}`);
            console.log('');
        }
    }
    getPerformanceRating(duration, queryCount, threshold) {
        if (duration < threshold * 0.1 && queryCount <= 3)
            return '🟢 EXCELLENT';
        if (duration < threshold * 0.3 && queryCount <= 5)
            return '🟡 GOOD';
        if (duration < threshold * 0.5 && queryCount <= 10)
            return '🟠 FAIR';
        if (duration < threshold && queryCount <= 15)
            return '🔴 POOR';
        return '🚨 CRITICAL';
    }
}
//# sourceMappingURL=performance_middleware.js.map