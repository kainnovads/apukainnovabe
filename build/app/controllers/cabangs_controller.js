import Cabang from '#models/cabang';
import { cabangValidator } from '#validators/perusahaan_cabang';
export default class CabangsController {
    async index({ request, response }) {
        try {
            const page = request.input('page', 1);
            const limit = request.input('rows', 10);
            const search = request.input('search', '');
            const searchValue = search || request.input('search.value', '');
            const perusahaanId = request.input('perusahaan_id');
            const sortField = request.input('sortField', 'nmCabang');
            const sortOrder = request.input('sortOrder', 'asc');
            let dataQuery = Cabang.query();
            if (searchValue) {
                const lowerSearch = searchValue.toLowerCase();
                dataQuery = dataQuery.where((query) => {
                    query
                        .whereRaw('LOWER(nm_cabang) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(alamat_cabang) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(kode_cabang) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereHas('perusahaan', (pQuery) => {
                        pQuery.whereRaw('LOWER(nm_perusahaan) LIKE ?', [`%${lowerSearch}%`]);
                    });
                });
            }
            if (perusahaanId) {
                dataQuery.where('perusahaanId', perusahaanId);
            }
            const cabangs = await dataQuery
                .preload('perusahaan')
                .orderBy(sortField, sortOrder)
                .paginate(page, limit);
            return response.ok(cabangs);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil data cabang',
                error,
            });
        }
    }
    async show({ params, response }) {
        try {
            const cabang = await Cabang.query().where('id', params.id).preload('perusahaan').first();
            if (!cabang) {
                return response.notFound({ message: 'Cabang tidak ditemukan' });
            }
            await cabang.preload('perusahaan');
            return response.ok(cabang);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil detail cabang',
                error: error.message,
            });
        }
    }
    async store({ request, response }) {
        try {
            const payload = await request.validateUsing(cabangValidator);
            const cabang = await Cabang.create(payload);
            return response.created(cabang);
        }
        catch (error) {
            return response.badRequest({
                message: 'Gagal membuat cabang',
                error: error.messages || error.message,
            });
        }
    }
    async update({ params, request, response }) {
        try {
            const cabang = await Cabang.find(params.id);
            if (!cabang) {
                return response.notFound({ message: 'Cabang tidak ditemukan' });
            }
            const payload = await request.validateUsing(cabangValidator);
            cabang.merge(payload);
            await cabang.save();
            return response.ok(cabang);
        }
        catch (error) {
            return response.badRequest({
                message: 'Gagal memperbarui cabang',
                error: error.messages || error.message,
            });
        }
    }
    async destroy({ params, response }) {
        try {
            const cabang = await Cabang.find(params.id);
            if (!cabang) {
                return response.notFound({ message: 'Cabang tidak ditemukan' });
            }
            await cabang.delete();
            return response.ok({ message: 'Cabang berhasil dihapus' });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal menghapus cabang',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=cabangs_controller.js.map