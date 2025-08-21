import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'user_sessions';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.string('session_id').notNullable().unique();
            table.string('ip_address');
            table.text('user_agent');
            table.string('device_type');
            table.boolean('is_active').defaultTo(true);
            table.timestamp('last_activity');
            table.timestamp('login_at');
            table.timestamp('logout_at').nullable();
            table.timestamps();
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1755433696624_create_create_user_sessions_table.js.map