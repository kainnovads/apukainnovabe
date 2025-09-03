import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('no_invoice').notNullable()
      table.string('up').notNullable()
      table.string('email').notNullable()
      table.enum('payment_method', ['cash', 'transfer', 'qris', 'card']).notNullable()
      table.uuid('purchase_order_id').references('id').inTable('purchase_orders').onDelete('SET NULL').onUpdate('CASCADE').nullable()
      table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('SET NULL').onUpdate('CASCADE').nullable()
      table.integer('perusahaan_id').unsigned().references('id').inTable('perusahaan').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('cabang_id').unsigned().references('id').inTable('cabang').onDelete('CASCADE').onUpdate('CASCADE')
      table.date('payment_date').notNullable()
      table.decimal('discount_percent', 5, 2).defaultTo(0)
      table.decimal('tax_percent', 5, 2).defaultTo(0)
      table.decimal('dpp', 14, 2).defaultTo(0)
      table.decimal('total', 14, 2).notNullable()
      table.decimal('paid_amount', 14, 2).defaultTo(0)
      table.decimal('remaining_amount', 14, 2).defaultTo(0)
      table.enum('status', ['unpaid', 'partial', 'paid']).defaultTo('unpaid')
      table.text('description').nullable()
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE').nullable()
      table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}