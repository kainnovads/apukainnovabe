import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'sales_return_items';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table
                .uuid('sales_order_item_id')
                .references('id')
                .inTable('sales_order_items')
                .onDelete('SET NULL')
                .nullable()
                .after('sales_return_id');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('sales_order_item_id');
        });
    }
}
//# sourceMappingURL=1751205298828_create_add_sales_order_item_id_to_sales_return_items_table.js.map