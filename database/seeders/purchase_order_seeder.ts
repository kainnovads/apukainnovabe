import { BaseSeeder } from '@adonisjs/lucid/seeders'
import PurchaseOrder from '#models/purchase_order'
import PurchaseOrderItem from '#models/purchase_order_item'
import Vendor from '#models/vendor'
import Product from '#models/product'
import User from '#models/auth/user'
import Perusahaan from '#models/perusahaan'
import Cabang from '#models/cabang'

export default class extends BaseSeeder {
  public async run() {
    // Ambil data yang sudah ada
    const vendors = await Vendor.all()
    const products = await Product.all()
    const users = await User.all()
    const perusahaan = await Perusahaan.first()
    const cabang = await Cabang.first()

    if (vendors.length > 0 && products.length > 0 && users.length > 0 && perusahaan && cabang) {
      // Buat beberapa purchase order
      for (let i = 1; i <= 3; i++) {
        const po = await PurchaseOrder.create({
          vendorId: vendors[0].id,
          perusahaanId: perusahaan.id,
          cabangId: cabang.id,
          noPo: `PO-${String(i).padStart(4, '0')}/2024`,
          up: 'Untuk Perhatian',
          date: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 hari dari sekarang
          status: 'approved',
          poType: 'internal',
          discountPercent: 5,
          taxPercent: 11,
          total: 0, // Akan dihitung setelah items
          createdBy: users[0].id,
          approvedBy: users[0].id,
          approvedAt: new Date(),
          description: `Purchase Order ${i} untuk testing`,
        })

        // Buat items untuk setiap PO
        let totalPO = 0
        for (let j = 0; j < Math.min(3, products.length); j++) {
          const product = products[j]
          const quantity = Math.floor(Math.random() * 5) + 1
          const price = product.priceBuy
          const subtotal = quantity * price
          totalPO += subtotal

          await PurchaseOrderItem.create({
            purchaseOrderId: po.id,
            productId: product.id,
            warehouseId: 1, // Default warehouse
            quantity: quantity,
            price: price,
            description: `Item ${j + 1} untuk ${product.name}`,
            subtotal: subtotal,
            statusPartial: false,
            receivedQty: 0,
          })
        }

        // Update total PO
        const discount = totalPO * (po.discountPercent / 100)
        const afterDiscount = totalPO - discount
        const tax = afterDiscount * (po.taxPercent / 100)
        const finalTotal = afterDiscount + tax

        await po.merge({ total: finalTotal }).save()
      }
    }
  }
}
