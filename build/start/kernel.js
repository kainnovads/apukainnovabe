import router from '@adonisjs/core/services/router';
import server from '@adonisjs/core/services/server';
import '#start/validator';
server.errorHandler(() => import('#exceptions/handler'));
server.use([
    () => import('#middleware/container_bindings_middleware'),
    () => import('#middleware/force_json_response_middleware'),
    () => import('#middleware/database_monitor_middleware'),
    () => import('#middleware/performance_monitor_middleware'),
    () => import('@adonisjs/cors/cors_middleware'),
    () => import('@adonisjs/static/static_middleware')
]);
router.use([
    () => import('@adonisjs/core/bodyparser_middleware'),
    () => import('@adonisjs/auth/initialize_auth_middleware'),
    () => import('@adonisjs/session/session_middleware'),
    () => import('@adonisjs/shield/shield_middleware'),
]);
export const middleware = router.named({
    hasRole: () => import('#middleware/has_role_middleware'),
    hasPermission: () => import('#middleware/has_permission_middleware'),
    auth: () => import('#middleware/auth_middleware'),
    userSession: () => import('#middleware/user_session_middleware'),
});
//# sourceMappingURL=kernel.js.map