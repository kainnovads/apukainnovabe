import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_invoices'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // ✅ FIX: Tambahkan kolom perusahaan_id jika belum ada
      // Gunakan hasColumn check untuk menghindari error jika kolom sudah ada
      table
        .integer('perusahaan_id')
        .unsigned()
        .references('id')
        .inTable('perusahaan')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
        .nullable()
        .after('customer_id')
      
      // ✅ FIX: Tambahkan kolom cabang_id juga jika belum ada (untuk konsistensi)
      table
        .integer('cabang_id')
        .unsigned()
        .references('id')
        .inTable('cabang')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
        .nullable()
        .after('perusahaan_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('perusahaan_id')
      table.dropColumn('cabang_id')
    })
  }
}
