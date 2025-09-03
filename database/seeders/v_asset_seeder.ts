import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
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

    // Insert sample assets data
    await db.table('assets').multiInsert([
      {
        id: randomUUID(),
        assetCode: 'AST-001',
        name: 'Laptop Dell XPS 13',
        category: 'computer',
        acquisitionDate: '2024-01-15',
        acquisitionCost: 15000000,
        usefulLife: 3,
        depreciationMethod: 'straight_line',
        residualValue: 3000000,
        isActive: true,
        location: 'Kantor Pusat',
        description: 'Laptop untuk development team',
        serialNumber: 'DLXPS13-2024-001',
        warrantyExpiry: '2027-01-15',
        supplier: 'PT Dell Indonesia',
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        assetCode: 'AST-002',
        name: 'Mobil Toyota Avanza',
        category: 'vehicle',
        acquisitionDate: '2023-06-01',
        acquisitionCost: 250000000,
        usefulLife: 5,
        depreciationMethod: 'straight_line',
        residualValue: 50000000,
        isActive: true,
        location: 'Kantor Cabang Jakarta',
        description: 'Kendaraan operasional',
        serialNumber: 'TOY-2023-002',
        warrantyExpiry: '2026-06-01',
        supplier: 'PT Toyota Astra Motor',
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        assetCode: 'AST-003',
        name: 'Printer HP LaserJet',
        category: 'equipment',
        acquisitionDate: '2024-03-01',
        acquisitionCost: 5000000,
        usefulLife: 4,
        depreciationMethod: 'straight_line',
        residualValue: 1000000,
        isActive: true,
        location: 'Kantor Pusat',
        description: 'Printer untuk keperluan kantor',
        serialNumber: 'HPLJ-2024-003',
        warrantyExpiry: '2026-03-01',
        supplier: 'PT HP Indonesia',
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])

    console.log('Asset seeder berhasil dijalankan')
  }
}