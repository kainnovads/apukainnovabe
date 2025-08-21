import Jabatan from '#models/jabatan';
import { createJabatanValidator } from '#validators/jabatan';
import db from '@adonisjs/lucid/services/db';
export default class JabatansController {
    async index({ request, response }) {
        try {
            const page = request.input('page', 1);
            const limit = request.input('rows', 10);
            const search = request.input('search', '');
            const searchValue = search || request.input('search.value', '');
            let dataQuery = Jabatan.query();
            if (searchValue) {
                const lowerSearch = searchValue.toLowerCase();
                dataQuery = dataQuery.where((query) => {
                    query
                        .whereRaw('LOWER(nm_jabatan) LIKE ?', [`%${lowerSearch}%`]);
                });
            }
            const jabatans = await dataQuery.paginate(page, limit);
            return response.ok(jabatans.toJSON());
        }
        catch (error) {
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil data jabatan',
                error,
            });
        }
    }
    async show({ params, response }) {
        try {
            const jabatan = await Jabatan.find(params.id);
            if (!jabatan) {
                return response.notFound({ message: 'Jabatan tidak ditemukan' });
            }
            return response.ok(jabatan);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil detail jabatan',
                error: error.message,
            });
        }
    }
    async store({ request, response }) {
        try {
            const payload = await request.validateUsing(createJabatanValidator);
            const jabatan = await Jabatan.create({
                nm_jabatan: payload.nm_jabatan,
            });
            return response.created(jabatan);
        }
        catch (error) {
            return response.badRequest({
                message: 'Gagal membuat jabatan',
                error: error.messages || error.message,
            });
        }
    }
    async update({ params, request, response }) {
        try {
            const jabatan = await Jabatan.find(params.id);
            if (!jabatan) {
                return response.notFound({ message: 'Jabatan tidak ditemukan' });
            }
            const payload = await request.validateUsing(createJabatanValidator);
            jabatan.merge({
                nm_jabatan: payload.nm_jabatan,
            });
            await jabatan.save();
            return response.ok(jabatan);
        }
        catch (error) {
            return response.badRequest({
                message: 'Gagal memperbarui jabatan',
                error: error.messages || error.message,
            });
        }
    }
    async destroy({ params, response }) {
        try {
            const jabatan = await Jabatan.find(params.id);
            if (!jabatan) {
                return response.notFound({ message: 'Jabatan tidak ditemukan' });
            }
            await jabatan.delete();
            return response.ok({ message: 'Jabatan berhasil dihapus' });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal menghapus jabatan',
                error: error.message,
            });
        }
    }
    async countPegawaiByJabatan({ response }) {
        try {
            const jabatanList = [
                'Direktur Utama',
                'Direktur Keuangan',
                'Direktur Operasional',
                'General Manager'
            ];
            const counts = {};
            for (const nama of jabatanList) {
                const jabatan = await Jabatan.query().where('nm_jabatan', nama).first();
                if (jabatan) {
                    const total = await db
                        .from('pegawai_history')
                        .where('jabatan_id', jabatan.id_jabatan)
                        .count('* as total')
                        .first();
                    counts[nama
                        .toLowerCase()
                        .replace(/\s+/g, '_')] = Number(total?.total || 0);
                }
                else {
                    counts[nama
                        .toLowerCase()
                        .replace(/\s+/g, '_')] = 0;
                }
            }
            const totalSeluruh = await db
                .from('pegawai_history')
                .countDistinct('pegawai_id as total')
                .first();
            return response.ok({
                ...counts,
                total: Number(totalSeluruh?.total || 0)
            });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal menghitung total pegawai per jabatan',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=jabatans_controller.js.map