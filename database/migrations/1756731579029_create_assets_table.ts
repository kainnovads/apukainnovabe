import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'assets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('assetCode').unique().notNullable()
      table.string('name').notNullable()
      table.string('category').notNullable()
      table.date('acquisitionDate').notNullable()
      table.decimal('acquisitionCost', 15, 2).notNullable()
      table.integer('usefulLife').notNullable()
      table.string('depreciationMethod').defaultTo('straight_line')
      table.decimal('residualValue', 15, 2).defaultTo(0)
      table.enum('status', ['active', 'inactive', 'sold', 'trashed']).defaultTo('active')
      table.string('location').notNullable()
      table.text('description')
      table.string('serialNumber')
      table.date('warrantyExpiry')
      table
        .integer('perusahaan_id')
        .unsigned()
        .references('id')
        .inTable('perusahaan')
        .onDelete('CASCADE')
      table
        .integer('cabang_id')
        .unsigned()
        .references('id')
        .inTable('cabang')
        .onDelete('CASCADE')
      table
        .integer('vendor_id')
        .unsigned()
        .references('id')
        .inTable('vendors')
        .onDelete('CASCADE')
      table.integer('createdBy').unsigned().references('id').inTable('users')
      table.integer('updatedBy').unsigned().references('id').inTable('users')
      table.timestamp('createdAt')
      table.timestamp('updatedAt')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}