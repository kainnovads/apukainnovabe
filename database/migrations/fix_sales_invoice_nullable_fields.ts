import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_invoices'

  async up() {
    // Update undefined/null foreign keys to proper null values
    await this.raw(`
      UPDATE ${this.tableName}
      SET customer_id = NULL
      WHERE customer_id IS NULL OR customer_id = 0
    `)

    // Make sure foreign key columns are properly nullable
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('customer_id').nullable().alter()
    })
  }

  async down() {
    // Revert changes if needed
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('customer_id').notNullable().alter()
    })
  }
}
