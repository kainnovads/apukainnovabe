import { BaseSeeder } from '@adonisjs/lucid/seeders';
import Perusahaan from '#models/perusahaan';
import Cabang from '#models/cabang';
import Divisi from '#models/divisi';
import Departemen from '#models/departemen';
export default class extends BaseSeeder {
    async run() {
        const perusahaan = await Perusahaan.create({
            nmPerusahaan: 'PT Contoh Sejahtera',
            alamatPerusahaan: 'Jl. Mawar No. 123, Jakarta',
            tlpPerusahaan: '021-1234567',
            emailPerusahaan: 'contoh@sejahtera.com',
            npwpPerusahaan: '01.234.567.8-999.000',
            kodePerusahaan: '001',
            logoPerusahaan: 'logo.png',
        });
        await Cabang.createMany([
            {
                nmCabang: 'Cabang Jakarta',
                alamatCabang: 'Jl. Melati No. 1, Jakarta',
                perusahaanId: perusahaan.id,
                kodeCabang: '001',
            },
            {
                nmCabang: 'Cabang Bandung',
                alamatCabang: 'Jl. Kenanga No. 2, Bandung',
                perusahaanId: perusahaan.id,
                kodeCabang: '002',
            },
        ]);
        const divisiList = await Divisi.createMany([
            { nm_divisi: 'Divisi Keuangan' },
            { nm_divisi: 'Divisi Operasional' },
            { nm_divisi: 'Divisi SDM' },
            { nm_divisi: 'Divisi IT' },
        ]);
        await Departemen.createMany([
            { nm_departemen: 'Departemen Akuntansi', divisi_id: divisiList[0].id },
            { nm_departemen: 'Departemen Produksi', divisi_id: divisiList[1].id },
            { nm_departemen: 'Departemen HRD', divisi_id: divisiList[2].id },
            { nm_departemen: 'Departemen IT', divisi_id: divisiList[3].id },
        ]);
    }
}
//# sourceMappingURL=perusahaan_seder_seeder.js.map