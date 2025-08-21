import SuratJalan from '#models/surat_jalan';
import db from '@adonisjs/lucid/services/db';
import { suratJalanValidator, updateSuratJalanValidator } from '#validators/surat_jalan';
import SuratJalanItem from '#models/surat_jalan_item';
import { toRoman } from '#helper/bulan_romawi';
import Customer from '#models/customer';
import User from '#models/auth/user';
export default class SuratJalansController {
    async index({ request, response }) {
        try {
            const page = request.input('page', 1);
            const limit = request.input('rows', 10);
            const search = request.input('search', '');
            const searchValue = search || request.input('search.value', '');
            const sortField = request.input('sortField');
            const sortOrder = request.input('sortOrder');
            const customerId = request.input('customerId');
            let dataQuery = SuratJalan.query()
                .preload('salesOrder', (soQuery) => {
                soQuery.whereIn('status', ['approved', 'partial', 'delivered']);
                soQuery.select(['id', 'noSo', 'status', 'date', 'dueDate', 'discountPercent', 'taxPercent', 'description', 'customerId', 'perusahaanId', 'cabangId']);
                soQuery.preload('customer', (customerQuery) => {
                    customerQuery.select(['id', 'name', 'email', 'phone', 'npwp']);
                });
                soQuery.preload('perusahaan', (perusahaanQuery) => {
                    perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'npwpPerusahaan', 'kodePerusahaan', 'logoPerusahaan']);
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
                .preload('createdByUser', (userQuery) => {
                userQuery.select(['id', 'full_name', 'email']);
            })
                .preload('suratJalanItems', (siiQuery) => {
                siiQuery.preload('product', (productQuery) => {
                    productQuery.select(['id', 'name', 'priceSell', 'sku']);
                });
                siiQuery.preload('warehouse', (warehouseQuery) => {
                    warehouseQuery.select(['id', 'name']);
                });
                siiQuery.preload('salesOrderItem', (soiQuery) => {
                    soiQuery.where('statusPartial', true);
                    soiQuery.select(['id', 'quantity', 'price', 'subtotal', 'statusPartial']);
                });
            });
            if (customerId) {
                dataQuery.where('customer_id', customerId);
            }
            if (searchValue) {
                const lowerSearch = searchValue.toLowerCase();
                dataQuery = dataQuery.where((query) => {
                    query
                        .whereRaw('LOWER(surat_jalans.no_surat_jalan) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereRaw('LOWER(surat_jalans.description) LIKE ?', [`%${lowerSearch}%`])
                        .orWhereExists((salesOrderQuery) => {
                        salesOrderQuery
                            .from('sales_orders')
                            .whereColumn('sales_orders.id', 'surat_jalans.sales_order_id')
                            .whereRaw('LOWER(sales_orders.no_so) LIKE ?', [`%${lowerSearch}%`]);
                    })
                        .orWhereExists((customerQuery) => {
                        customerQuery
                            .from('customers')
                            .whereColumn('customers.id', 'surat_jalans.customer_id')
                            .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`]);
                    })
                        .orWhereExists((userQuery) => {
                        userQuery
                            .from('users')
                            .whereColumn('users.id', 'surat_jalans.created_by')
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
                        customer: { table: 'customers', foreignKey: 'surat_jalans.customer_id', primaryKey: 'customers.id' },
                        salesOrder: { table: 'sales_orders', foreignKey: 'surat_jalans.sales_order_id', primaryKey: 'sales_orders.id' },
                        createdByUser: { table: 'users as created_users', foreignKey: 'surat_jalans.created_by', primaryKey: 'created_users.id' },
                    };
                    if (relation in relationJoinInfo) {
                        const joinInfo = relationJoinInfo[relation];
                        dataQuery
                            .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
                            .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
                            .select('surat_jalans.*');
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
                const suratJalans = await dataQuery.paginate(page, limit);
                const queryTime = Date.now() - startTime;
                if (queryTime > 1000) {
                    console.warn(`🐌 Slow Query Alert: Surat Jalans took ${queryTime}ms`);
                }
                return response.ok({
                    ...suratJalans.toJSON(),
                    _meta: {
                        queryTime: queryTime,
                        totalQueries: 'optimized'
                    }
                });
            }
            catch (preloadError) {
                console.warn('⚠️  Preloading error, falling back to basic query:', preloadError.message);
                const fallbackQuery = SuratJalan.query()
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
                });
                if (customerId) {
                    fallbackQuery.where('customer_id', customerId);
                }
                if (searchValue) {
                    const lowerSearch = searchValue.toLowerCase();
                    fallbackQuery.where((query) => {
                        query
                            .whereRaw('LOWER(surat_jalans.no_surat_jalan) LIKE ?', [`%${lowerSearch}%`])
                            .orWhereRaw('LOWER(surat_jalans.description) LIKE ?', [`%${lowerSearch}%`])
                            .orWhereExists((salesOrderQuery) => {
                            salesOrderQuery
                                .from('sales_orders')
                                .whereColumn('sales_orders.id', 'surat_jalans.sales_order_id')
                                .whereRaw('LOWER(sales_orders.no_so) LIKE ?', [`%${lowerSearch}%`]);
                        })
                            .orWhereExists((customerQuery) => {
                            customerQuery
                                .from('customers')
                                .whereColumn('customers.id', 'surat_jalans.customer_id')
                                .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`]);
                        })
                            .orWhereExists((userQuery) => {
                            userQuery
                                .from('users')
                                .whereColumn('users.id', 'surat_jalans.created_by')
                                .whereRaw('LOWER(users.full_name) LIKE ?', [`%${lowerSearch}%`]);
                        });
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
                const suratJalans = await fallbackQuery.paginate(page, limit);
                const queryTime = Date.now() - startTime;
                return response.ok({
                    ...suratJalans.toJSON(),
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
                message: 'Terjadi kesalahan saat mengambil data surat jalan',
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
            const suratJalan = await SuratJalan.query()
                .where('id', params.id)
                .preload('salesOrder', (soQuery) => {
                soQuery.whereIn('status', ['approved', 'partial', 'delivered']);
                soQuery.preload('customer', (customerQuery) => {
                    customerQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp']);
                });
                soQuery.preload('perusahaan', (perusahaanQuery) => {
                    perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'logoPerusahaan', 'npwpPerusahaan', 'kodePerusahaan']);
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
                .preload('createdByUser', (userQuery) => {
                userQuery.select(['id', 'full_name', 'email']);
            })
                .preload('suratJalanItems', (siiQuery) => {
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
                    soiQuery.where('statusPartial', true);
                    soiQuery.select(['id', 'quantity', 'price', 'subtotal', 'statusPartial', 'deliveredQty']);
                });
            })
                .firstOrFail();
            return response.ok({
                data: suratJalan.serialize()
            });
        }
        catch (error) {
            return response.notFound({
                message: 'Surat Jalan tidak ditemukan',
                error: error.message
            });
        }
    }
    async store({ auth, request, response }) {
        const user = await User.findOrFail(auth.user.id);
        const payload = await request.validateUsing(suratJalanValidator);
        const items = payload.suratJalanItems || [];
        const now = new Date();
        const bulan = now.getMonth() + 1;
        const tahun = String(now.getFullYear()).slice(-2);
        const bulanRomawi = toRoman(bulan);
        const customer = await Customer.find(payload.customerId);
        if (!customer) {
            return response.badRequest({
                message: 'Customer tidak ditemukan'
            });
        }
        const customerAbbreviation = customer.name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 3)
            .padEnd(3, 'X');
        const currentMonthPattern = `/${bulanRomawi}/${tahun}`;
        const lastNumber = await SuratJalan.query()
            .whereRaw(`no_surat_jalan LIKE '%${currentMonthPattern}'`)
            .orderByRaw(`CAST(SUBSTRING(no_surat_jalan, 1, 4) AS INTEGER) DESC`)
            .first();
        let nextNumber = 1;
        if (lastNumber && lastNumber.noSuratJalan) {
            const match = lastNumber.noSuratJalan.match(/^(\d{4})\//);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        const noUrut = String(nextNumber).padStart(4, '0');
        const noSuratJalan = `${noUrut}/SJ/${customerAbbreviation}/${bulanRomawi}/${tahun}`;
        const trx = await db.transaction();
        try {
            const suratJalan = await SuratJalan.create({
                salesOrderId: payload.salesOrderId,
                customerId: payload.customerId,
                noSuratJalan: noSuratJalan,
                picName: payload.picName,
                penerima: payload.penerima,
                date: payload.date,
                description: payload.description || '',
                alamatPengiriman: payload.alamatPengiriman || '',
                createdBy: user.id,
            }, { client: trx });
            for (const item of items) {
                await SuratJalanItem.create({
                    suratJalanId: suratJalan.id,
                    salesOrderItemId: item.salesOrderItemId,
                    productId: Number(item.productId),
                    warehouseId: Number(item.warehouseId),
                    quantity: Number(item.quantity),
                    description: item.description,
                }, { client: trx });
            }
            await trx.commit();
            return response.created({
                message: 'Surat Jalan berhasil dibuat',
                data: suratJalan,
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('Surat Jalan Error:', error);
            return response.internalServerError({
                message: 'Gagal membuat Surat Jalan',
            });
        }
    }
    async update({ params, request, response }) {
        const trx = await db.transaction();
        try {
            const suratJalan = await SuratJalan.findOrFail(params.id, { client: trx });
            const payload = await request.validateUsing(updateSuratJalanValidator);
            const items = payload.suratJalanItems || [];
            console.log('🔍 Update payload received:', JSON.stringify(payload, null, 2));
            console.log('🔍 Items count:', items.length);
            console.log('🔍 Payload description value:', `"${payload.description}"`);
            console.log('🔍 Payload description type:', typeof payload.description);
            console.log('🔍 Payload description length:', payload.description?.length);
            const updateData = {};
            if (payload.salesOrderId !== undefined)
                updateData.salesOrderId = payload.salesOrderId;
            if (payload.customerId !== undefined)
                updateData.customerId = payload.customerId;
            if (payload.picName !== undefined)
                updateData.picName = payload.picName;
            if (payload.penerima !== undefined)
                updateData.penerima = payload.penerima;
            if (payload.date !== undefined)
                updateData.date = payload.date;
            if ('description' in payload) {
                updateData.description = payload.description || '';
            }
            if ('alamatPengiriman' in payload) {
                updateData.alamatPengiriman = payload.alamatPengiriman || '';
            }
            console.log('🔍 Update data to be saved:', updateData);
            console.log('🔍 Before merge - current data:', {
                description: suratJalan.description,
                alamatPengiriman: suratJalan.alamatPengiriman,
                picName: suratJalan.picName
            });
            suratJalan.merge(updateData);
            console.log('🔍 After merge - updated data:', {
                description: suratJalan.description,
                alamatPengiriman: suratJalan.alamatPengiriman,
                picName: suratJalan.picName
            });
            suratJalan.useTransaction(trx);
            await suratJalan.save();
            if (Object.keys(updateData).length > 0) {
                const dbUpdateData = {};
                if ('salesOrderId' in updateData)
                    dbUpdateData.sales_order_id = updateData.salesOrderId;
                if ('customerId' in updateData)
                    dbUpdateData.customer_id = updateData.customerId;
                if ('picName' in updateData)
                    dbUpdateData.pic_name = updateData.picName;
                if ('penerima' in updateData)
                    dbUpdateData.penerima = updateData.penerima;
                if ('date' in updateData)
                    dbUpdateData.date = updateData.date;
                if ('description' in updateData)
                    dbUpdateData.description = updateData.description;
                if ('alamatPengiriman' in updateData)
                    dbUpdateData.alamat_pengiriman = updateData.alamatPengiriman;
                await trx.from('surat_jalans')
                    .where('id', suratJalan.id)
                    .update(dbUpdateData);
                console.log('🔍 Direct query update executed with data:', dbUpdateData);
            }
            console.log('🔍 After save - final data:', {
                description: suratJalan.description,
                alamatPengiriman: suratJalan.alamatPengiriman,
                picName: suratJalan.picName
            });
            await SuratJalanItem.query({ client: trx })
                .where('suratJalanId', suratJalan.id)
                .delete();
            if (items.length > 0) {
                for (const item of items) {
                    await SuratJalanItem.create({
                        suratJalanId: suratJalan.id,
                        salesOrderItemId: item.salesOrderItemId || undefined,
                        productId: Number(item.productId),
                        warehouseId: Number(item.warehouseId),
                        quantity: Number(item.quantity),
                        description: item.description,
                    }, { client: trx });
                }
            }
            await trx.commit();
            const verifyData = await SuratJalan.find(suratJalan.id);
            console.log('🔍 Verification - Data in database after commit:', {
                id: verifyData?.id,
                description: verifyData?.description,
                alamatPengiriman: verifyData?.alamatPengiriman,
                picName: verifyData?.picName
            });
            return response.ok({
                message: 'Surat Jalan berhasil diperbarui',
                data: verifyData || suratJalan,
            });
        }
        catch (error) {
            console.log('🔍 Update Error:', error);
            await trx.rollback();
            console.error('Update Surat Jalan Error:', error);
            if (error.status === 404) {
                return response.notFound({
                    message: 'Surat Jalan tidak ditemukan',
                });
            }
            return response.internalServerError({
                message: 'Gagal memperbarui Surat Jalan',
                error: error.message,
            });
        }
    }
    async destroy({ params, response }) {
        const trx = await db.transaction();
        try {
            const suratJalan = await SuratJalan.findOrFail(params.id);
            await SuratJalanItem.query({ client: trx })
                .where('suratJalanId', suratJalan.id)
                .delete();
            await suratJalan.delete();
            await trx.commit();
            return response.ok({
                message: 'Surat Jalan berhasil dihapus',
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('Delete Surat Jalan Error:', error);
            if (error.status === 404) {
                return response.notFound({
                    message: 'Surat Jalan tidak ditemukan',
                });
            }
            return response.internalServerError({
                message: 'Gagal menghapus Surat Jalan',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=surat_jalans_controller.js.map