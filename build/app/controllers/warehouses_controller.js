import { warehouseValidator } from "#validators/warehouse";
import Warehouse from "#models/warehouse";
export default class WarehousesController {
    async index({ request, response }) {
        try {
            const page = request.input('page', 1);
            const limit = request.input('rows', 10);
            const search = request.input('search', '');
            const searchValue = search || request.input('search.value', '');
            let dataQuery = Warehouse.query();
            if (searchValue) {
                const lowerSearch = searchValue.toLowerCase();
                dataQuery = dataQuery.where((query) => {
                    query
                        .whereRaw('LOWER(nm_warehouse) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(alamat_warehouse) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(kode_warehouse) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(phone_warehouse) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(email_warehouse) LIKE ?', [`%${lowerSearch}%`]);
                });
            }
            const perusahaan = await dataQuery.paginate(page, limit);
            return response.ok(perusahaan.toJSON());
        }
        catch (error) {
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil data perusahaan',
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
            const warehouse = await Warehouse.find(params.id);
            if (!warehouse) {
                return response.notFound({ message: 'Warehouse tidak ditemukan' });
            }
            return response.ok(warehouse);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil detail warehouse',
                error: error.message,
            });
        }
    }
    async store({ request, response }) {
        try {
            const payload = await request.validateUsing(warehouseValidator);
            const warehouse = await Warehouse.create(payload);
            return response.created(warehouse);
        }
        catch (error) {
            return response.badRequest({
                message: 'Gagal membuat warehouse',
                error: error.messages || error.message,
            });
        }
    }
    async update({ params, request, response }) {
        try {
            const warehouse = await Warehouse.find(params.id);
            if (!warehouse) {
                return response.notFound({ message: 'Warehouse tidak ditemukan' });
            }
            const payload = await request.validateUsing(warehouseValidator);
            warehouse.merge(payload);
            await warehouse.save();
            return response.ok(warehouse);
        }
        catch (error) {
            return response.badRequest({
                message: 'Gagal memperbarui warehouse',
                error: error.messages || error.message,
            });
        }
    }
    async destroy({ params, response }) {
        try {
            const warehouse = await Warehouse.find(params.id);
            if (!warehouse) {
                return response.notFound({ message: 'Warehouse tidak ditemukan' });
            }
            await warehouse.delete();
            return response.ok({ message: 'Warehouse berhasil dihapus' });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal menghapus warehouse',
                error: error.message,
            });
        }
    }
    async getTotalWarehouse({ response }) {
        const total = await Warehouse.query().count('* as total');
        return response.ok({
            total: total[0].$extras.total,
        });
    }
}
//# sourceMappingURL=warehouses_controller.js.map