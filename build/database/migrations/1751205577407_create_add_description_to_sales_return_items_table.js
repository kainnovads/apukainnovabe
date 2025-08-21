import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'sales_return_items';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('description').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('description');
        });
    }
}
//# sourceMappingURL=1751205577407_create_add_description_to_sales_return_items_table.js.map