import { BaseSeeder } from '@adonisjs/lucid/seeders';
import Kategori from '#models/category';
export default class KategoriSeeder extends BaseSeeder {
    async run() {
        await Kategori.createMany([
            {
                name: 'Oli',
                description: 'Kategori 1',
            },
            {
                name: 'Ban',
                description: 'Kategori 2',
            },
            {
                name: 'Spare Part',
                description: 'Kategori 3',
            },
            {
                name: 'Aksesoris',
                description: 'Kategori 4',
            },
        ]);
    }
}
//# sourceMappingURL=kategori_seeder.js.map