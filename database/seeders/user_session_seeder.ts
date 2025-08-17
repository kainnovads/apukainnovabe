import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/auth/user'
import UserSession from '#models/user_session'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class extends BaseSeeder {
  async run() {
    // Buat user test jika belum ada
    const existingUser = await User.query().where('email', 'admin@test.com').first()
    
    if (!existingUser) {
      const user = await User.create({
        email: 'admin@test.com',
        password: 'password123',
        fullName: 'Admin Test',
        isActive: true,
      })
      
      console.log('User test berhasil dibuat:', user.email)
      
      // Buat session untuk user ini
      await UserSession.create({
        userId: user.id,
        sessionId: crypto.randomBytes(32).toString('hex'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
        isActive: true,
        lastActivity: DateTime.now(),
        loginAt: DateTime.now(),
      })
      
      console.log('Session test berhasil dibuat')
    } else {
      console.log('User test sudah ada:', existingUser.email)
      
      // Buat session baru untuk user yang sudah ada
      await UserSession.create({
        userId: existingUser.id,
        sessionId: crypto.randomBytes(32).toString('hex'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
        isActive: true,
        lastActivity: DateTime.now(),
        loginAt: DateTime.now(),
      })
      
      console.log('Session baru berhasil dibuat untuk user yang sudah ada')
    }
  }
}
