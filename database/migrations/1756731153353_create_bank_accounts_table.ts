import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bank_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('bank_name').notNullable()
      table.string('account_number').notNullable().unique()
      table.string('account_name').notNullable()
      table.string('currency').defaultTo('IDR')
      table.decimal('opening_balance', 15, 2).defaultTo(0)
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}