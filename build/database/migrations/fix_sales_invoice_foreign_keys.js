import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'sales_invoice_items';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign(['sales_order_item_id']);
            table.dropForeign(['product_id']);
            table.dropForeign(['warehouse_id']);
        });
        this.schema.alterTable(this.tableName, (table) => {
            table.foreign('sales_order_item_id').references('id').inTable('sales_order_items').onDelete('SET NULL');
            table.foreign('product_id').references('id').inTable('products').onDelete('RESTRICT');
            table.foreign('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign(['sales_order_item_id']);
            table.dropForeign(['product_id']);
            table.dropForeign(['warehouse_id']);
        });
        this.schema.alterTable(this.tableName, (table) => {
            table.foreign('sales_order_item_id').references('id').inTable('sales_order_items').onDelete('CASCADE');
            table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
            table.foreign('warehouse_id').references('id').inTable('warehouses').onDelete('CASCADE');
        });
    }
}
//# sourceMappingURL=fix_sales_invoice_foreign_keys.js.map