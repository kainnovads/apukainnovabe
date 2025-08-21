import UserSessionService from '#services/user_session_service';
export default class UserSessionsController {
    async getActiveUsers({ response }) {
        const activeUsers = await UserSessionService.getActiveUsers();
        return response.json({
            success: true,
            data: activeUsers,
        });
    }
    async getUserSessions({ params, response }) {
        const userId = params.id;
        const sessions = await UserSessionService.getUserActiveSessions(userId);
        return response.json({
            success: true,
            data: sessions,
        });
    }
    async forceLogout({ params, response }) {
        const sessionId = params.sessionId;
        await UserSessionService.logoutSession(sessionId);
        return response.json({
            success: true,
            message: 'User berhasil di-logout',
        });
    }
    async cleanupExpired({ response }) {
        await UserSessionService.cleanupExpiredSessions();
        return response.json({
            success: true,
            message: 'Session expired berhasil dibersihkan',
        });
    }
}
//# sourceMappingURL=user_sessions_controller.js.map