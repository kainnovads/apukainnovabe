import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'menu_group_permission';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('menu_group_id')
                .unsigned()
                .references('id')
                .inTable('menu_group')
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
//# sourceMappingURL=1747018610098_create_menu_groups_permission_table.js.map