import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'sales_orders';
    async up() {
        await this.raw(`
      UPDATE ${this.tableName}
      SET customer_id = NULL
      WHERE customer_id IS NULL OR customer_id = 0
    `);
        await this.raw(`
      UPDATE ${this.tableName}
      SET perusahaan_id = NULL
      WHERE perusahaan_id IS NULL OR perusahaan_id = 0
    `);
        await this.raw(`
      UPDATE ${this.tableName}
      SET cabang_id = NULL
      WHERE cabang_id IS NULL OR cabang_id = 0
    `);
        await this.raw(`
      UPDATE ${this.tableName}
      SET created_by = NULL
      WHERE created_by IS NULL OR created_by = 0
    `);
        await this.raw(`
      UPDATE ${this.tableName}
      SET approved_by = NULL
      WHERE approved_by IS NULL OR approved_by = 0
    `);
        await this.raw(`
      UPDATE ${this.tableName}
      SET rejected_by = NULL
      WHERE rejected_by IS NULL OR rejected_by = 0
    `);
        await this.raw(`
      UPDATE ${this.tableName}
      SET delivered_by = NULL
      WHERE delivered_by IS NULL OR delivered_by = 0
    `);
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('customer_id').nullable().alter();
            table.integer('perusahaan_id').nullable().alter();
            table.integer('cabang_id').nullable().alter();
            table.integer('created_by').nullable().alter();
            table.integer('approved_by').nullable().alter();
            table.integer('rejected_by').nullable().alter();
            table.integer('delivered_by').nullable().alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('customer_id').notNullable().alter();
            table.integer('perusahaan_id').notNullable().alter();
            table.integer('cabang_id').notNullable().alter();
            table.integer('created_by').notNullable().alter();
            table.integer('approved_by').notNullable().alter();
            table.integer('rejected_by').notNullable().alter();
            table.integer('delivered_by').notNullable().alter();
        });
    }
}
//# sourceMappingURL=fix_sales_order_nullable_fields.js.map