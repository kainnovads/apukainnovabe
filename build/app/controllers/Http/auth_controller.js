import { createUserValidator, loginValidator } from '#validators/auth/auth';
import hash from '@adonisjs/core/services/hash';
import User from '#models/auth/user';
import Role from '#models/auth/role';
import AccessToken from '#models/auth/auth_access_token';
import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import UserSessionService from '#services/user_session_service';
export default class AuthController {
    async register({ request, response }) {
        const data = await request.validateUsing(createUserValidator);
        const user = await User.create(data);
        const guestRole = await Role.findByOrFail('name', 'guest');
        await user.related('roles').attach([guestRole.id]);
        const token = await User.accessTokens.create(user);
        return response.created({
            message: 'User registered successfully',
            user,
            token,
        });
    }
    async login({ request, response }) {
        console.log('Login method hit!');
        const data = await request.validateUsing(loginValidator);
        const { username, password, remember_me } = data;
        console.log('Login attempt for username:', username);
        try {
            const user = await User.findBy('username', username);
            if (!user) {
                console.log('User not found');
                return response.unauthorized({ message: 'Username atau password salah' });
            }
            console.log('User found:', user.id, user.isActive);
            if (!user.isActive) {
                console.log('User inactive');
                return response.forbidden({ message: 'Akun anda dinonaktifkan, silahkan hubungi admin' });
            }
            console.log('Verifying password...');
            const passwordValid = await hash.verify(user.password, password);
            console.log('Password valid:', passwordValid);
            if (!passwordValid) {
                console.log('Invalid password');
                return response.unauthorized({ message: 'Username atau password salah' });
            }
            let token;
            if (remember_me) {
                token = await User.accessTokens.create(user, {
                    expiresAt: DateTime.now().plus({ days: 30 }).toISO()
                });
            }
            else {
                token = await User.accessTokens.create(user, {
                    expiresAt: DateTime.now().plus({ minutes: 15 }).toISO()
                });
            }
            await user.load('roles');
            const session = await UserSessionService.createSession(user.id, request.ip(), request.header('user-agent') || '');
            return response.ok({
                message: 'Login berhasil',
                token: {
                    type: 'bearer',
                    token: token.value?.release(),
                    expires_at: token.expiresAt,
                },
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    isActive: user.isActive,
                    roles: user.roles,
                },
                sessionId: session.sessionId,
            });
        }
        catch (error) {
            console.error('Login error:', error);
            if (error.status === 403) {
                return response.forbidden({ message: 'Akun anda dinonaktifkan, silahkan hubungi admin' });
            }
            return response.internalServerError({
                message: 'Login gagal',
                error: error.message,
            });
        }
    }
    async me({ auth, response }) {
        const user = auth.user;
        if (!user) {
            return response.unauthorized({ message: 'User not authenticated' });
        }
        await user.load((loader) => {
            loader.load('roles', (rolesQuery) => {
                rolesQuery.preload('permissions');
            });
            loader.load('pegawai', (pegawaiQuery) => {
                pegawaiQuery.preload('PegawaiHistory', (historyQuery) => {
                    historyQuery.preload('perusahaan');
                    historyQuery.preload('cabang', (cabangQuery) => {
                        cabangQuery.preload('perusahaan');
                    });
                });
            });
        });
        return response.ok(user);
    }
    async logout({ auth, request, response }) {
        const user = auth.user;
        if (!user) {
            return response.unauthorized({ message: 'User not authenticated' });
        }
        const tokenValue = request.header('Authorization')?.replace(/^Bearer\s/, '');
        if (!tokenValue) {
            return response.badRequest({ message: 'No token provided' });
        }
        const hashedToken = crypto.createHash('md5').update(tokenValue).digest('hex');
        const token = await AccessToken.query()
            .where('tokenable_id', user.id)
            .andWhere('hash', hashedToken)
            .first();
        if (!token) {
            return response.notFound({ message: 'Token not found' });
        }
        await token.delete();
        const sessionId = request.header('x-session-id');
        if (sessionId) {
            await UserSessionService.logoutSession(sessionId);
        }
        return response.ok({ message: 'Logout successful' });
    }
    async refreshToken({ request, response }) {
        const refreshToken = request.input('refresh_token');
        if (!refreshToken) {
            return response.badRequest({ message: 'Refresh token is required' });
        }
        const hashedToken = crypto.createHash('md5').update(refreshToken).digest('hex');
        const tokenRecord = await AccessToken.query()
            .where('type', 'refresh_token')
            .andWhere('hash', hashedToken)
            .andWhere('expires_at', '>', DateTime.now().toSQL())
            .first();
        if (!tokenRecord) {
            return response.unauthorized({ message: 'Invalid or expired refresh token' });
        }
        const user = await tokenRecord.related('user').query().firstOrFail();
        const accessToken = new AccessToken();
        accessToken.name = 'access_token';
        accessToken.type = 'access_token';
        accessToken.expiresAt = DateTime.now().plus({ minutes: 15 });
        await user.related('accessTokens').save(accessToken);
        return {
            token: accessToken.hash,
        };
    }
}
//# sourceMappingURL=auth_controller.js.map