import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expenses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('expense_number').unique().notNullable()
      table.date('date').notNullable()
      table.integer('departemen_id').unsigned().references('id').inTable('departemen')
      table.decimal('amount', 15, 2).notNullable()
      table.string('payment_method').nullable()
      table.uuid('bank_account_id').notNullable().references('id').inTable('bank_accounts')
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