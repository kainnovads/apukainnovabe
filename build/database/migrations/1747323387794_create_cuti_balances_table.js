import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'cuti_balance';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('tahun').notNullable();
            table.integer('sisa_jatah_cuti').notNullable().defaultTo(0);
            table.integer('cuti_terpakai').notNullable().defaultTo(0);
            table.integer('sisa_cuti_tahun_lalu').defaultTo(0);
            table.date('valid_sampai').nullable();
            table
                .integer('pegawai_id')
                .unsigned()
                .references('id_pegawai')
                .inTable('pegawai')
                .onDelete('CASCADE');
            table
                .integer('cuti_type_id')
                .unsigned()
                .references('id')
                .inTable('cuti_type')
                .onDelete('CASCADE');
            table.unique(['pegawai_id', 'cuti_type_id', 'tahun']);
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1747323387794_create_cuti_balances_table.js.map