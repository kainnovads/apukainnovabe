import { salesInvoiceValidator, updateSalesInvoiceValidator } from '#validators/sales_invoice';
import db from '@adonisjs/lucid/services/db';
import SalesInvoice from '#models/sales_invoice';
import SalesInvoiceItem from '#models/sales_invoice_item';
export default class SalesInvoicesController {
    async index({ request, response }) {
        try {
            const page = parseInt(request.input('page', '1'), 10) || 1;
            const limit = parseInt(request.input('rows', '10'), 10) || 10;
            const search = request.input('search', '');
            const searchValue = search || request.input('search.value', '');
            const sortField = request.input('sortField');
            const sortOrder = request.input('sortOrder');
            const customerId = request.input('customerId');
            const status = request.input('status');
            let dataQuery = SalesInvoice.query()
                .preload('salesOrder', (soQuery) => {
                soQuery.select(['id', 'noSo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description', 'customerId', 'perusahaanId', 'cabangId']);
                soQuery.preload('customer', (customerQuery) => {
                    customerQuery.select(['id', 'name', 'email', 'phone', 'npwp']);
                });
                soQuery.preload('perusahaan', (perusahaanQuery) => {
                    perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan']);
                });
                soQuery.preload('cabang', (cabangQuery) => {
                    cabangQuery.select(['id', 'nmCabang', 'perusahaanId']);
                });
                soQuery.preload('salesOrderItems', (soiQuery) => {
                    soiQuery.where('statusPartial', true);
                    soiQuery.preload('product', (productQuery) => {
                        productQuery.select(['id', 'name', 'priceSell', 'sku']);
                    });
                });
            })
                .preload('customer', (customerQuery) => {
                customerQuery.select(['id', 'name', 'email', 'phone']);
            })
                .preload('salesInvoiceItems', (siiQuery) => {
                siiQuery.preload('product', (productQuery) => {
                    productQuery.select(['id', 'name', 'priceSell', 'sku']);
                });
                siiQuery.preload('warehouse', (warehouseQuery) => {
                    warehouseQuery.select(['id', 'name']);
                });
                siiQuery.preload('salesOrderItem', (soiQuery) => {
                    soiQuery.select(['id', 'quantity', 'price', 'subtotal', 'statusPartial']);
                });
            });
            if (customerId) {
                dataQuery.where('customer_id', customerId);
            }
            if (status) {
                dataQuery.where('status', status);
            }
            if (searchValue) {
                const lowerSearch = searchValue.toLowerCase();
                dataQuery = dataQuery.where((query) => {
                    query
                        .whereRaw('LOWER(sales_invoices.no_invoice) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(sales_invoices.status) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(sales_invoices.description) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereExists((salesOrderQuery) => {
                        salesOrderQuery
                            .from('sales_orders')
                            .whereColumn('sales_orders.id', 'sales_invoices.sales_order_id')
                            .whereRaw('LOWER(sales_orders.no_so) LIKE ?', [`%${lowerSearch}%`]);
                    })
                        .orWhereExists((customerQuery) => {
                        customerQuery
                            .from('customers')
                            .whereColumn('customers.id', 'sales_invoices.customer_id')
                            .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`]);
                    })
                        .orWhereExists((userQuery) => {
                        userQuery
                            .from('users')
                            .whereColumn('users.id', 'sales_invoices.created_by')
                            .whereRaw('LOWER(users.full_name) LIKE ?', [`%${lowerSearch}%`]);
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
                        customer: { table: 'customers', foreignKey: 'sales_invoices.customer_id', primaryKey: 'customers.id' },
                        salesOrder: { table: 'sales_orders', foreignKey: 'sales_invoices.sales_order_id', primaryKey: 'sales_orders.id' },
                        createdByUser: { table: 'users as created_users', foreignKey: 'sales_invoices.created_by', primaryKey: 'created_users.id' },
                        updatedByUser: { table: 'users as updated_users', foreignKey: 'sales_invoices.updated_by', primaryKey: 'updated_users.id' },
                    };
                    if (relation in relationJoinInfo) {
                        const joinInfo = relationJoinInfo[relation];
                        dataQuery
                            .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
                            .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
                            .select('sales_invoices.*');
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
            try {
                const salesInvoices = await dataQuery.paginate(page, limit);
                const queryTime = Date.now() - startTime;
                if (queryTime > 1000) {
                    console.warn(`🐌 Slow Query Alert: Sales Invoices took ${queryTime}ms`);
                }
                return response.ok({
                    ...salesInvoices.toJSON(),
                    _meta: {
                        queryTime: queryTime,
                        totalQueries: 'optimized'
                    }
                });
            }
            catch (preloadError) {
                console.warn('⚠️  Preloading error, falling back to basic query:', preloadError.message);
                const fallbackQuery = SalesInvoice.query()
                    .preload('salesOrder', (soQuery) => {
                    soQuery.select(['id', 'noSo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description']);
                    soQuery.preload('salesOrderItems', (soiQuery) => {
                        soiQuery.where('statusPartial', true);
                        soiQuery.preload('product', (productQuery) => {
                            productQuery.select(['id', 'name', 'priceSell', 'sku']);
                        });
                    });
                })
                    .preload('customer', (customerQuery) => {
                    customerQuery.select(['id', 'name', 'email', 'phone']);
                })
                    .preload('salesInvoiceItems', (siiQuery) => {
                    siiQuery.preload('product', (productQuery) => {
                        productQuery.select(['id', 'name', 'priceSell', 'sku']);
                    });
                    siiQuery.preload('warehouse', (warehouseQuery) => {
                        warehouseQuery.select(['id', 'name']);
                    });
                });
                if (customerId) {
                    fallbackQuery.where('customer_id', customerId);
                }
                if (status) {
                    fallbackQuery.where('status', status);
                }
                if (searchValue) {
                    const lowerSearch = searchValue.toLowerCase();
                    fallbackQuery.where((query) => {
                        query
                            .whereRaw('LOWER(sales_invoices.no_invoice) LIKE ?', [`%${lowerSearch}%`])
                            .orWhereRaw('LOWER(sales_invoices.status) LIKE ?', [`%${lowerSearch}%`])
                            .orWhereRaw('LOWER(sales_invoices.description) LIKE ?', [`%${lowerSearch}%`]);
                    });
                }
                if (sortField && sortOrder) {
                    const actualSortOrder = sortOrder === '1' ? 'asc' : 'desc';
                    const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();
                    if (!sortField.includes('.')) {
                        const dbColumn = toSnakeCase(sortField);
                        fallbackQuery.orderBy(dbColumn, actualSortOrder);
                    }
                    else {
                        fallbackQuery.orderBy('created_at', 'desc');
                    }
                }
                else {
                    fallbackQuery.orderBy('created_at', 'desc');
                }
                const salesInvoices = await fallbackQuery.paginate(page, limit);
                const queryTime = Date.now() - startTime;
                return response.ok({
                    ...salesInvoices.toJSON(),
                    _meta: {
                        queryTime: queryTime,
                        totalQueries: 'fallback_mode',
                        warning: 'Some relationships may not be fully loaded due to data inconsistencies'
                    }
                });
            }
        }
        catch (error) {
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil data sales invoice',
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
            const salesInvoice = await SalesInvoice.query()
                .where('id', params.id)
                .preload('salesOrder', (soQuery) => {
                soQuery.preload('customer', (customerQuery) => {
                    customerQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp']);
                });
                soQuery.preload('perusahaan', (perusahaanQuery) => {
                    perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan']);
                });
                soQuery.preload('cabang', (cabangQuery) => {
                    cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId']);
                });
                soQuery.preload('salesOrderItems', (soiQuery) => {
                    soiQuery.where('statusPartial', true);
                    soiQuery.preload('product', (productQuery) => {
                        productQuery.preload('unit', (unitQuery) => {
                            unitQuery.select(['id', 'name']);
                        });
                        productQuery.select(['id', 'name', 'priceSell', 'sku', 'unitId']);
                    });
                });
            })
                .preload('customer', (customerQuery) => {
                customerQuery.select(['id', 'name', 'email', 'phone', 'address']);
            })
                .preload('salesInvoiceItems', (siiQuery) => {
                siiQuery.preload('product', (productQuery) => {
                    productQuery.preload('unit', (unitQuery) => {
                        unitQuery.select(['id', 'name']);
                    });
                    productQuery.select(['id', 'name', 'priceSell', 'sku', 'unitId']);
                });
                siiQuery.preload('warehouse', (warehouseQuery) => {
                    warehouseQuery.select(['id', 'name']);
                });
                siiQuery.preload('salesOrderItem', (soiQuery) => {
                    soiQuery.select(['id', 'quantity', 'price', 'subtotal', 'statusPartial', 'deliveredQty']);
                });
            })
                .firstOrFail();
            return response.ok({
                data: salesInvoice.serialize()
            });
        }
        catch (error) {
            return response.notFound({
                message: 'Sales Invoice tidak ditemukan',
                error: error.message
            });
        }
    }
    async store({ request, response }) {
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
        try {
            const payload = await request.validateUsing(salesInvoiceValidator);
            const items = payload.salesInvoiceItems || [];
            if (!payload.customerId) {
                return response.badRequest({
                    message: 'Customer ID harus diisi',
                    error: 'customerId_required'
                });
            }
            if (!payload.date || !payload.dueDate) {
                return response.badRequest({
                    message: 'Tanggal invoice dan jatuh tempo harus diisi',
                    error: 'date_required'
                });
            }
            if (!payload.total || payload.total <= 0) {
                return response.badRequest({
                    message: 'Total invoice harus lebih dari 0',
                    error: 'invalid_total'
                });
            }
            if (payload.salesOrderId) {
                const salesOrder = await db.from('sales_orders').where('id', payload.salesOrderId).first();
                if (!salesOrder) {
                    return response.badRequest({
                        message: 'Sales Order tidak ditemukan',
                        error: 'sales_order_not_found'
                    });
                }
            }
            const customer = await db.from('customers').where('id', payload.customerId).first();
            if (!customer) {
                return response.badRequest({
                    message: 'Customer tidak ditemukan',
                    error: 'customer_not_found'
                });
            }
            const trx = await db.transaction();
            try {
                const SalesInv = await SalesInvoice.create({
                    salesOrderId: payload.salesOrderId || null,
                    customerId: payload.customerId,
                    noInvoice: noInvoice,
                    email: payload.email || '',
                    up: payload.up || '',
                    date: payload.date,
                    dueDate: payload.dueDate,
                    status: payload.status || 'unpaid',
                    discountPercent: payload.discountPercent || 0,
                    taxPercent: payload.taxPercent || 0,
                    dpp: payload.dpp || 0,
                    total: payload.total,
                    paidAmount: payload.paidAmount || 0,
                    remainingAmount: payload.remainingAmount || (payload.total - (payload.paidAmount || 0)),
                    description: payload.description || '',
                }, { client: trx });
                if (items.length > 0) {
                    for (const item of items) {
                        if (item.productId) {
                            const product = await db.from('products').where('id', item.productId).first();
                            if (!product) {
                                throw new Error(`Product dengan ID ${item.productId} tidak ditemukan`);
                            }
                        }
                        if (item.warehouseId) {
                            const warehouse = await db.from('warehouses').where('id', item.warehouseId).first();
                            if (!warehouse) {
                                throw new Error(`Warehouse dengan ID ${item.warehouseId} tidak ditemukan`);
                            }
                        }
                        if (item.salesOrderItemId) {
                            const salesOrderItem = await db.from('sales_order_items').where('id', item.salesOrderItemId).first();
                            if (!salesOrderItem) {
                                throw new Error(`Sales Order Item dengan ID ${item.salesOrderItemId} tidak ditemukan`);
                            }
                        }
                        await SalesInvoiceItem.create({
                            salesInvoiceId: SalesInv.id,
                            salesOrderItemId: item.salesOrderItemId || null,
                            productId: Number(item.productId),
                            warehouseId: item.warehouseId ? Number(item.warehouseId) : null,
                            quantity: Number(item.quantity) || 0,
                            price: Number(item.price) || 0,
                            subtotal: Number(item.subtotal) || 0,
                            description: item.description || '',
                            deliveredQty: Number(item.deliveredQty || 0),
                            isReturned: item.isReturned || false,
                        }, { client: trx });
                    }
                }
                await trx.commit();
                return response.created({
                    message: 'Sales Invoice berhasil dibuat',
                    data: SalesInv,
                });
            }
            catch (error) {
                await trx.rollback();
                console.error('❌ Sales Invoice Creation Error:', error);
                if (error.message.includes('foreign key constraint')) {
                    return response.badRequest({
                        message: 'Data referensi tidak valid. Pastikan customer, product, dan warehouse yang dipilih ada.',
                        error: 'foreign_key_constraint_failed',
                        details: error.message
                    });
                }
                if (error.message.includes('duplicate key')) {
                    return response.badRequest({
                        message: 'Nomor invoice sudah ada. Silakan coba lagi.',
                        error: 'duplicate_invoice_number'
                    });
                }
                return response.internalServerError({
                    message: 'Gagal membuat Sales Invoice',
                    error: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        }
        catch (validationError) {
            console.error('❌ Validation Error:', validationError);
            return response.badRequest({
                message: 'Data yang dikirim tidak valid',
                error: 'validation_failed',
                details: validationError.messages || validationError.message
            });
        }
    }
    async update({ params, request, response }) {
        const trx = await db.transaction();
        try {
            const salesInvoice = await SalesInvoice.findOrFail(params.id);
            const payload = await request.validateUsing(updateSalesInvoiceValidator);
            const items = payload.salesInvoiceItems || [];
            const updateData = {};
            if (payload.salesOrderId !== undefined)
                updateData.salesOrderId = payload.salesOrderId;
            if (payload.customerId !== undefined)
                updateData.customerId = payload.customerId;
            if (payload.email !== undefined)
                updateData.email = payload.email;
            if (payload.up !== undefined)
                updateData.up = payload.up;
            if (payload.date !== undefined)
                updateData.date = payload.date;
            if (payload.dueDate !== undefined)
                updateData.dueDate = payload.dueDate;
            if (payload.status !== undefined)
                updateData.status = payload.status;
            if (payload.discountPercent !== undefined)
                updateData.discountPercent = payload.discountPercent;
            if (payload.taxPercent !== undefined)
                updateData.taxPercent = payload.taxPercent;
            if (payload.dpp !== undefined)
                updateData.dpp = payload.dpp;
            if (payload.total !== undefined)
                updateData.total = payload.total;
            if (payload.paidAmount !== undefined)
                updateData.paidAmount = payload.paidAmount;
            if (payload.remainingAmount !== undefined)
                updateData.remainingAmount = payload.remainingAmount;
            if (payload.description !== undefined)
                updateData.description = payload.description;
            salesInvoice.merge(updateData);
            await salesInvoice.save();
            if (items.length > 0) {
                await SalesInvoiceItem.query({ client: trx })
                    .where('salesInvoiceId', salesInvoice.id)
                    .delete();
                for (const item of items) {
                    await SalesInvoiceItem.create({
                        salesInvoiceId: salesInvoice.id,
                        salesOrderItemId: item.salesOrderItemId,
                        productId: Number(item.productId),
                        warehouseId: Number(item.warehouseId),
                        quantity: Number(item.quantity),
                        price: Number(item.price),
                        subtotal: Number(item.subtotal),
                        description: item.description,
                        deliveredQty: Number(item.deliveredQty || 0),
                        isReturned: item.isReturned || false,
                    }, { client: trx });
                }
            }
            await trx.commit();
            return response.ok({
                message: 'Sales Invoice berhasil diperbarui',
                data: salesInvoice,
            });
        }
        catch (error) {
            console.log('🔍 Update Error:', error);
            await trx.rollback();
            console.error('Update Sales Invoice Error:', error);
            if (error.status === 404) {
                return response.notFound({
                    message: 'Sales Invoice tidak ditemukan',
                });
            }
            return response.internalServerError({
                message: 'Gagal memperbarui Sales Invoice',
                error: error.message,
            });
        }
    }
    async destroy({ params, response }) {
        const trx = await db.transaction();
        try {
            const salesInvoice = await SalesInvoice.findOrFail(params.id);
            if (salesInvoice.status === 'paid') {
                return response.badRequest({
                    message: 'Sales Invoice yang sudah dibayar tidak dapat dihapus',
                });
            }
            await salesInvoice.delete();
            await trx.commit();
            return response.ok({
                message: 'Sales Invoice berhasil dihapus',
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('Delete Sales Invoice Error:', error);
            if (error.status === 404) {
                return response.notFound({
                    message: 'Sales Invoice tidak ditemukan',
                });
            }
            return response.internalServerError({
                message: 'Gagal menghapus Sales Invoice',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=sales_invoices_controller.js.map