import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'surat_jalans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('no_surat_jalan').notNullable()
      table.uuid('sales_order_id').references('id').inTable('sales_orders').onDelete('SET NULL').onUpdate('CASCADE').nullable()
      table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('CASCADE').onUpdate('CASCADE')
      table.date('date').notNullable()
      table.text('description').nullable()
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
