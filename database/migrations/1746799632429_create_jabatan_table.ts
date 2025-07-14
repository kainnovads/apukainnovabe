import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'jabatan'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_jabatan')
      table.string('nm_jabatan').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
