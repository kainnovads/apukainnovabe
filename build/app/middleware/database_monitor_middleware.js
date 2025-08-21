import db from '@adonisjs/lucid/services/db';
export default class DatabaseMonitorMiddleware {
    async handle(ctx, next) {
        const startTime = Date.now();
        try {
            await this.logPoolStatus('Before Request');
            await next();
        }
        catch (error) {
            await this.logPoolStatus('On Error');
            throw error;
        }
        finally {
            await this.logPoolStatus('After Request');
            const duration = Date.now() - startTime;
            if (duration > 5000) {
                console.warn(`⚠️ Slow request detected: ${ctx.request.url()} took ${duration}ms`);
            }
        }
    }
    async logPoolStatus(stage) {
        try {
            const manager = db.manager;
            const connection = manager.get('postgres');
            if (connection && 'connection' in connection && connection.connection) {
                const pool = connection.connection.pool;
                if (pool) {
                    const used = pool.numUsed() || 0;
                    const free = pool.numFree() || 0;
                    const pending = pool.numPendingAcquires() || 0;
                    const max = pool.max || 10;
                    const usagePercentage = (used / max) * 100;
                    if (usagePercentage > 80) {
                        console.warn(`🔴 HIGH DB POOL USAGE ${stage}: ${used}/${max} (${usagePercentage.toFixed(1)}%) - Free: ${free}, Pending: ${pending}`);
                    }
                    else if (usagePercentage > 60) {
                        console.log(`🟡 DB Pool Usage ${stage}: ${used}/${max} (${usagePercentage.toFixed(1)}%) - Free: ${free}, Pending: ${pending}`);
                    }
                    if (pending > 5) {
                        console.error(`🚨 CRITICAL: ${pending} pending database connections! Possible connection leak!`);
                    }
                }
            }
        }
        catch (error) {
            console.error('Database monitor error:', error.message);
        }
    }
}
//# sourceMappingURL=database_monitor_middleware.js.map