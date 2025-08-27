import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Warehouse from '#models/warehouse'

export default class extends BaseSeeder {
  public async run() {
    const warehouses = [
      {
        name: 'Gudang Utama',
        code: 'GU-001',
        address: 'Jl. Gudang Utama No. 1, Jakarta',
        phone: '021-1234567',
        email: 'gudang@example.com',
        isActive: true,
      },
      {
        name: 'Gudang Cabang',
        code: 'GC-001',
        address: 'Jl. Gudang Cabang No. 1, Bandung',
        phone: '022-1234567',
        email: 'gudang.cabang@example.com',
        isActive: true,
      },
    ]

    for (const warehouseData of warehouses) {
      await Warehouse.create(warehouseData)
    }
  }
}
