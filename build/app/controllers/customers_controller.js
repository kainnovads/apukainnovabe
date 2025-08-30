import { customerValidator } from '#validators/customer';
import Customer from '#models/customer';
import { MultipartFile } from "@adonisjs/core/bodyparser";
import db from '@adonisjs/lucid/services/db';
import ProductCustomer from '#models/product_customer';
import StorageService from '#services/storage_service';
export default class CustomersController {
    storageService;
    constructor() {
        this.storageService = new StorageService();
    }
    async index({ request, response }) {
        try {
            const page = request.input('page', 1);
            const limit = request.input('rows', 10);
            const search = request.input('search', '');
            const searchValue = search || request.input('search.value', '');
            const sortField = request.input('sortField', 'id');
            const sortOrder = request.input('sortOrder', 'asc');
            let dataQuery = Customer.query().orderBy(sortField, sortOrder);
            if (searchValue) {
                const lowerSearch = searchValue.toLowerCase();
                dataQuery = dataQuery.where((query) => {
                    query
                        .whereRaw('LOWER(name) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(address) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(email) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(phone) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(npwp) LIKE ?', [`%${lowerSearch}%`]);
                });
            }
            const customer = await dataQuery.paginate(page, limit);
            return response.ok(customer.toJSON());
        }
        catch (error) {
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil data customer',
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
            const customer = await Customer.query()
                .where('id', params.id)
                .preload('products', (query) => query.preload('unit'))
                .first();
            if (!customer) {
                return response.notFound({ message: 'Customer tidak ditemukan' });
            }
            const customerJSON = customer.serialize();
            const productList = customer.products.map((p) => {
                return {
                    id: p.id,
                    productId: p.id,
                    name: p.name,
                    sku: p.sku,
                    priceSell: p.$extras.pivot_price_sell,
                    unit: p.unit,
                };
            });
            customerJSON.customerProducts = productList;
            delete customerJSON.products;
            return response.ok({ data: customerJSON });
        }
        catch (error) {
            console.log(error);
            return response.internalServerError({
                message: 'Gagal mengambil detail customer',
                error: error.message,
            });
        }
    }
    async store({ request, response }) {
        const payload = await request.validateUsing(customerValidator);
        const items = payload.customerProducts || [];
        if (!Array.isArray(items) || items.length === 0) {
            return response.badRequest({ message: 'items tidak boleh kosong' });
        }
        let logoPath = null;
        if (payload.logo && payload.logo instanceof MultipartFile) {
            try {
                if (!payload.logo.size || payload.logo.size === 0) {
                    throw new Error('File logo kosong atau tidak valid');
                }
                const fileType = payload.logo.type || '';
                const fileExtension = payload.logo.clientName?.split('.').pop()?.toLowerCase() || '';
                const allowedMimeTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/x-png',
                    'image/gif',
                    'image/webp',
                    'image/svg+xml'
                ];
                const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                const isValidMimeType = allowedMimeTypes.includes(fileType);
                const isValidExtension = allowedExtensions.includes(fileExtension);
                if (!isValidMimeType && !isValidExtension) {
                    throw new Error(`File harus berupa gambar (JPEG, PNG, GIF, WebP). Detected: MIME=${fileType}, Ext=${fileExtension}`);
                }
                const maxSize = 5 * 1024 * 1024;
                if (payload.logo.size > maxSize) {
                    throw new Error('Ukuran file terlalu besar (maksimal 5MB)');
                }
                const uploadResult = await this.storageService.uploadFile(payload.logo, 'customers', true);
                logoPath = uploadResult.url;
            }
            catch (err) {
                console.error('Logo upload failed:', err);
                return response.internalServerError({
                    message: 'Gagal menyimpan file logo',
                    error: err.message,
                });
            }
        }
        const trx = await db.transaction();
        try {
            const customer = await Customer.create({
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                address: payload.address,
                npwp: payload.npwp,
                logo: logoPath || undefined,
            });
            for (const item of items) {
                await ProductCustomer.create({
                    customerId: customer.id,
                    productId: item.productId,
                    priceSell: item.priceSell,
                }, { client: trx });
            }
            await trx.commit();
            return response.created({
                message: 'Customer berhasil dibuat',
                data: customer,
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('Customer Error:', error);
            return response.internalServerError({
                message: 'Gagal membuat Customer',
            });
        }
    }
    async update({ params, request, response }) {
        const payload = await request.validateUsing(customerValidator);
        const items = payload.customerProducts || [];
        const trx = await db.transaction();
        if (!Array.isArray(items) || items.length === 0) {
            await trx.rollback();
            return response.badRequest({ message: 'Items tidak boleh kosong' });
        }
        try {
            const customer = await Customer.findOrFail(params.id, { client: trx });
            let logoPath = customer.logo;
            if (payload.logo && payload.logo instanceof MultipartFile) {
                try {
                    if (!payload.logo.size || payload.logo.size === 0) {
                        throw new Error('File logo kosong atau tidak valid');
                    }
                    const fileType = payload.logo.type || '';
                    const fileExtension = payload.logo.clientName?.split('.').pop()?.toLowerCase() || '';
                    const allowedMimeTypes = [
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/x-png',
                        'image/gif',
                        'image/webp',
                        'image/svg+xml'
                    ];
                    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                    const isValidMimeType = allowedMimeTypes.includes(fileType);
                    const isValidExtension = allowedExtensions.includes(fileExtension);
                    if (!isValidMimeType && !isValidExtension) {
                        throw new Error(`File harus berupa gambar (JPEG, PNG, GIF, WebP). Detected: MIME=${fileType}, Ext=${fileExtension}`);
                    }
                    const maxSize = 5 * 1024 * 1024;
                    if (payload.logo.size > maxSize) {
                        throw new Error('Ukuran file terlalu besar (maksimal 5MB)');
                    }
                    const uploadResult = await this.storageService.uploadFile(payload.logo, 'customers', true);
                    logoPath = uploadResult.url;
                }
                catch (err) {
                    console.error('Logo upload failed:', err);
                    return response.internalServerError({
                        message: 'Gagal menyimpan file logo',
                        error: err.message,
                    });
                }
            }
            const updateData = {
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                address: payload.address,
                npwp: payload.npwp || '',
                logo: logoPath || '',
            };
            customer.merge(updateData);
            await customer.save();
            await customer.refresh();
            await ProductCustomer.query({ client: trx })
                .where('customer_id', customer.id)
                .delete();
            for (const item of items) {
                await ProductCustomer.create({
                    customerId: customer.id,
                    productId: item.productId,
                    priceSell: item.priceSell,
                }, { client: trx });
            }
            await trx.commit();
            const updatedCustomer = await Customer.query()
                .where('id', customer.id)
                .preload('products', (query) => query.preload('unit'))
                .first();
            if (updatedCustomer) {
                const customerJSON = updatedCustomer.serialize();
                const productList = updatedCustomer.products.map((p) => {
                    return {
                        id: p.id,
                        productId: p.id,
                        name: p.name,
                        sku: p.sku,
                        priceSell: p.$extras.pivot_price_sell,
                        unit: p.unit,
                    };
                });
                customerJSON.customerProducts = productList;
                delete customerJSON.products;
                return response.ok({
                    message: 'Customer berhasil diperbarui',
                    data: customerJSON,
                });
            }
            return response.ok({
                message: 'Customer berhasil diperbarui',
                data: customer,
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('Customer Update Error:', error);
            return response.internalServerError({ message: 'Gagal memperbarui Customer' });
        }
    }
    async destroy({ params, response }) {
        try {
            const customer = await Customer.find(params.id);
            if (!customer) {
                return response.notFound({ message: 'Customer tidak ditemukan' });
            }
            await customer.delete();
            return response.ok({ message: 'Customer berhasil dihapus' });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal menghapus customer',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=customers_controller.js.map