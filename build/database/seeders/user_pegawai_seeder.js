import { BaseSeeder } from '@adonisjs/lucid/seeders';
import User from '#models/auth/user';
import Role from '#models/auth/role';
import Pegawai from '#models/pegawai';
import { DateTime } from 'luxon';
export default class extends BaseSeeder {
    async run() {
        let role = await Role.find(1);
        if (!role) {
            role = await Role.create({
                id: 1,
                name: 'superadmin',
            });
        }
        const user = await User.create({
            username: 'rifqiaria95',
            fullName: 'Rifqi Aria',
            email: 'rifqiaria95@gmail.com',
            password: 'password123',
            isActive: true,
        });
        await user.related('roles').attach([role.id]);
        await Pegawai.create({
            nm_pegawai: 'Rifqi Aria',
            tgl_lahir_pegawai: DateTime.fromISO('1990-01-01'),
            tmp_lahir_pegawai: 'Jakarta',
            no_tlp_pegawai: '081234567890',
            pendidikan_pegawai: 3,
            alamat_pegawai: 'Jl. Contoh No. 1',
            status_pegawai: 1,
            no_ktp_pegawai: '1234567890123456',
            nik_pegawai: '3201010101010001',
            npwp_pegawai: '12.345.678.9-012.345',
            jenis_kelamin_pegawai: 1,
            tgl_masuk_pegawai: DateTime.fromISO('2020-01-01'),
            tgl_keluar_pegawai: null,
            istri_suami_pegawai: null,
            anak_1: null,
            anak_2: null,
            avatar: null,
            user_id: user.id,
        });
        console.log(`User ${user.email} berhasil dibuat dengan role: ${role.name}`);
    }
}
//# sourceMappingURL=user_pegawai_seeder.js.map