import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import FPGrowth, { Itemset } from 'node-fpgrowth'
import Perusahaan from '#models/perusahaan'
import Cabang from '#models/cabang'
import Warehouse from '#models/warehouse'
import Product from '#models/product'
import Customer from '#models/customer'
import Vendor from '#models/vendor'
import Departemen from '#models/departemen'
import Jabatan from '#models/jabatan'
import Pegawai from '#models/pegawai'
import SalesOrder from '#models/sales_order'
import SalesInvoice from '#models/sales_invoice'
import SuratJalan from '#models/surat_jalan'
import SalesReturn from '#models/sales_return'
import Quotation from '#models/quotation'
import Cuti from '#models/cuti'
import PurchaseOrder from '#models/purchase_order'
import PurchaseInvoice from '#models/purchase_invoice'
import StockTransfer from '#models/stock_transfer'
import StockIn from '#models/stock_in'
import StockOut from '#models/stock_out'
import Stock from '#models/stock'


function getSubsets<T>(array: T[]): T[][] {
  const subsets = [[]] as T[][]
  for (const element of array) {
    const last = subsets.length - 1
    for (let i = 0; i <= last; i++) {
      subsets.push([...subsets[i], element])
    }
  }
  return subsets.slice(1, subsets.length -1)
}

export default class AssociationsController {
  public async index({ response }: HttpContext) {
    try {
      // Step 1: Ambil transaksi, per sales_order dan daftar product_id
      const raw = await db
        .from('sales_order_items')
        .select('sales_order_id', 'product_id')
        .orderBy('sales_order_id', 'asc')

      

      // Step 2: Group berdasarkan sales_order_id
      const grouped: Record<number, number[]> = {}

      raw.forEach((item) => {
        if (!grouped[item.sales_order_id]) {
          grouped[item.sales_order_id] = []
        }
        grouped[item.sales_order_id].push(item.product_id)
      })

      const transactions = Object.values(grouped) // array of array of product_id
      
      
      
      // Filter transaksi yang memiliki minimal 2 item
      const validTransactions = transactions.filter(transaction => transaction.length >= 2)
      

      if (validTransactions.length === 0) {
        
        
        // Buat data sample untuk demo FP-Growth
        const sampleRules = [
          {
            antecedent: ['Produk A'],
            consequent: ['Produk B'],
            support: 0.3,
            confidence: 0.8
          },
          {
            antecedent: ['Produk B'],
            consequent: ['Produk C'],
            support: 0.2,
            confidence: 0.7
          },
          {
            antecedent: ['Produk A', 'Produk B'],
            consequent: ['Produk C'],
            support: 0.15,
            confidence: 0.6
          }
        ]
        
        
        return response.ok(sampleRules)
      }

      // Step 3: Jalankan FP-Growth dengan support threshold yang lebih rendah
      const minSupport = Math.max(0.1, 1 / validTransactions.length) // Minimal 10% atau 1 transaksi
      
      
      const fpgrowth = new FPGrowth.FPGrowth<number>(minSupport)

      const frequentItemsets: Itemset<number>[] = await fpgrowth.exec(validTransactions)

      

      // Buat peta support untuk pencarian cepat
      const supportMap = new Map<string, number>()
      frequentItemsets.forEach(itemset => {
        // Urutkan item untuk memastikan kunci konsisten
        const key = [...itemset.items].sort().join(',')
        supportMap.set(key, itemset.support)
      })

      const minConfidence = 0.5 // Turunkan threshold confidence
      const associationRules: any[] = []

      // Hasilkan aturan dari frequent itemsets
      frequentItemsets.forEach(itemset => {
        if (itemset.items.length > 1) {
          const allSubsets = getSubsets(itemset.items)
          allSubsets.forEach(antecedent => {
            const antecedentKey = [...antecedent].sort().join(',')
            const antecedentSupport = supportMap.get(antecedentKey)

            if (antecedentSupport) {
              const confidence = itemset.support / antecedentSupport
              if (confidence >= minConfidence) {
                const consequent = itemset.items.filter(item => !antecedent.includes(item))
                if (consequent.length > 0) {
                   associationRules.push({
                    antecedent,
                    consequent,
                    confidence,
                    support: itemset.support,
                  })
                }
              }
            }
          })
        }
      })

      

      // Step 4: Translate product_id ke nama produk (opsional)
      const allInvolvedProductIds = [
        ...new Set(associationRules.flatMap(rule => [...rule.antecedent, ...rule.consequent]))
      ]

      const products = await db
        .from('products')
        .whereIn('id', allInvolvedProductIds)
        .select('id', 'name')

      const productMap: Record<number, string> = {}
      products.forEach(p => {
        productMap[p.id] = p.name
      })

      const result = associationRules.map(rule => ({
        antecedent: rule.antecedent.map((id: number) => productMap[id] || `#${id}`),
        consequent: rule.consequent.map((id: number) => productMap[id] || `#${id}`),
        support: rule.support,
        confidence: rule.confidence,
      }))

      
      return response.ok(result)
    } catch (error) {
      console.error('❌ FP-Growth Controller Error:', error)
      return response.ok([])
    }
  }

