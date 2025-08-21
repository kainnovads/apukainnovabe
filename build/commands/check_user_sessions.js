import { BaseCommand } from '@adonisjs/core/ace';
import UserSession from '#models/user_session';
import User from '#models/auth/user';
export default class CheckUserSessions extends BaseCommand {
    static commandName = 'check:user-sessions';
    static description = 'Mengecek data user sessions';
    async run() {
        this.logger.info('Mengecek data user sessions...');
        try {
            this.logger.info('Mengecek tabel users...');
            const userCount = await User.query().count('* as total');
            this.logger.info(`Total users: ${userCount[0].$extras.total}`);
            this.logger.info('Mengecek tabel user_sessions...');
            const sessionCount = await UserSession.query().count('* as total');
            this.logger.info(`Total user sessions: ${sessionCount[0].$extras.total}`);
            this.logger.info('Mengecek active sessions...');
            const activeSessions = await UserSession.query()
                .where('isActive', true)
                .preload('user')
                .orderBy('lastActivity', 'desc')
                .limit(5);
            this.logger.info(`Active sessions: ${activeSessions.length}`);
            if (activeSessions.length > 0) {
                this.logger.info('Active users:');
                activeSessions.forEach((session, index) => {
                    this.logger.info(`${index + 1}. ${session.user.fullName} (${session.user.email}) - ${session.deviceType} - ${session.lastActivity}`);
                });
            }
            else {
                this.logger.info('Tidak ada user yang sedang aktif');
            }
        }
        catch (error) {
            this.logger.error('Error details:', error);
            this.logger.error('Error message:', error.message);
            this.logger.error('Error stack:', error.stack);
        }
    }
}
//# sourceMappingURL=check_user_sessions.js.map