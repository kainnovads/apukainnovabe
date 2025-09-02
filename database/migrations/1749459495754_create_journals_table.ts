import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'journals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('journal_number').unique().notNullable()  // Nomor jurnal
      table.date('date').notNullable()
      table.string('description').notNullable()
      table.enum('status', ['draft', 'posted', 'cancelled']).defaultTo('draft')
      table.string('reference_type').nullable()  // sales_invoice, purchase_invoice, expense, etc
      table.string('reference_id').nullable()    // ID dari referensi
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}