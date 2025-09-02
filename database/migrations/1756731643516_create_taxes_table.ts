import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'taxes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('name').notNullable()
      table.string('code').unique().notNullable()
      table.decimal('rate', 5, 2).notNullable()
      table.enum('type', ['ppn', 'pph', 'lainnya']).notNullable()
      table.integer('created_by').unsigned().references('id').inTable('users')
      table.integer('updated_by').unsigned().references('id').inTable('users')
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}