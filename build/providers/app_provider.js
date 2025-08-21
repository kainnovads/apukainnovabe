import env from '#start/env';
export default class AppProvider {
    app;
    constructor(app) {
        this.app = app;
    }
    async register() { }
    async boot() { }
    async start() { }
    async ready() {
        if (env.get('ENABLE_QUERY_MONITORING', true)) {
            this.setupDatabaseMonitoring();
        }
    }
    async shutdown() { }
    setupDatabaseMonitoring() {
        if (!this.app.inDev) {
            return;
        }
        const slowQueryThreshold = env.get('SLOW_QUERY_THRESHOLD', 200);
        const requestQueryTracking = new Map();
        if (env.get('DB_DEBUG', false)) {
            console.log('Database debugging enabled');
        }
        if (slowQueryThreshold) {
            console.log(`Slow query threshold set to: ${slowQueryThreshold}ms`);
        }
        setInterval(() => {
            const now = Date.now();
            for (const [requestId, tracking] of requestQueryTracking.entries()) {
                if (now - tracking.startTime > 300000) {
                    requestQueryTracking.delete(requestId);
                }
            }
        }, 300000);
        console.log(`✅ Database monitoring setup completed`);
    }
}
//# sourceMappingURL=app_provider.js.map