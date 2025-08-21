import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'product_customers';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('customer_id').unsigned().notNullable().references('id').inTable('customers').onDelete('CASCADE');
            table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
            table.decimal('price_sell', 15, 2).notNullable();
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1750124960868_create_product_customers_table.js.map