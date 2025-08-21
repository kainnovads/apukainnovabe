import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'sales_return_items';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('sales_return_id').references('id').inTable('sales_returns').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
            table.integer('warehouse_id').unsigned().references('id').inTable('warehouses').onDelete('SET NULL').nullable();
            table.integer('quantity').notNullable();
            table.decimal('price', 15, 2).notNullable();
            table.string('reason').nullable();
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1751096879821_create_sales_return_items_table.js.map