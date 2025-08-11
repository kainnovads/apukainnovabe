import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import FPGrowth, { Itemset } from 'node-fpgrowth'
import Perusahaan from '#models/perusahaan'
import Cabang from '#models/cabang'
import Warehouse from '#models/warehouse'
import Product from '#models/product'
import Customer from '#models/customer'
import Vendor from '#models/vendor'

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

    // Step 3: Jalankan FP-Growth
    const fpgrowth = new FPGrowth.FPGrowth<number>(0.25)

    const frequentItemsets: Itemset<number>[] = await fpgrowth.exec(transactions)

    // Buat peta support untuk pencarian cepat
    const supportMap = new Map<string, number>()
    frequentItemsets.forEach(itemset => {
      // Urutkan item untuk memastikan kunci konsisten
      const key = [...itemset.items].sort().join(',')
      supportMap.set(key, itemset.support)
    })

    const minConfidence = 0.6
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
}
