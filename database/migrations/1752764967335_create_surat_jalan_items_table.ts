import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'surat_jalan_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('surat_jalan_id').references('id').inTable('surat_jalans').onDelete('CASCADE')
      table.uuid('sales_order_item_id').references('id').inTable('sales_order_items').onDelete('CASCADE')
      table.integer('product_id').references('id').inTable('products').onDelete('CASCADE')
      table.integer('warehouse_id').references('id').inTable('warehouses').onDelete('CASCADE').nullable()
      table.integer('quantity').notNullable()
      table.text('description').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Indexes untuk performance
      table.index(['surat_jalan_id'])
      table.index(['sales_order_item_id'])
      table.index(['product_id'])
      table.index(['warehouse_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}