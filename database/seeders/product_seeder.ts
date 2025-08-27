import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import Category from '#models/category'
import Unit from '#models/unit'

export default class extends BaseSeeder {
  public async run() {
    // Ambil data yang sudah ada
    const categories = await Category.all()
    const units = await Unit.all()

    if (categories.length > 0 && units.length > 0) {
      const sampleProducts = [
        {
          name: 'Laptop Asus ROG',
          sku: 'LAP-ASUS-001',
          unitId: units[0].id,
          categoryId: categories[0].id,
          stockMin: 5,
          priceBuy: 15000000,
          priceSell: 18000000,
          isService: false,
          image: 'laptop-asus.jpg',
          kondisi: 'baru',
          berat: 2.5,
        },
        {
          name: 'Mouse Gaming',
          sku: 'MOU-GAM-001',
          unitId: units[0].id,
          categoryId: categories[0].id,
          stockMin: 10,
          priceBuy: 500000,
          priceSell: 750000,
          isService: false,
          image: 'mouse-gaming.jpg',
          kondisi: 'baru',
          berat: 0.2,
        },
        {
          name: 'Keyboard Mechanical',
          sku: 'KEY-MEC-001',
          unitId: units[0].id,
          categoryId: categories[0].id,
          stockMin: 8,
          priceBuy: 1200000,
          priceSell: 1500000,
          isService: false,
          image: 'keyboard-mechanical.jpg',
          kondisi: 'baru',
          berat: 1.2,
        },
        {
          name: 'Monitor 24 inch',
          sku: 'MON-24-001',
          unitId: units[0].id,
          categoryId: categories[0].id,
          stockMin: 3,
          priceBuy: 2500000,
          priceSell: 3000000,
          isService: false,
          image: 'monitor-24.jpg',
          kondisi: 'baru',
          berat: 3.5,
        },
        {
          name: 'Headset Gaming',
          sku: 'HEA-GAM-001',
          unitId: units[0].id,
          categoryId: categories[0].id,
          stockMin: 15,
          priceBuy: 800000,
          priceSell: 1200000,
          isService: false,
          image: 'headset-gaming.jpg',
          kondisi: 'baru',
          berat: 0.4,
        },
      ]

      for (const productData of sampleProducts) {
        await Product.create(productData)
      }
    }
  }
}
