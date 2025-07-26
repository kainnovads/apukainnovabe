import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quotation_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('quotation_id').references('id').inTable('quotations').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE').onUpdate('CASCADE')
      table.decimal('quantity', 12, 2).notNullable()
      table.decimal('price', 14, 2).notNullable()
      table.decimal('subtotal', 14, 2).notNullable()
      table.text('description').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}