import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ap_payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.integer('vendor_id').unsigned().references('id').inTable('vendors')
      table.uuid('purchase_invoice_id').nullable().references('id').inTable('purchase_invoices')
      table.uuid('bank_account_id').nullable().references('id').inTable('bank_accounts')
      table.string('payment_number').unique().notNullable()
      table.date('date').notNullable()
      table.decimal('amount', 15, 2).notNullable()
      table.string('method').notNullable()
      table.text('description').nullable()
      table.integer('created_by').unsigned().references('id').inTable('users')
      table.integer('updated_by').unsigned().references('id').inTable('users')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}