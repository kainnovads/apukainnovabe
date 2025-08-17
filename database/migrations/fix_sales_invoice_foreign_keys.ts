import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_invoice_items'

  async up() {
    // Drop existing foreign key constraints
    this.schema.alterTable(this.tableName, (table) => {
      // Drop existing foreign keys
      table.dropForeign(['sales_order_item_id'])
      table.dropForeign(['product_id'])
      table.dropForeign(['warehouse_id'])
    })

    // Recreate foreign key constraints with better settings
    this.schema.alterTable(this.tableName, (table) => {
      // Add foreign keys with better constraints
      table.foreign('sales_order_item_id').references('id').inTable('sales_order_items').onDelete('SET NULL')
      table.foreign('product_id').references('id').inTable('products').onDelete('RESTRICT')
      table.foreign('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL')
    })
  }

  async down() {
    // Revert changes
    this.schema.alterTable(this.tableName, (table) => {
      // Drop the new foreign keys
      table.dropForeign(['sales_order_item_id'])
      table.dropForeign(['product_id'])
      table.dropForeign(['warehouse_id'])
    })

    // Recreate original foreign keys
    this.schema.alterTable(this.tableName, (table) => {
      table.foreign('sales_order_item_id').references('id').inTable('sales_order_items').onDelete('CASCADE')
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')
      table.foreign('warehouse_id').references('id').inTable('warehouses').onDelete('CASCADE')
    })
  }
}
