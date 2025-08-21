import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'sales_invoices';
    async up() {
        await this.raw(`
      UPDATE ${this.tableName}
      SET customer_id = NULL
      WHERE customer_id IS NULL OR customer_id = 0
    `);
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('customer_id').nullable().alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('customer_id').notNullable().alter();
        });
    }
}
//# sourceMappingURL=fix_sales_invoice_nullable_fields.js.map