import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Seeder akan dijalankan setelah sales invoices dan sales order items dibuat
    // Ini adalah sample data untuk sales invoice items

    // NOTE: Currently disabled as this requires existing sales invoices and sales order items
    // Uncomment and modify the data below when ready to use

    /*
    const sampleInvoiceItems = [
      // Sample items untuk invoice pertama
      {
        salesInvoiceId: 'sample-invoice-id-1', // Sesuaikan dengan ID invoice yang ada
        salesOrderItemId: 'sample-so-item-id-1', // Sesuaikan dengan ID sales order item yang ada
        productId: 1, // Product ID yang ada
        warehouseId: 1, // Warehouse ID yang ada
        quantity: 10,
        price: 50000,
        subtotal: 500000,
        description: 'Sample product 1 description',
        deliveredQty: 10,
        isReturned: false,
      },
      {
        salesInvoiceId: 'sample-invoice-id-1',
        salesOrderItemId: 'sample-so-item-id-2',
        productId: 2,
        warehouseId: 1,
        quantity: 5,
        price: 100000,
        subtotal: 500000,
        description: 'Sample product 2 description',
        deliveredQty: 5,
        isReturned: false,
      },
      // Sample items untuk invoice kedua
      {
        salesInvoiceId: 'sample-invoice-id-2',
        salesOrderItemId: 'sample-so-item-id-3',
        productId: 3,
        warehouseId: 2,
        quantity: 15,
        price: 75000,
        subtotal: 1125000,
        description: 'Sample product 3 description',
        deliveredQty: 15,
        isReturned: false,
      },
    ]
    */

    console.log('✅ Sales Invoice Items seeder completed (sample data commented out)')
  }
}
