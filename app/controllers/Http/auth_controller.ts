import { HttpContext } from '@adonisjs/core/http'
import { createUserValidator, loginValidator } from '#validators/auth/auth'
import hash from '@adonisjs/core/services/hash'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import AccessToken from '#models/auth/auth_access_token'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import UserSessionService from '#services/user_session_service'

export default class AuthController {
  // Register
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(createUserValidator)

    const user = await User.create(data)

    // Cari role 'guest'
    const guestRole = await Role.findByOrFail('name', 'guest')

    // Assign role ke user
    await user.related('roles').attach([guestRole.id])

    const token = await User.accessTokens.create(user)

    return response.created({
      message: 'User registered successfully',
      user,
      token,
    })
  }

  // Login
  async login({ request, response }: HttpContext) {
    console.log('Login method hit!')
    const data = await request.validateUsing(loginValidator)
    const { username, password, remember_me } = data

    console.log('Login attempt for username:', username)

    try {
      // 1. Cari user berdasarkan username
      const user = await User.findBy('username', username)
      if (!user) {
        console.log('User not found')
        return response.unauthorized({ message: 'Username atau password salah' })
      }

      console.log('User found:', user.id, user.isActive)

      // 2. Cek status aktif sebelum verifikasi password
      if (!user.isActive) {
        console.log('User inactive')
        // Langsung return forbidden tanpa lanjut ke verifikasi password atau generate token
        return response.forbidden({ message: 'Akun anda dinonaktifkan, silahkan hubungi admin' })
      }

      // 3. Verifikasi password
      console.log('Verifying password...')
      const passwordValid = await hash.verify(user.password, password)
      console.log('Password valid:', passwordValid)

      if (!passwordValid) {
        console.log('Invalid password')
        return response.unauthorized({ message: 'Username atau password salah' })
      }

      // 4. Generate token dengan durasi yang berbeda berdasarkan remember_me
      let token
      if (remember_me) {
        // Token berlaku 30 hari jika remember me dicentang
        token = await User.accessTokens.create(user, {
          expiresAt: DateTime.now().plus({ days: 30 }).toISO()
        })
      } else {
        // Token berlaku 15 menit jika remember me tidak dicentang
        token = await User.accessTokens.create(user, {
          expiresAt: DateTime.now().plus({ minutes: 15 }).toISO()
        })
      }

      // Ambil role user
      await user.load('roles')

      // Buat session tracking
      const session = await UserSessionService.createSession(
        user.id,
        request.ip(),
        request.header('user-agent') || ''
      )

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
      })
    } catch (error) {
      console.error('Login error:', error)
      // Jika error forbidden, pastikan pesan tetap konsisten
      if (error.status === 403) {
        return response.forbidden({ message: 'Akun anda dinonaktifkan, silahkan hubungi admin' })
      }
      return response.internalServerError({
        message: 'Login gagal',
        error: error.message,
      })
    }
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'User not authenticated' })
    }

    await user.load((loader) => {
      loader.load('roles', (rolesQuery) => {
        rolesQuery.preload('permissions')
      })
      loader.load('pegawai', (pegawaiQuery) => {
        pegawaiQuery.preload('PegawaiHistory', (historyQuery) => {
          historyQuery.preload('perusahaan')
          historyQuery.preload('cabang', (cabangQuery) => {
            cabangQuery.preload('perusahaan')
          })
        })
      })
    })

    return response.ok(user)
  }

  // Logout
  async logout({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'User not authenticated' })
    }

    const tokenValue = request.header('Authorization')?.replace(/^Bearer\s/, '')

    if (!tokenValue) {
      return response.badRequest({ message: 'No token provided' })
    }

    // Cari token yang cocok dengan hash tokenValue
    const hashedToken = crypto.createHash('md5').update(tokenValue).digest('hex')

    const token = await AccessToken.query()
      .where('tokenable_id', user.id)
      .andWhere('hash', hashedToken)
      .first()

    if (!token) {
      return response.notFound({ message: 'Token not found' })
    }

    await token.delete()

    // Logout session tracking
    const sessionId = request.header('x-session-id')
    if (sessionId) {
      await UserSessionService.logoutSession(sessionId)
    }

    return response.ok({ message: 'Logout successful' })
  }

  // Refresh Token
  public async refreshToken({ request, response }: HttpContext) {
    const refreshToken = request.input('refresh_token')

    if (!refreshToken) {
      return response.badRequest({ message: 'Refresh token is required' })
    }

    // Hash token sebelum dicari di database
    const hashedToken = crypto.createHash('md5').update(refreshToken).digest('hex')

    // Cari token refresh yang masih valid
    const tokenRecord = await AccessToken.query()
      .where('type', 'refresh_token')
      .andWhere('hash', hashedToken)
      .andWhere('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!tokenRecord) {
      return response.unauthorized({ message: 'Invalid or expired refresh token' })
    }

    const user = await tokenRecord.related('user').query().firstOrFail()

    // Buat access token baru
    const accessToken = new AccessToken()
    accessToken.name = 'access_token'
    accessToken.type = 'access_token'
    accessToken.expiresAt = DateTime.now().plus({ minutes: 15 })
    await user.related('accessTokens').save(accessToken)

    return {
      token: accessToken.hash,
    }
  }
}
