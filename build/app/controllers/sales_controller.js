import SalesOrder from '#models/sales_order';
import SalesInvoice from '#models/sales_invoice';
import SalesInvoiceItem from '#models/sales_invoice_item';
import { MultipartFile } from '@adonisjs/core/bodyparser';
import db from '@adonisjs/lucid/services/db';
import Cabang from '#models/cabang';
import SalesOrderItem from '#models/sales_order_item';
import { salesOrderValidator, updateSalesOrderValidator } from '#validators/sale';
import { toRoman } from '#helper/bulan_romawi';
import { DateTime } from 'luxon';
import StorageService from '#services/storage_service';
export default class SalesController {
    storageService;
    constructor() {
        this.storageService = new StorageService();
    }
    async index({ request, response }) {
        try {
            const page = parseInt(request.input('page', '1'), 10) || 1;
            const limit = parseInt(request.input('rows', '10'), 10) || 10;
            const search = request.input('search', '');
            const searchValue = search || request.input('search.value', '');
            const sortField = request.input('sortField');
            const sortOrder = request.input('sortOrder');
            const customerId = request.input('customerId');
            const source = request.input('source');
            const status = request.input('status');
            const startDate = request.input('startDate');
            const endDate = request.input('endDate');
            const includeItems = request.input('includeItems', false);
            let dataQuery = SalesOrder.query()
                .preload('customer', (query) => {
                query.select(['id', 'name', 'email', 'phone']);
            })
                .preload('perusahaan', (query) => {
                query.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan']);
            })
                .preload('cabang', (query) => {
                query.select(['id', 'nmCabang', 'perusahaanId']);
            })
                .preload('createdByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .preload('quotation', (query) => {
                query.select(['id', 'noQuotation', 'description']);
            });
            if (includeItems) {
                dataQuery.preload('salesOrderItems', (query) => {
                    query.preload('product', (productQuery) => {
                        productQuery.select(['id', 'name', 'price', 'sku']);
                    });
                });
            }
            dataQuery.preload('approvedByUser', (query) => {
                query.select(['id', 'fullName']);
            });
            dataQuery.preload('deliveredByUser', (query) => {
                query.select(['id', 'fullName']);
            });
            dataQuery.preload('rejectedByUser', (query) => {
                query.select(['id', 'fullName']);
            });
            if (customerId) {
                dataQuery.where('customer_id', customerId);
            }
            if (source) {
                dataQuery.where('source', source);
            }
            if (status) {
                dataQuery.where('status', status);
            }
            if (startDate && startDate.trim() !== '') {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(startDate)) {
                }
                else {
                    dataQuery.where('date', '>=', startDate);
                }
            }
            if (endDate && endDate.trim() !== '') {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(endDate)) {
                }
                else {
                    dataQuery.where('date', '<=', endDate);
                }
            }
            if (searchValue) {
                const lowerSearch = searchValue.toLowerCase();
                dataQuery = dataQuery.where((query) => {
                    query
                        .whereRaw('LOWER(no_so) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(status) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(description) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereExists((customerQuery) => {
                        customerQuery
                            .from('customers')
                            .whereColumn('customers.id', 'sales_orders.customer_id')
                            .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`]);
                    })
                        .orWhereExists((userQuery) => {
                        userQuery
                            .from('users')
                            .whereColumn('users.id', 'sales_orders.created_by')
                            .whereRaw('LOWER(users.fullName) LIKE ?', [`%${lowerSearch}%`]);
                    });
                });
            }
            let customOrder = false;
            if (sortField && sortOrder) {
                customOrder = true;
                const actualSortOrder = sortOrder === '1' ? 'asc' : 'desc';
                const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (sortField.includes('.')) {
                    const [relation, column] = sortField.split('.');
                    const dbColumn = toSnakeCase(column);
                    const relationJoinInfo = {
                        customer: { table: 'customers', foreignKey: 'sales_orders.customer_id', primaryKey: 'customers.id' },
                        perusahaan: { table: 'perusahaan', foreignKey: 'sales_orders.perusahaan_id', primaryKey: 'perusahaan.id' },
                        cabang: { table: 'cabang', foreignKey: 'sales_orders.cabang_id', primaryKey: 'cabang.id' },
                        quotation: { table: 'quotations', foreignKey: 'sales_orders.quotation_id', primaryKey: 'quotations.id' },
                        createdByUser: { table: 'users as created_users', foreignKey: 'sales_orders.created_by', primaryKey: 'created_users.id' },
                        approvedByUser: { table: 'users as approved_users', foreignKey: 'sales_orders.approved_by', primaryKey: 'approved_users.id' },
                        deliveredByUser: { table: 'users as delivered_users', foreignKey: 'sales_orders.delivered_by', primaryKey: 'delivered_users.id' },
                        date: { table: 'sales_orders', foreignKey: 'sales_orders.id', primaryKey: 'sales_orders.id' },
                    };
                    if (relation in relationJoinInfo) {
                        const joinInfo = relationJoinInfo[relation];
                        dataQuery
                            .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
                            .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
                            .select('sales_orders.*');
                    }
                }
                else {
                    const dbColumn = toSnakeCase(sortField);
                    dataQuery.orderBy(dbColumn, actualSortOrder);
                }
            }
            if (!customOrder) {
                dataQuery.orderBy('created_at', 'desc');
            }
            const startTime = Date.now();
            const salesOrders = await dataQuery.paginate(page, limit);
            const queryTime = Date.now() - startTime;
            if (queryTime > 1000) {
                console.warn(`🐌 Slow Query Alert: Sales Orders took ${queryTime}ms`);
            }
            return response.ok({
                ...salesOrders.toJSON(),
                _meta: {
                    queryTime: queryTime,
                    totalQueries: 'optimized'
                }
            });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil data sales order',
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
            const so = await SalesOrder.query()
                .where('id', params.id)
                .preload('customer', (query) => {
                query.select(['id', 'name', 'email', 'phone', 'address', 'npwp']);
            })
                .preload('perusahaan', (query) => {
                query.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan']);
            })
                .preload('cabang', (query) => {
                query.select(['id', 'nmCabang', 'alamatCabang']);
            })
                .preload('quotation', (query) => {
                query.select(['id', 'noQuotation', 'description']);
            })
                .preload('salesOrderItems', (query) => {
                query.preload('product', (productQuery) => {
                    productQuery.select(['id', 'name', 'priceSell', 'sku', 'description']);
                }).preload('salesReturnItems', (sriQuery) => {
                    sriQuery.preload('salesReturn', (srQuery) => {
                        srQuery.select(['id', 'status', 'return_date']);
                    });
                });
            })
                .preload('createdByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .preload('approvedByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .preload('deliveredByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .preload('rejectedByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .first();
            if (!so) {
                console.error('❌ Controller Debug - Sales Order not found with ID:', params.id);
                return response.notFound({
                    message: `Sales Order dengan ID ${params.id} tidak ditemukan`,
                    error: {
                        code: 'SO_NOT_FOUND',
                        id: params.id
                    }
                });
            }
            return response.ok({
                message: 'Sales Order ditemukan',
                data: so,
            });
        }
        catch (error) {
            console.error('❌ Controller Debug - Error in show:', {
                message: error.message,
                stack: error.stack,
                params: params
            });
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil Sales Order',
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message
                }
            });
        }
    }
    async store({ request, response }) {
        async function generateNo() {
            const now = new Date();
            const bulan = now.getMonth() + 1;
            const tahun = now.getFullYear();
            const bulanRomawi = toRoman(bulan);
            const lastPo = await SalesOrder
                .query()
                .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulan])
                .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun])
                .orderBy('no_so', 'desc')
                .first();
            let lastNumber = 0;
            if (lastPo && lastPo.noSo) {
                const match = lastPo.noSo.match(/^(\d{4})/);
                if (match) {
                    lastNumber = parseInt(match[1], 10);
                }
            }
            const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
            return `${nextNumber}/APU/SO/${bulanRomawi}/${tahun}`;
        }
        const payload = await request.validateUsing(salesOrderValidator);
        const items = payload.salesOrderItems || [];
        if (!Array.isArray(items) || items.length === 0) {
            return response.badRequest({ message: 'Items tidak boleh kosong ya' });
        }
        let attachmentPath = null;
        if (payload.attachment && payload.attachment instanceof MultipartFile) {
            try {
                if (!payload.attachment.size || payload.attachment.size === 0) {
                    throw new Error('File attachment kosong atau tidak valid');
                }
                const fileType = payload.attachment.type || '';
                const fileExtension = payload.attachment.clientName?.split('.').pop()?.toLowerCase() || '';
                const allowedMimeTypes = [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'image/svg+xml'
                ];
                const allowedExtensions = ['pdf', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                const isValidMimeType = allowedMimeTypes.includes(fileType);
                const isValidExtension = allowedExtensions.includes(fileExtension);
                if (!isValidMimeType && !isValidExtension) {
                    throw new Error(`File harus berupa PDF, Excel, atau gambar. Detected: MIME=${fileType}, Ext=${fileExtension}`);
                }
                const maxSize = 10 * 1024 * 1024;
                if (payload.attachment.size > maxSize) {
                    throw new Error('Ukuran file terlalu besar (maksimal 10MB)');
                }
                const uploadResult = await this.storageService.uploadFile(payload.attachment, 'sales_orders', true);
                attachmentPath = uploadResult.url;
            }
            catch (err) {
                console.error('Attachment upload failed:', err);
                return response.internalServerError({
                    message: 'Gagal menyimpan file attachment',
                    error: err.message,
                });
            }
        }
        const trx = await db.transaction();
        try {
            const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
            const discount = subtotal * (payload.discountPercent / 100);
            const afterDiscount = subtotal - discount;
            const tax = afterDiscount * (payload.taxPercent / 100);
            const total = afterDiscount + tax;
            const so = await SalesOrder.create({
                customerId: payload.customerId,
                perusahaanId: payload.perusahaanId,
                cabangId: payload.cabangId,
                quotationId: payload.quotationId,
                noPo: payload.noPo,
                noSo: payload.noSo || await generateNo(),
                up: payload.up,
                date: payload.date,
                dueDate: payload.dueDate,
                status: payload.status || 'draft',
                paymentMethod: payload.paymentMethod,
                source: payload.source,
                discountPercent: payload.discountPercent,
                taxPercent: payload.taxPercent,
                total,
                createdBy: payload.createdBy,
                approvedBy: payload.approvedBy,
                deliveredBy: payload.deliveredBy,
                rejectedBy: payload.rejectedBy,
                approvedAt: payload.approvedAt,
                deliveredAt: payload.deliveredAt,
                rejectedAt: payload.rejectedAt,
                description: payload.description,
                attachment: attachmentPath || undefined,
            }, { client: trx });
            for (const item of items) {
                await SalesOrderItem.create({
                    salesOrderId: so.id,
                    productId: item.productId,
                    warehouseId: item.warehouseId,
                    quantity: item.quantity,
                    price: item.price,
                    description: item.description,
                    subtotal: item.subtotal,
                    statusPartial: item.statusPartial || false,
                    deliveredQty: item.deliveredQty || 0,
                }, { client: trx });
            }
            await trx.commit();
            return response.created({
                message: 'Sales Order berhasil dibuat',
                data: so,
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('SO Error:', error);
            return response.internalServerError({
                message: 'Gagal membuat Sales Order',
            });
        }
    }
    async update({ params, request, response }) {
        const payload = await request.validateUsing(updateSalesOrderValidator);
        const items = payload.salesOrderItems || [];
        if (!Array.isArray(items) || items.length === 0) {
            return response.badRequest({ message: 'Items tidak boleh kosong' });
        }
        const trx = await db.transaction();
        try {
            const so = await SalesOrder.findOrFail(params.id, { client: trx });
            let attachmentPath = so.attachment;
            if (payload.attachment && payload.attachment instanceof MultipartFile) {
                try {
                    if (!payload.attachment.size || payload.attachment.size === 0) {
                        throw new Error('File attachment kosong atau tidak valid');
                    }
                    const fileType = payload.attachment.type || '';
                    const fileExtension = payload.attachment.clientName?.split('.').pop()?.toLowerCase() || '';
                    const allowedMimeTypes = [
                        'application/pdf',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-excel',
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/gif',
                        'image/webp',
                        'image/svg+xml'
                    ];
                    const allowedExtensions = ['pdf', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                    const isValidMimeType = allowedMimeTypes.includes(fileType);
                    const isValidExtension = allowedExtensions.includes(fileExtension);
                    if (!isValidMimeType && !isValidExtension) {
                        throw new Error(`File harus berupa PDF, Excel, atau gambar. Detected: MIME=${fileType}, Ext=${fileExtension}`);
                    }
                    const maxSize = 10 * 1024 * 1024;
                    if (payload.attachment.size > maxSize) {
                        throw new Error('Ukuran file terlalu besar (maksimal 10MB)');
                    }
                    const uploadResult = await this.storageService.uploadFile(payload.attachment, 'sales_orders', true);
                    attachmentPath = uploadResult.url;
                }
                catch (err) {
                    console.error('Attachment upload failed:', err);
                    return response.internalServerError({
                        message: 'Gagal menyimpan file attachment',
                        error: err.message,
                    });
                }
            }
            const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
            const discount = subtotal * (payload.discountPercent || 0) / 100;
            const afterDiscount = subtotal - discount;
            const tax = afterDiscount * (payload.taxPercent || 0) / 100;
            const total = afterDiscount + tax;
            const oldStatus = so.status;
            const newStatus = payload.status || 'draft';
            so.merge({
                customerId: payload.customerId,
                perusahaanId: payload.perusahaanId,
                cabangId: payload.cabangId,
                quotationId: payload.quotationId,
                noPo: payload.noPo,
                noSo: payload.noSo,
                up: payload.up,
                date: payload.date,
                dueDate: payload.dueDate,
                status: newStatus,
                paymentMethod: payload.paymentMethod,
                source: payload.source,
                discountPercent: payload.discountPercent || 0,
                taxPercent: payload.taxPercent || 0,
                total,
                createdBy: payload.createdBy,
                approvedBy: payload.approvedBy,
                deliveredBy: payload.deliveredBy,
                rejectedBy: payload.rejectedBy,
                approvedAt: payload.approvedAt,
                deliveredAt: payload.deliveredAt,
                rejectedAt: payload.rejectedAt,
                description: payload.description,
                attachment: attachmentPath || undefined,
            });
            await so.save();
            let createdInvoice = null;
            if (oldStatus !== newStatus && newStatus === 'delivered') {
                createdInvoice = await this.createInvoiceForNewDelivery(so, newStatus);
            }
            await SalesOrderItem.query({ client: trx })
                .where('sales_order_id', so.id)
                .delete();
            for (const item of items) {
                await SalesOrderItem.create({
                    salesOrderId: so.id,
                    productId: item.productId,
                    warehouseId: item.warehouseId,
                    quantity: item.quantity,
                    price: item.price,
                    description: item.description,
                    subtotal: item.subtotal,
                    statusPartial: item.statusPartial || false,
                    deliveredQty: item.deliveredQty || 0,
                }, { client: trx });
            }
            await trx.commit();
            return response.ok({
                message: 'Sales Order berhasil diperbarui',
                data: {
                    salesOrder: so.serialize(),
                    invoice: createdInvoice ? createdInvoice.serialize() : null
                }
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('PO Update Error:', error);
            return response.internalServerError({ message: 'Gagal memperbarui Sales Order' });
        }
    }
    async destroy({ params, response }) {
        try {
            const customer = await SalesOrder.find(params.id);
            if (!customer) {
                return response.notFound({ message: 'SalesOrder tidak ditemukan' });
            }
            await customer.delete();
            return response.ok({ message: 'SalesOrder berhasil dihapus' });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal menghapus purchase order',
                error: error.message,
            });
        }
    }
    async approveSalesOrder({ params, response, auth }) {
        try {
            const so = await SalesOrder.find(params.id);
            if (!so) {
                return response.notFound({ message: 'SalesOrder tidak ditemukan' });
            }
            so.status = 'approved';
            so.approvedAt = new Date();
            if (auth.user) {
                so.approvedBy = auth.user.id;
            }
            await so.save();
            return response.ok({
                message: 'Sales Order berhasil diapprove',
                data: {
                    salesOrder: so.serialize(),
                    invoice: null
                }
            });
        }
        catch (error) {
            console.error('Error approving sales order:', error);
            return response.internalServerError({
                message: 'Gagal mengapprove Sales Order',
                error: error.message
            });
        }
    }
    async rejectSalesOrder({ params, response, auth }) {
        try {
            const so = await SalesOrder.find(params.id);
            if (!so) {
                return response.notFound({ message: 'SalesOrder tidak ditemukan' });
            }
            so.status = 'rejected';
            so.rejectedAt = new Date();
            if (auth.user) {
                so.rejectedBy = auth.user.id;
            }
            await so.save();
            return response.ok({ message: 'Sales Order berhasil direject' });
        }
        catch (error) {
            return response.internalServerError({ message: 'Gagal mereject purchase order' });
        }
    }
    async getSalesOrderDetails({ params, response }) {
        try {
            const so = await SalesOrder.query()
                .where('id', params.id)
                .preload('customer', (query) => {
                query.select(['id', 'name', 'email', 'phone', 'address', 'npwp']);
            })
                .preload('perusahaan', (query) => {
                query.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan']);
            })
                .preload('cabang', (query) => {
                query.select(['id', 'nmCabang', 'alamatCabang']);
            })
                .preload('quotation', (query) => {
                query.select(['id', 'noQuotation', 'description']);
            })
                .preload('salesOrderItems', (query) => {
                query.preload('product', (productQuery) => {
                    productQuery.select(['id', 'name', 'priceSell', 'sku']);
                }).preload('salesReturnItems', (sriQuery) => {
                    sriQuery.preload('salesReturn', (srQuery) => {
                        srQuery.select(['id', 'status', 'returnDate']);
                    });
                });
            })
                .preload('createdByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .preload('approvedByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .preload('deliveredByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .preload('rejectedByUser', (query) => {
                query.select(['id', 'fullName', 'email']);
            })
                .first();
            if (!so) {
                return response.notFound({
                    message: `Sales Order dengan ID ${params.id} tidak ditemukan`,
                    error: {
                        code: 'SO_NOT_FOUND',
                        id: params.id
                    }
                });
            }
            return response.ok({
                message: 'Sales Order ditemukan',
                data: so,
            });
        }
        catch (error) {
            console.error('❌ Controller Debug - Error in getSalesOrderDetails:', {
                message: error.message,
                stack: error.stack,
                params: params
            });
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil detail Sales Order',
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message
                }
            });
        }
    }
    async createInvoiceForNewDelivery(salesOrder, newStatus, _allItemsDelivered = false) {
        if (newStatus !== 'delivered') {
            return null;
        }
        await salesOrder.load('salesOrderItems');
        let itemsToInvoice = [];
        let invoiceDescription = '';
        let deliveredItemsTotal = 0;
        const existingInvoicesCount = await SalesInvoice.query()
            .where('salesOrderId', salesOrder.id)
            .count('* as total');
        const totalExistingInvoices = existingInvoicesCount[0]?.$extras.total || 0;
        if (totalExistingInvoices > 0) {
            console.log(`✅ Sales Order #${salesOrder.noSo} sudah memiliki ${totalExistingInvoices} invoice. Tidak membuat invoice baru untuk status ${newStatus}.`);
            return null;
        }
        else {
            itemsToInvoice = salesOrder.salesOrderItems.filter(item => item.statusPartial === true);
            if (itemsToInvoice.length === 0) {
                itemsToInvoice = salesOrder.salesOrderItems;
                deliveredItemsTotal = Number(salesOrder.total) || 0;
                invoiceDescription = `Invoice untuk semua item SO #${salesOrder.noSo || salesOrder.id} - Status: ${newStatus} (${itemsToInvoice.length} items)`;
            }
            else {
                deliveredItemsTotal = Number(salesOrder.total) || 0;
                invoiceDescription = `Invoice untuk semua item SO #${salesOrder.noSo || salesOrder.id} - Status: ${newStatus} (${itemsToInvoice.length} items completed)`;
            }
        }
        if (itemsToInvoice.length === 0 || deliveredItemsTotal <= 0) {
            console.warn(`⚠️ Tidak ada item valid untuk di-invoice atau total = 0`);
            return null;
        }
        try {
            const now = new Date();
            const bulan = String(now.getMonth() + 1).padStart(2, '0');
            const tahun = String(now.getFullYear()).slice(-2);
            const currentMonthPattern = `-${bulan}${tahun}`;
            const lastInvoice = await SalesInvoice.query()
                .whereRaw(`no_invoice LIKE '%${currentMonthPattern}'`)
                .orderByRaw(`CAST(SUBSTRING(no_invoice, 1, 4) AS INTEGER) DESC`)
                .first();
            let nextNumber = 1;
            if (lastInvoice && lastInvoice.noInvoice) {
                const match = lastInvoice.noInvoice.match(/^(\d{4})-/);
                if (match) {
                    nextNumber = parseInt(match[1], 10) + 1;
                }
            }
            const noUrut = String(nextNumber).padStart(4, '0');
            const noInvoice = `${noUrut}-${bulan}${tahun}`;
            let finalTotal = 0;
            if (newStatus === 'delivered' && itemsToInvoice.length === salesOrder.salesOrderItems.length) {
                finalTotal = Number(salesOrder.total) || 0;
            }
            else {
                const subtotalItems = itemsToInvoice.reduce((total, item) => {
                    return total + (Number(item.subtotal) || 0);
                }, 0);
                const discountPercent = Number(salesOrder.discountPercent) || 0;
                const taxPercent = Number(salesOrder.taxPercent) || 0;
                const discountAmount = subtotalItems * (discountPercent / 100);
                const totalAfterDiscount = subtotalItems - discountAmount;
                const taxAmount = totalAfterDiscount * (taxPercent / 100);
                finalTotal = totalAfterDiscount + taxAmount;
            }
            const invoice = await SalesInvoice.create({
                noInvoice: noInvoice,
                salesOrderId: salesOrder.id,
                customerId: salesOrder.customerId,
                date: now,
                dueDate: salesOrder.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                discountPercent: Number(salesOrder.discountPercent) || 0,
                taxPercent: Number(salesOrder.taxPercent) || 0,
                total: finalTotal,
                paidAmount: 0,
                remainingAmount: finalTotal,
                status: 'unpaid',
                description: invoiceDescription,
            });
            for (const item of itemsToInvoice) {
                await SalesInvoiceItem.create({
                    salesInvoiceId: invoice.id,
                    salesOrderItemId: item.id,
                    productId: Number(item.productId),
                    warehouseId: Number(item.warehouseId),
                    quantity: Number(item.deliveredQty || item.quantity),
                    price: Number(item.price) || 0,
                    subtotal: Number(item.subtotal) || 0,
                    description: item.description || '',
                    deliveredQty: Number(item.deliveredQty || 0),
                    isReturned: false,
                });
            }
            console.log(`✅ NEW Invoice created untuk SO #${salesOrder.noSo}: ${noInvoice} - Total: ${finalTotal} - Items: ${itemsToInvoice.length}`);
            return invoice;
        }
        catch (error) {
            console.error(`❌ Gagal membuat invoice untuk SO #${salesOrder.noSo}:`, error);
            return null;
        }
    }
    async getCabangbyPerusahaan({ request, response }) {
        const perusahaanId = request.input('perusahaanId');
        const cabang = await Cabang.query()
            .where('perusahaanId', perusahaanId);
        return response.ok(cabang);
    }
    async countByStatus({ response }) {
        const total = await SalesOrder.query().count('* as total');
        const approved = await SalesOrder.query().where('status', 'approved').count('* as total');
        const rejected = await SalesOrder.query().where('status', 'rejected').count('* as total');
        const partial = await SalesOrder.query().where('status', 'partial').count('* as total');
        const delivered = await SalesOrder.query().where('status', 'delivered').count('* as total');
        const fourMonthsAgo = DateTime.now().minus({ months: 4 }).toISODate();
        const deliveredLast4Months = await SalesOrder.query()
            .where('status', 'delivered')
            .where('created_at', '>=', fourMonthsAgo)
            .count('* as total');
        return response.ok({
            total: Number(total[0].total),
            approved: Number(approved[0].total),
            rejected: Number(rejected[0].total),
            partial: Number(partial[0].total),
            delivered: Number(delivered[0].total),
            deliveredLast4Months: Number(deliveredLast4Months[0].total),
        });
    }
    async getSalesStatistics({ response }) {
        try {
            const now = DateTime.now();
            const oneMonthAgo = now.minus({ months: 1 }).toISODate();
            const lastMonthSales = await SalesOrder.query()
                .where('status', 'delivered')
                .where('created_at', '>=', oneMonthAgo)
                .sum('total as totalAmount');
            const lastMonthTotal = Number(lastMonthSales[0]?.$extras.totalAmount || 0);
            const twoMonthsAgo = now.minus({ months: 2 }).toISODate();
            const twoMonthsAgoSales = await SalesOrder.query()
                .where('status', 'delivered')
                .where('created_at', '>=', twoMonthsAgo)
                .where('created_at', '<', oneMonthAgo)
                .sum('total as totalAmount');
            const twoMonthsAgoTotal = Number(twoMonthsAgoSales[0]?.$extras.totalAmount || 0);
            const weeklyData = [];
            for (let i = 0; i < 4; i++) {
                const weekStart = now.minus({ weeks: i + 1 }).startOf('week');
                const weekEnd = now.minus({ weeks: i }).startOf('week');
                const weekSales = await SalesOrder.query()
                    .where('status', 'delivered')
                    .where('created_at', '>=', weekStart.toISODate())
                    .where('created_at', '<', weekEnd.toISODate())
                    .sum('total as totalAmount');
                weeklyData.push({
                    week: `Week ${4 - i}`,
                    amount: Number(weekSales[0]?.$extras.totalAmount || 0),
                    dateRange: `${weekStart.toFormat('dd/MM')} - ${weekEnd.minus({ days: 1 }).toFormat('dd/MM')}`
                });
            }
            let performancePercentage = 0;
            if (twoMonthsAgoTotal > 0) {
                performancePercentage = ((lastMonthTotal - twoMonthsAgoTotal) / twoMonthsAgoTotal) * 100;
            }
            const today = now.startOf('day');
            const todaySales = await SalesOrder.query()
                .where('status', 'delivered')
                .where('created_at', '>=', today.toISODate())
                .sum('total as totalAmount');
            const todayTotal = Number(todaySales[0]?.$extras.totalAmount || 0);
            const thisWeekStart = now.startOf('week');
            const thisWeekSales = await SalesOrder.query()
                .where('status', 'delivered')
                .where('created_at', '>=', thisWeekStart.toISODate())
                .sum('total as totalAmount');
            const thisWeekTotal = Number(thisWeekSales[0]?.$extras.totalAmount || 0);
            const lastWeekStart = now.minus({ weeks: 1 }).startOf('week');
            const lastWeekEnd = now.startOf('week');
            const lastWeekSales = await SalesOrder.query()
                .where('status', 'delivered')
                .where('created_at', '>=', lastWeekStart.toISODate())
                .where('created_at', '<', lastWeekEnd.toISODate())
                .sum('total as totalAmount');
            const lastWeekTotal = Number(lastWeekSales[0]?.$extras.totalAmount || 0);
            let weeklyPerformancePercentage = 0;
            if (lastWeekTotal > 0) {
                weeklyPerformancePercentage = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
            }
            return response.ok({
                lastMonth: {
                    total: lastMonthTotal,
                    performance: performancePercentage
                },
                thisWeek: {
                    total: thisWeekTotal,
                    performance: weeklyPerformancePercentage
                },
                today: {
                    total: todayTotal
                },
                weeklyData: weeklyData.reverse(),
                performance: {
                    monthly: performancePercentage,
                    weekly: weeklyPerformancePercentage
                }
            });
        }
        catch (error) {
            console.error('Error getting sales statistics:', error);
            return response.internalServerError({
                message: 'Gagal mengambil statistik penjualan',
                error: error.message
            });
        }
    }
    async getSalesByCustomer({ response }) {
        try {
            const oneMonthAgo = DateTime.now().minus({ months: 1 }).toISODate();
            const salesByCustomer = await db
                .from('sales_orders')
                .select('customers.name as customer_name', 'customers.id as customer_id', db.raw('SUM(sales_orders.total) as total_sales'))
                .leftJoin('customers', 'sales_orders.customer_id', 'customers.id')
                .where('sales_orders.status', 'delivered')
                .where('sales_orders.created_at', '>=', oneMonthAgo)
                .groupBy('customers.id', 'customers.name')
                .orderBy('total_sales', 'desc')
                .limit(5);
            const totalSales = salesByCustomer.reduce((sum, item) => sum + Number(item.total_sales), 0);
            const chartData = salesByCustomer.map((item, index) => {
                const colors = ['#696cff', '#71dd37', '#ffab00', '#ff3e1d', '#03c3ec'];
                return {
                    customer: item.customer_name || 'Unknown Customer',
                    sales: Number(item.total_sales),
                    color: colors[index] || '#696cff',
                    percentage: totalSales > 0 ? ((Number(item.total_sales) / totalSales) * 100).toFixed(1) : '0'
                };
            });
            return response.ok({
                totalSales: totalSales,
                customers: chartData
            });
        }
        catch (error) {
            console.error('Error getting sales by customer:', error);
            return response.internalServerError({
                message: 'Gagal mengambil data penjualan berdasarkan customer',
                error: error.message
            });
        }
    }
}
//# sourceMappingURL=sales_controller.js.map