import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_invoice_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('purchase_invoice_id').references('id').inTable('purchase_invoices').onDelete('CASCADE').onUpdate('CASCADE')
      table.uuid('purchase_order_item_id').references('id').inTable('purchase_order_items').onDelete('SET NULL').onUpdate('CASCADE').nullable()
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('RESTRICT').onUpdate('CASCADE')
      table.integer('warehouse_id').unsigned().references('id').inTable('warehouses').onDelete('SET NULL').onUpdate('CASCADE').nullable()
      table.integer('quantity').notNullable()
      table.decimal('price', 15, 2).notNullable()
      table.decimal('subtotal', 15, 2).notNullable()
      table.text('description').nullable()
      table.integer('received_qty').defaultTo(0)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Indexes untuk performance
      table.index(['purchase_invoice_id'])
      table.index(['purchase_order_item_id'])
      table.index(['product_id'])
      table.index(['warehouse_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}