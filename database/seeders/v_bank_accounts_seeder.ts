import { BaseSeeder } from '@adonisjs/lucid/seeders'
import BankAccount from '#models/bank_account'
import User from '#models/auth/user'

export default class extends BaseSeeder {
  async run() {
    // Cari user yang sudah ada untuk digunakan sebagai createdBy dan updatedBy
    const existingUser = await User.first()
    if (!existingUser) {
      console.log('Tidak ada user yang ditemukan. Pastikan user_seeder dijalankan terlebih dahulu.')
      return
    }

    const userId = existingUser.id
    console.log(`Menggunakan user ID: ${userId} untuk createdBy dan updatedBy`)

    // Create test bank accounts
    await BankAccount.createMany([
      {
        bankName: 'Bank Central Asia (BCA)',
        accountNumber: '1234567890',
        accountName: 'Rekening Utama',
        currency: 'IDR',
        openingBalance: 10000000,
        createdBy: userId,
        updatedBy: userId
      },
      {
        bankName: 'Bank Mandiri',
        accountNumber: '0987654321',
        accountName: 'Rekening Operasional',
        currency: 'IDR',
        openingBalance: 5000000,
        createdBy: userId,
        updatedBy: userId
      },
      {
        bankName: 'Bank Negara Indonesia (BNI)',
        accountNumber: '1122334455',
        accountName: 'Rekening Investasi',
        currency: 'IDR',
        openingBalance: 25000000,
        createdBy: userId,
        updatedBy: userId
      }
    ])

    console.log('Bank accounts seeder berhasil dijalankan')
  }
}
