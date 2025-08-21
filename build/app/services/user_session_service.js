import UserSession from '#models/user_session';
import { DateTime } from 'luxon';
import crypto from 'node:crypto';
export default class UserSessionService {
    static async createSession(userId, ipAddress, userAgent) {
        const deviceType = this.getDeviceType(userAgent);
        return await UserSession.create({
            userId,
            sessionId: crypto.randomBytes(32).toString('hex'),
            ipAddress,
            userAgent,
            deviceType,
            isActive: true,
            lastActivity: DateTime.now(),
            loginAt: DateTime.now(),
        });
    }
    static async updateLastActivity(sessionId) {
        const session = await UserSession.query()
            .where('sessionId', sessionId)
            .where('isActive', true)
            .first();
        if (session) {
            session.lastActivity = DateTime.now();
            await session.save();
        }
    }
    static async logoutSession(sessionId) {
        const session = await UserSession.query()
            .where('sessionId', sessionId)
            .where('isActive', true)
            .first();
        if (session) {
            session.isActive = false;
            session.logoutAt = DateTime.now();
            await session.save();
        }
    }
    static async getActiveUsers() {
        const activeSessions = await UserSession.query()
            .where('isActive', true)
            .preload('user')
            .orderBy('lastActivity', 'desc');
        return activeSessions.map(session => ({
            id: session.id,
            userId: session.userId,
            sessionId: session.sessionId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            deviceType: session.deviceType,
            isActive: session.isActive,
            lastActivity: session.lastActivity.toISO(),
            loginAt: session.loginAt.toISO(),
            logoutAt: session.logoutAt?.toISO() || null,
            user: {
                id: session.user.id,
                email: session.user.email,
                fullName: session.user.fullName,
            }
        }));
    }
    static async getUserActiveSessions(userId) {
        return await UserSession.query()
            .where('userId', userId)
            .where('isActive', true)
            .orderBy('lastActivity', 'desc');
    }
    static async cleanupExpiredSessions() {
        const expiredTime = DateTime.now().minus({ hours: 24 });
        await UserSession.query()
            .where('isActive', true)
            .where('lastActivity', '<', expiredTime.toSQL())
            .update({
            isActive: false,
            logoutAt: DateTime.now(),
        });
    }
    static getDeviceType(userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'mobile';
        }
        else if (ua.includes('tablet') || ua.includes('ipad')) {
            return 'tablet';
        }
        else {
            return 'desktop';
        }
    }
}
//# sourceMappingURL=user_session_service.js.map