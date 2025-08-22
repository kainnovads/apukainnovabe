import Cabang from "#models/cabang"
import Customer from "#models/customer"
import Quotation from "#models/quotation"
import QuotationItem from "#models/quotation_item"
import { quotationValidator, updateQuotationValidator } from "#validators/quotation"
import type { HttpContext } from "@adonisjs/core/http"
import db from "@adonisjs/lucid/services/db"
import { toRoman } from '#helper/bulan_romawi'

export default class QuotationsController {
    async index({ request, response }: HttpContext) {
        try {
            const page         = request.input('page', 1)
            const limit        = request.input('rows', 10)
            const search       = request.input('search', '')
            const searchValue  = search || request.input('search.value', '')
            const sortField    = request.input('sortField')
            const sortOrder    = request.input('sortOrder')
            const includeItems = request.input('includeItems', false)
            const customerId   = request.input('customerId')
            const status       = request.input('status')

            // ✅ OPTIMASI: Efficient base query dengan minimal preloading
            let dataQuery = Quotation.query()
              .preload('customer', (query) => {
                query.select(['id', 'name', 'email', 'phone'])
              })
              .preload('perusahaan', (query) => {
                query.select(['id', 'nmPerusahaan'])
              })
              .preload('cabang', (query) => {
                query.select(['id', 'nmCabang', 'perusahaanId'])
              })
              .preload('createdByUser', (query) => {
                query.select(['id', 'full_name', 'email'])
              })
              .preload('approvedByUser', (query) => {
                query.select(['id', 'full_name'])
              })

            if (customerId) {
              dataQuery.where('customer_id', customerId)
            }
            if (status) {
              dataQuery.where('status', status)
            }

            // ✅ OPTIMASI: Conditional preloading untuk performance
            if (includeItems) {
              dataQuery.preload('quotationItems', (query) => {
                query.preload('product', (productQuery) => {
                  productQuery.select(['id', 'name', 'priceBuy', 'priceSell', 'sku'])
                })
              })
            }

            if (searchValue) {
              // ✅ OPTIMASI: Menggunakan exists() untuk relationship search
              const lowerSearch = searchValue.toLowerCase()
              dataQuery = dataQuery.where((query) => {
                query
                    .whereRaw('LOWER(no_quotation) LIKE ?', [`%${lowerSearch}%`])
                    .orWhereRaw('LOWER(status) LIKE ?', [`%${lowerSearch}%`])
                    .orWhereRaw('LOWER(description) LIKE ?', [`%${lowerSearch}%`])
                    .orWhereExists((customerQuery) => {
                      customerQuery
                        .from('customers')
                        .whereColumn('customers.id', 'quotations.customer_id')
                        .whereRaw('LOWER(customers.name) LIKE ?', [`%${lowerSearch}%`])
                    })
                    .orWhereExists((userQuery) => {
                      userQuery
                        .from('users')
                        .whereColumn('users.id', 'quotations.created_by')
                        .whereRaw('LOWER(users.full_name) LIKE ?', [`%${lowerSearch}%`])
                    })
              })
            }

            // ✅ OPTIMASI: Efficient sorting dengan proper indexing
            let customOrder = false
            if (sortField && sortOrder) {
              customOrder = true
              const actualSortOrder = sortOrder === '1' ? 'asc' : 'desc'
              const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

              if (sortField.includes('.')) {
                  const [relation, column] = sortField.split('.')
                  const dbColumn = toSnakeCase(column)

                  // ✅ OPTIMASI: Efficient joins dengan nama tabel yang benar
                  const relationJoinInfo: Record<string, { table: string, foreignKey: string, primaryKey: string }> = {
                    customer: { table: 'customers', foreignKey: 'quotations.customer_id', primaryKey: 'customers.id' },
                    perusahaan: { table: 'perusahaan', foreignKey: 'quotations.perusahaan_id', primaryKey: 'perusahaan.id' },
                    cabang: { table: 'cabang', foreignKey: 'quotations.cabang_id', primaryKey: 'cabang.id' },
                    createdByUser: { table: 'users as created_users', foreignKey: 'quotations.created_by', primaryKey: 'created_users.id' },
                    approvedByUser: { table: 'users as approved_users', foreignKey: 'quotations.approved_by', primaryKey: 'approved_users.id' },
                    receivedByUser: { table: 'users as received_users', foreignKey: 'quotations.received_by', primaryKey: 'received_users.id' },
                  }

                  if (relation in relationJoinInfo) {
                    const joinInfo = relationJoinInfo[relation]
                    dataQuery
                      .leftJoin(joinInfo.table, joinInfo.foreignKey, joinInfo.primaryKey)
                      .orderBy(`${joinInfo.table.split(' as ')[0]}.${dbColumn}`, actualSortOrder)
                      .select('quotations.*')
                  }
              } else {
                  const dbColumn = toSnakeCase(sortField)
                  dataQuery.orderBy(dbColumn, actualSortOrder)
              }
            }

            // ✅ Default ordering dengan data terbaru di atas
            if (!customOrder) {
              dataQuery.orderBy('created_at', 'desc').orderBy('id', 'desc')
            } else {
              // ✅ Tambahkan secondary ordering untuk memastikan konsistensi
              // Jika sorting bukan berdasarkan created_at, tambahkan created_at sebagai secondary sort
              if (sortField !== 'created_at' && !sortField.includes('created_at')) {
                dataQuery.orderBy('created_at', 'desc').orderBy('id', 'desc')
              }
            }

            // ✅ OPTIMASI: Add query performance monitoring
            const startTime = Date.now()
            const quotation = await dataQuery.paginate(page, limit)
            const queryTime = Date.now() - startTime

            // ✅ Log slow queries untuk monitoring
            if (queryTime > 1000) {
              console.warn(`🐌 Slow Query Alert: Quotations took ${queryTime}ms`)
            }

            // ✅ Log sorting info untuk debugging
            console.log(`📊 Quotations sorted by: ${customOrder ? `${sortField} ${sortOrder === '1' ? 'ASC' : 'DESC'}` : 'created_at DESC (default)'}`)

            return response.ok({
              ...quotation.toJSON(),
              _meta: {
                queryTime: queryTime,
                totalQueries: 'optimized'
              }
            })
            } catch (error) {
            return response.internalServerError({
                message: 'Terjadi kesalahan saat mengambil data quotation',
                error: {
                    name   : error.name,
                    status : error.status || 500,
                    code   : error.code,
                    message: error.message,
                },
            })
        }
    }

