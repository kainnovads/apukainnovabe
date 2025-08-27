import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import Customer from '#models/customer'
import ProductCustomer from '#models/product_customer'

export default class extends BaseSeeder {
  public async run() {
    // Ambil data yang sudah ada
    const products = await Product.all()
    const customers = await Customer.all()

    if (products.length > 0 && customers.length > 0) {
      // Buat product customer untuk setiap kombinasi product dan customer
      for (const product of products) {
        for (const customer of customers) {
          // Harga jual customer biasanya lebih tinggi dari harga beli
          const priceSell = product.priceBuy * (1 + Math.random() * 0.5 + 0.2) // 20-70% markup
          
          await ProductCustomer.create({
            productId: product.id,
            customerId: customer.id,
            priceSell: Math.round(priceSell),
          })
        }
      }
    }
  }
}