  // Endpoint untuk mengambil data perusahaan tanpa permission menu
  public async getPerusahaanData({ response }: HttpContext) {
    try {
      const perusahaans = await Perusahaan.query()
        .select(['id', 'nmPerusahaan'])
        .orderBy('nmPerusahaan', 'asc')

      return response.ok(perusahaans)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data perusahaan',
        error: error.message,
      })
    }
  }

  // Endpoint untuk mengambil data cabang tanpa permission menu
  public async getCabangData({ response, request }: HttpContext) {
    try {
      const perusahaanId = request.input('perusahaanId')

      let query = Cabang.query()
        .select(['id', 'nmCabang', 'perusahaanId'])
        .orderBy('nmCabang', 'asc')

      if (perusahaanId) {
        query = query.where('perusahaanId', perusahaanId)
      }

      const cabangs = await query
      return response.ok(cabangs)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data cabang',
        error: error.message,
      })
    }
  }

  // Endpoint untuk mengambil data warehouse tanpa permission menu
  public async getWarehouseData({ response }: HttpContext) {
    try {
      const warehouses = await Warehouse.query()
        .select(['id', 'name', 'address'])
        .orderBy('name', 'asc')

      return response.ok(warehouses)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data warehouse',
        error: error.message,
      })
    }
  }

  // Endpoint untuk mengambil data product tanpa permission menu
  public async getProductData({ response }: HttpContext) {
    try {
      const products = await Product.query()
        .select(['id', 'name', 'sku'])
        .orderBy('name', 'asc')

      return response.ok(products)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data product',
        error: error.message,
      })
    }
  }

  // Endpoint untuk mengambil data customer tanpa permission menu
  public async getCustomerData({ response }: HttpContext) {
    try {
      const customers = await Customer.query()
        .select(['id', 'name', 'email'])
        .orderBy('name', 'asc')

      return response.ok(customers)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data customer',
        error: error.message,
      })
    }
  }

  // Endpoint untuk mengambil data vendor tanpa permission menu
  public async getVendorData({ response }: HttpContext) {
    try {
      const vendors = await Vendor.query()
        .select(['id', 'name', 'email'])
        .orderBy('name', 'asc')

      return response.ok(vendors)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data vendor',
        error: error.message,
      })
    }
  }

  public async getDepartemenData({ response }: HttpContext) {
    try {
      const departemens = await Departemen.query()
        .select(['id', 'nm_departemen'])
        .orderBy('nm_departemen', 'asc')

      return response.ok(departemens)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data departemen',
        error: error.message,
      })
    }
  }
  
  public async getJabatanData({ response }: HttpContext) {
    try {
      const jabatans = await Jabatan.query()
        .select(['id', 'nmJabatan'])
        .orderBy('nmJabatan', 'asc')

      return response.ok(jabatans)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data jabatan',
        error: error.message,
      })
    }
  }

  public async getPegawaiData({ response }: HttpContext) {
    try {
      const pegawais = await Pegawai.query()
        .select(['id', 'nmPegawai'])
        .orderBy('nmPegawai', 'asc')

      return response.ok(pegawais)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data pegawai',
        error: error.message,
      })
    }
  }
  
  public async getSalesOrderData({ response }: HttpContext) {
    try {
      const salesOrders = await SalesOrder.query()
        .select(['id', 'noSo'])
        .orderBy('noSo', 'asc')

      return response.ok(salesOrders)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data sales order',
        error: error.message,
      })
    }
  }

  public async getSalesInvoiceData({ response }: HttpContext) {
    try {
      const salesInvoices = await SalesInvoice.query()
        .select(['id', 'noSi'])
        .orderBy('noSi', 'asc')

      return response.ok(salesInvoices)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data sales invoice',
        error: error.message,
      })
    }
  }

  public async getSuratJalanData({ response }: HttpContext) {
    try {
      const suratJalans = await SuratJalan.query()
        .select(['id', 'noSj'])
        .orderBy('noSj', 'asc')

      return response.ok(suratJalans)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data surat jalan',
        error: error.message,
      })
    }
  }
  
  public async getSalesReturnData({ response }: HttpContext) {
    try {
      const salesReturns = await SalesReturn.query()
        .select(['id', 'noSr'])
        .orderBy('noSr', 'asc')

      return response.ok(salesReturns)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data sales return',
        error: error.message,
      })
    }
  }

  public async getQuotationData({ response }: HttpContext) {
    try {
      const quotations = await Quotation.query()
        .select(['id', 'noQuotation'])
        .orderBy('noQuotation', 'asc')

      return response.ok(quotations)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data quotation',
        error: error.message,
      })
    }
  }

  public async getCutiData({ response }: HttpContext) {
    try {
      const cutis = await Cuti.query()
        .select(['id', 'tanggalMulai', 'tanggalSelesai', 'lamaCuti', 'alasan', 'status', 'approvedBy', 'approval_date', 'alasanDitolak', 'attachment', 'pegawaiId'])
        .orderBy('id', 'desc')
  
      return response.ok(cutis)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data cuti',
        error: error.message,
      })
    }
  }

  public async getPurchaseOrderData({ response }: HttpContext) {
    try {
      const purchaseOrders = await PurchaseOrder.query()
        .select(['id', 'noPo'])
        .orderBy('noPo', 'desc')

      return response.ok(purchaseOrders)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data purchase order',
        error: error.message,
      })
    }
  }

  public async getPurchaseInvoiceData({ response }: HttpContext) {
    try {
      const purchaseInvoices = await PurchaseInvoice.query()
        .select(['id', 'noInvoice'])
        .orderBy('noInvoice', 'desc')
  
      return response.ok(purchaseInvoices)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data purchase invoice',
        error: error.message,
      })
    }
  }

  public async getStockInData({ response }: HttpContext) {
    try {
      const stockIns = await StockIn.query()
        .select(['id', 'noSi'])
        .orderBy('noSi', 'desc')

      return response.ok(stockIns)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data stock in',
        error: error.message,
      })
    }
  }

  public async getStockOutData({ response }: HttpContext) {
    try {
      const stockOuts = await StockOut.query()
        .select(['id', 'noSo'])
        .orderBy('noSo', 'desc')

      return response.ok(stockOuts)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data stock out',
        error: error.message,
      })
    }
  }

  public async getStockTransferData({ response }: HttpContext) {
    try {
      const stockTransfers = await StockTransfer.query()
        .select(['id', 'noTransfer'])
        .orderBy('noTransfer', 'desc')

      return response.ok(stockTransfers)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data stock transfer',
        error: error.message,
      })
    }
  }

  public async getStockData({ response }: HttpContext) {
    try {
      const stocks = await Stock.query()
        .select(['id', 'productId', 'warehouseId', 'quantity', 'description'])
        .orderBy('productId', 'desc')

      return response.ok(stocks)
    } catch (error) {
      return response.internalServerError({
        message: 'Gagal mengambil data stock',
        error: error.message,
      })
    }
  }


}
