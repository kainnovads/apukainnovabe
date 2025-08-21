import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'products';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('name').notNullable();
            table.string('sku').notNullable().unique();
            table.decimal('stock_min', 12, 2).defaultTo(0);
            table.decimal('price_buy', 14, 2).defaultTo(0);
            table.decimal('price_sell', 14, 2).defaultTo(0);
            table.boolean('is_service').defaultTo(false);
            table.string('image').nullable();
            table.integer('berat').nullable();
            table.enum('kondisi', ['baru', 'bekas', 'rusak', 'servis']).notNullable().defaultTo('baru');
            table.integer('unit_id').unsigned().references('id').inTable('units').onDelete('CASCADE').onUpdate('CASCADE');
            table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('CASCADE').onUpdate('CASCADE');
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1749453720540_create_products_table.js.map