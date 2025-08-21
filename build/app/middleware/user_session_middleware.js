import UserSessionService from '#services/user_session_service';
export default class UserSessionMiddleware {
    async handle(ctx, next) {
        if (ctx.auth.user) {
            const sessionId = ctx.request.header('x-session-id');
            if (sessionId) {
                await UserSessionService.updateLastActivity(sessionId);
            }
        }
        await next();
    }
}
//# sourceMappingURL=user_session_middleware.js.map