    async show({ params, response }: HttpContext) {
        try {
            // ✅ OPTIMASI: Efficient single record query
            const quotation = await Quotation.query()
            .where('id', params.id)
            .preload('customer', (customerQuery) => {
              customerQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
            })
            .preload('perusahaan', (perusahaanQuery) => {
              perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'logoPerusahaan'])
            })
            .preload('cabang', (cabangQuery) => {
              cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
            })
            .preload('quotationItems', (quotationItemsQuery) => {
                quotationItemsQuery.preload('product', (productQuery) => {
                  productQuery.select(['id', 'name', 'priceBuy', 'priceSell', 'sku', 'description'])
                })
            })
            .preload('createdByUser', (createdByUserQuery) => {
              createdByUserQuery.select(['id', 'full_name', 'email'])
            })
            .preload('approvedByUser', (approvedByUserQuery) => {
              approvedByUserQuery.select(['id', 'full_name', 'email'])
            })
            .preload('rejectedByUser', (rejectedByUserQuery) => {
              rejectedByUserQuery.select(['id', 'full_name', 'email'])
            })
            .firstOrFail()

            return response.ok({
            message: 'Quotation ditemukan',
            data: quotation,
            })
        } catch (error) {
            return response.notFound({ message: 'Quotation tidak ditemukan' })
        }
    }

    async store({ request, response }: HttpContext) {
        // Fungsi generateNo untuk no_quot dengan format 0000/APU/QUOT/Bulan dalam angka romawi/tahun
        async function generateNo() {
            // Ambil nomor urut terakhir dari QUOT bulan ini
            const now   = new Date()
            const bulan = now.getMonth() + 1
            const tahun = now.getFullYear()

            // Konversi bulan ke angka romawi
            const bulanRomawi = toRoman(bulan)

            // Cari nomor urut terakhir untuk bulan dan tahun ini
            const lastQuotation = await Quotation
                .query()
                .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulan])
                .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun])
                .orderBy('no_quotation', 'desc')
                .first()

            let lastNumber = 0
            if (lastQuotation && lastQuotation.noQuotation) {
                // Ambil 4 digit pertama dari no_quot terakhir
                const match = lastQuotation.noQuotation.match(/^(\d{4})/)
                if (match) {
                    lastNumber = parseInt(match[1], 10)
                }
            }
            const nextNumber = (lastNumber + 1).toString().padStart(4, '0')

            // Format: 0000/APU/QUOT/BULAN_ROMAWI/TAHUN
            return `${nextNumber}/APU/QUOT/${bulanRomawi}/${tahun}`
        }

        const payload = await request.validateUsing(quotationValidator)

        const items = payload.quotationItems || []

        if (!Array.isArray(items) || items.length === 0) {
        return response.badRequest({ message: 'Items tidak boleh kosong ya' })
        }

        // ✅ NEW: Validasi bahwa semua produk adalah produk customer
        const customer = await Customer.find(payload.customerId)
        if (!customer) {
            return response.badRequest({ message: 'Customer tidak ditemukan' })
        }

        // Ambil produk yang dimiliki customer
        await customer.load('products')
        const customerProductIds = customer.products.map((p: any) => p.id)

        // Validasi setiap item
        for (const item of items) {
            if (!customerProductIds.includes(item.productId)) {
                return response.badRequest({
                    message: `Produk dengan ID ${item.productId} tidak dimiliki oleh customer yang dipilih`
                })
            }
        }

        const trx = await db.transaction()

        try {
            const subtotal = items.reduce(
                (sum, item) => sum + item.quantity * item.price,
                0
            )

            const discount      = subtotal * (payload.discountPercent || 0) / 100
            const afterDiscount = subtotal - discount
            const tax           = afterDiscount * (payload.taxPercent || 0) / 100
            const total         = afterDiscount + tax

            const quotation = await Quotation.create({
                customerId         : payload.customerId,
                perusahaanId     : payload.perusahaanId,
                cabangId         : payload.cabangId,
                noQuotation      : await generateNo(),
                up               : payload.up,
                date             : payload.date,
                validUntil       : payload.validUntil,
                shipDate         : payload.shipDate,
                fobPoint         : payload.fobPoint,
                termsOfPayment   : payload.termsOfPayment,
                prNumber         : payload.prNumber,
                status           : payload.status || 'draft',
                discountPercent  : payload.discountPercent || 0,
                taxPercent       : payload.taxPercent || 0,
                total,
                createdBy  : payload.createdBy,
                approvedBy : payload.approvedBy,
                rejectedBy : payload.rejectedBy,
                approvedAt : payload.approvedAt,
                rejectedAt : payload.rejectedAt,
                description: payload.description,
            }, { client: trx })

            for (const item of items) {
                await QuotationItem.create({
                quotationId: quotation.id,
                productId      : item.productId,
                quantity       : item.quantity,
                price          : item.price,
                description    : item.description,
                subtotal       : item.subtotal,
                }, { client: trx })
            }

            await trx.commit()

            return response.created({
                message: 'Quotation berhasil dibuat',
                data: quotation,
            })
            } catch (error) {
            await trx.rollback()
            console.error('Quotation Error:', error)
            return response.internalServerError({
                message: 'Gagal membuat Quotation',
                error: {
                    name: error.name,
                    message: error.message,
                    code: error.code,
                    constraint: error.constraint || null,
                    detail: error.detail || null,
                }
            })
        }
    }

    async update({ params, request, response }: HttpContext) {
        const payload = await request.validateUsing(updateQuotationValidator)
        const items = payload.quotationItems || []

        if (!Array.isArray(items) || items.length === 0) {
            return response.badRequest({ message: 'Items tidak boleh kosong' })
        }

        // ✅ NEW: Validasi bahwa semua produk adalah produk customer
        const customer = await Customer.find(payload.customerId)
        if (!customer) {
            return response.badRequest({ message: 'Customer tidak ditemukan' })
        }

        // Ambil produk yang dimiliki customer
        await customer.load('products')
        const customerProductIds = customer.products.map((p: any) => p.id)

        // Validasi setiap item
        for (const item of items) {
            if (!customerProductIds.includes(item.productId)) {
                return response.badRequest({
                    message: `Produk dengan ID ${item.productId} tidak dimiliki oleh customer yang dipilih`
                })
            }
        }

        const trx = await db.transaction()

        try {
            const quotation = await Quotation.findOrFail(params.id, { client: trx })

            const subtotal      = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
            const discount      = subtotal * (payload.discountPercent || 0) / 100
            const afterDiscount = subtotal - discount
            const tax           = afterDiscount * (payload.taxPercent || 0) / 100
            const total         = afterDiscount + tax

            // Update PO utama
            quotation.merge({
            customerId     : payload.customerId,
            perusahaanId   : payload.perusahaanId,
            cabangId       : payload.cabangId,
            up             : payload.up,
            date           : payload.date,
            validUntil     : payload.validUntil,
            shipDate       : payload.shipDate,
            fobPoint       : payload.fobPoint,
            termsOfPayment : payload.termsOfPayment,
            prNumber       : payload.prNumber,
            status         : payload.status || 'draft',
            discountPercent: payload.discountPercent || 0,
            taxPercent     : payload.taxPercent || 0,
            total,
            createdBy  : payload.createdBy,
            approvedBy : payload.approvedBy,
            rejectedBy : payload.rejectedBy,
            approvedAt : payload.approvedAt,
            rejectedAt : payload.rejectedAt,
            description: payload.description,
            })
            await quotation.save()

            // Hapus item lama lalu insert ulang
            await QuotationItem.query({ client: trx })
            .where('quotation_id', quotation.id)
            .delete()

            for (const item of items) {
            await QuotationItem.create({
                    quotationId: quotation.id,
                    productId      : item.productId,
                    quantity       : item.quantity,
                    price          : item.price,
                    description    : item.description,
                    subtotal       : item.subtotal,
                }, { client: trx })
            }

            await trx.commit()

            return response.ok({
            message: 'Quotation berhasil diperbarui',
            data: quotation,
            })
        } catch (error) {
            await trx.rollback()
            console.error('Quotation Update Error:', error)
            return response.internalServerError({ message: 'Gagal memperbarui Quotation' })
        }
    }

    async destroy({ params, response }: HttpContext) {
        try {
            const quotation = await Quotation.find(params.id)
            if (!quotation) {
                return response.notFound({ message: 'Quotation tidak ditemukan' })
            }
            await quotation.delete()
            return response.ok({ message: 'Quotation berhasil dihapus' })
            } catch (error) {
                return response.internalServerError({
                message: 'Gagal menghapus quotation',
                error: error.message,
                })
        }
    }

    async approveQuotation({ params, response, auth }: HttpContext) {
        try {
            const quotation = await Quotation.find(params.id)
            if (!quotation) {
                return response.notFound({ message: 'Quotation tidak ditemukan' })
            }

            quotation.status = 'approved'
            quotation.approvedAt = new Date()
            if (auth.user) {
                quotation.approvedBy = auth.user.id
            }
            await quotation.save()

            return response.ok({ message: 'Quotation berhasil diapprove' })
        } catch (error) {
            return response.internalServerError({ message: 'Gagal mengapprove quotation' })
        }
    }

    async rejectQuotation({ params, response, auth }: HttpContext) {
        try {
            const quotation = await Quotation.find(params.id)
            if (!quotation) {
                return response.notFound({ message: 'Quotation tidak ditemukan' })
            }

            quotation.status = 'rejected'
            quotation.rejectedAt = new Date()
            if (auth.user) {
                quotation.rejectedBy = auth.user.id
            }
            await quotation.save()

            return response.ok({ message: 'Quotation berhasil direject' })
        } catch (error) {
            return response.internalServerError({ message: 'Gagal mereject quotation' })
        }
    }

    async getQuotationDetails({ params, response }: HttpContext) {
      try {
        // ✅ OPTIMASI: Efficient detailed query with select specific fields
        const quotation = await Quotation.query()
        .where('id', params.id)
        .preload('customer', (customerQuery) => {
          customerQuery.select(['id', 'name', 'email', 'phone', 'address', 'npwp'])
        })
        .preload('perusahaan', (perusahaanQuery) => {
          perusahaanQuery.select(['id', 'nmPerusahaan', 'alamatPerusahaan', 'tlpPerusahaan', 'emailPerusahaan', 'logoPerusahaan'])
        })
        .preload('cabang', (cabangQuery) => {
          cabangQuery.select(['id', 'nmCabang', 'alamatCabang', 'perusahaanId'])
        })
        .preload('quotationItems', (quotationItemsQuery) => {
            quotationItemsQuery.preload('product', (productQuery) => {
              productQuery.select(['id', 'name', 'priceBuy', 'priceSell', 'sku'])
            })
        })
        .preload('createdByUser', (createdByUserQuery) => {
          createdByUserQuery.select(['id', 'full_name', 'email'])
        })
        .preload('approvedByUser', (approvedByUserQuery) => {
          approvedByUserQuery.select(['id', 'full_name', 'email'])
        })
        .preload('rejectedByUser', (rejectedByUserQuery) => {
          rejectedByUserQuery.select(['id', 'full_name', 'email'])
        })
        .firstOrFail()

        return response.ok({
            message: 'Quotation ditemukan',
            data: quotation,
        })
      } catch (error) {
        console.error('Error in getQuotationDetails:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status
        });

        return response.notFound({ message: 'Quotation tidak ditemukan' })
      }
    }

    async getCabangbyPerusahaan({ request, response }: HttpContext) {
        const perusahaanId = request.input('perusahaanId')

        // ✅ OPTIMASI: Select specific fields dan cache untuk performance
        const cabang = await Cabang.query()
        .select(['id', 'nmCabang', 'alamatCabang', 'kodeCabang', 'perusahaanId'])
        .where('perusahaanId', perusahaanId)

        return response.ok(cabang)
    }
}
