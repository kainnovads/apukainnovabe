import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'assets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('asset_code').unique().notNullable()
      table.string('name').notNullable()
      table.string('category').notNullable()
      table.date('acquisition_date').notNullable()
      table.decimal('acquisition_cost', 15, 2).notNullable()
      table.integer('useful_life').notNullable()
      table.string('depreciation_method').defaultTo('straight_line')
      table.decimal('residual_value', 15, 2).defaultTo(0)
      table.boolean('is_active').defaultTo(true)
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