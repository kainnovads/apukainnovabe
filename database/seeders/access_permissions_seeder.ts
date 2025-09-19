import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Permission from '#models/auth/permission'

export default class extends BaseSeeder {
  async run() {
    // Access Permissions - untuk akses data API tanpa menu
    const accessPermissions = [
      // Sales & Orders
      { name: 'access_sales_order' },
      { name: 'access_sales_invoice' },
      { name: 'access_surat_jalan' },
      { name: 'access_sales_return' },
      { name: 'access_quotation' },
      
      // Purchase & Inventory
      { name: 'access_purchase_order' },
      { name: 'access_purchase_invoice' },
      { name: 'access_stock_in' },
      { name: 'access_stock_out' },
      { name: 'access_stock_transfer' },
      { name: 'access_stock' },
      
      // Master Data
      { name: 'access_perusahaan' },
      { name: 'access_cabang' },
      { name: 'access_warehouse' },
      { name: 'access_product' },
      { name: 'access_customer' },
      { name: 'access_vendor' },
      { name: 'access_departemen' },
      { name: 'access_jabatan' },
      { name: 'access_pegawai' },
      
      // HR
      { name: 'access_cuti' },
      
      // Finance (jika diperlukan)
      { name: 'access_bank_account' },
      { name: 'access_tax' },
      { name: 'access_expenses' },
      { name: 'access_ap_payment' },
      { name: 'access_ar_receipt' },
      { name: 'access_asset' },
      { name: 'access_account' },
      { name: 'access_journal' },
    ]

    // Insert permissions
    for (const permission of accessPermissions) {
      await Permission.updateOrCreate(
        { name: permission.name },
        {
          name: permission.name,
        }
      )
    }

    console.log('✅ Access permissions seeded successfully!')
  }
}
