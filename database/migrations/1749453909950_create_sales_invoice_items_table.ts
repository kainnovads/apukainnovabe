import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_invoice_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('sales_invoice_id').references('id').inTable('sales_invoices').onDelete('CASCADE')
      table.uuid('sales_order_item_id').references('id').inTable('sales_order_items').onDelete('CASCADE')
      table.integer('product_id').references('id').inTable('products').onDelete('CASCADE')
      table.integer('warehouse_id').references('id').inTable('warehouses').onDelete('CASCADE').nullable()
      table.integer('quantity').notNullable()
      table.decimal('price', 15, 2).notNullable()
      table.decimal('subtotal', 15, 2).notNullable()
      table.text('description').nullable()
      table.integer('delivered_qty').defaultTo(0)
      table.boolean('is_returned').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Indexes untuk performance
      table.index(['sales_invoice_id'])
      table.index(['sales_order_item_id'])
      table.index(['product_id'])
      table.index(['warehouse_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
