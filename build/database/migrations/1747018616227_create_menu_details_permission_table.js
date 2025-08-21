import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'menu_detail_permission';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('menu_detail_id')
                .unsigned()
                .references('id')
                .inTable('menu_detail')
                .onDelete('CASCADE');
            table
                .integer('permission_id')
                .unsigned()
                .references('id')
                .inTable('permissions')
                .onDelete('CASCADE');
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1747018616227_create_menu_details_permission_table.js.map