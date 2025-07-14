import Unit from '#models/unit'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await Unit.createMany([
      {
        name: 'Liter',
        symbol: 'l',
      },
      {
        name: 'Pcs',
        symbol: 'Pcs',
      },
      {
        name: 'Set',
        symbol: 'Set',
      },
      {
        name: 'Lusin',
        symbol: 'Lusin',
      },
      {
        name: 'Kg',
        symbol: 'Kg',
      }
    ])
  }
}