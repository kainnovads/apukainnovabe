import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quotations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('CASCADE').onUpdate('CASCADE').notNullable()
      table.integer('perusahaan_id').unsigned().references('id').inTable('perusahaan').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('cabang_id').unsigned().references('id').inTable('cabang').onDelete('CASCADE').onUpdate('CASCADE')
      table.string('no_quotation').notNullable().unique()
      table.string('up').notNullable()
      table.date('date').notNullable()
      table.date('ship_date').nullable()
      table.date('valid_until').notNullable()
      table.enum('status', ['draft', 'approved', 'rejected']).defaultTo('draft')
      table.decimal('total', 14, 2).notNullable()
      table.decimal('discount_percent', 5, 2).defaultTo(0).notNullable()
      table.decimal('tax_percent', 5, 2).defaultTo(0).notNullable()
      table.text('description').nullable()
      table.string('pr_number').nullable()
      table.string('fob_point').nullable()
      table.string('terms_of_payment').nullable()
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('approved_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('rejected_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE')
      table.timestamp('approved_at').nullable()
      table.timestamp('rejected_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}