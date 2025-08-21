import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'sales_returns';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.uuid('id').primary();
            table.string('no_sr').notNullable();
            table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('perusahaan_id').unsigned().references('id').inTable('perusahaan').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('cabang_id').unsigned().references('id').inTable('cabang').onDelete('CASCADE').onUpdate('CASCADE');
            table.uuid('sales_order_id').references('id').inTable('sales_orders').onDelete('CASCADE').onUpdate('CASCADE');
            table.date('return_date').notNullable();
            table.enum('status', ['draft', 'approved', 'rejected']).defaultTo('draft');
            table.decimal('total_return_amount', 14, 2).notNullable();
            table.text('description').nullable();
            table.string('attachment').nullable();
            table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('approved_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('rejected_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE');
            table.timestamp('approved_at').nullable();
            table.timestamp('rejected_at').nullable();
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1751096837799_create_sales_returns_table.js.map