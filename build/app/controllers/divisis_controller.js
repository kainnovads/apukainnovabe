import Divisi from '#models/divisi';
import { createDivisiValidator } from '#validators/divisi';
export default class DivisisController {
    async index({ request, response }) {
        try {
            const page = request.input('page', 1);
            const limit = request.input('rows', 10);
            const search = request.input('search', '');
            const searchValue = search || request.input('search.value', '');
            let dataQuery = Divisi.query();
            if (searchValue) {
                const lowerSearch = searchValue.toLowerCase();
                dataQuery = dataQuery.where((query) => {
                    query
                        .whereRaw('LOWER(nm_divisi) LIKE ?', [`%${lowerSearch}%`]);
                });
            }
            const divisi = await dataQuery.paginate(page, limit);
            return response.ok(divisi.toJSON());
        }
        catch (error) {
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil data divisi',
                error: {
                    name: error.name,
                    status: error.status || 500,
                    code: error.code,
                    message: error.message,
                },
            });
        }
    }
    async show({ params, response }) {
        try {
            const divisi = await Divisi.find(params.id);
            if (!divisi) {
                return response.notFound({ message: 'Divisi tidak ditemukan' });
            }
            return response.ok(divisi);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil detail divisi',
                error: error.message,
            });
        }
    }
    async store({ request, response }) {
        try {
            const payload = await request.validateUsing(createDivisiValidator);
            const divisi = await Divisi.create(payload);
            return response.created(divisi);
        }
        catch (error) {
            return response.badRequest({
                message: 'Gagal membuat divisi',
                error: error.messages || error.message,
            });
        }
    }
    async update({ params, request, response }) {
        try {
            const divisi = await Divisi.find(params.id);
            if (!divisi) {
                return response.notFound({ message: 'Divisi tidak ditemukan' });
            }
            const payload = await request.validateUsing(createDivisiValidator);
            divisi.merge(payload);
            await divisi.save();
            return response.ok(divisi);
        }
        catch (error) {
            return response.badRequest({
                message: 'Gagal memperbarui divisi',
                error: error.messages || error.message,
            });
        }
    }
    async destroy({ params, response }) {
        try {
            const divisi = await Divisi.find(params.id);
            if (!divisi) {
                return response.notFound({ message: 'Divisi tidak ditemukan' });
            }
            await divisi.delete();
            return response.ok({ message: 'Divisi berhasil dihapus' });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal menghapus divisi',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=divisis_controller.js.map