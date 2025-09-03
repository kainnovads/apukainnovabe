import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('code').unique().notNullable()       // misal 1-1001
      table.string('name').notNullable()                // Kas Besar
      table.enum('category', ['asset', 'liability', 'equity', 'revenue', 'expense']).notNullable()
      table.enum('normal_balance', ['debit', 'credit']).notNullable()
      table.boolean('is_parent').defaultTo(false)
      table.uuid('parent_id').nullable().references('id').inTable('accounts').onDelete('SET NULL')
      table.integer('level').defaultTo(1)
      
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}