import db from '@adonisjs/lucid/services/db';
import FPGrowth from 'node-fpgrowth';
import Perusahaan from '#models/perusahaan';
import Cabang from '#models/cabang';
import Warehouse from '#models/warehouse';
import Product from '#models/product';
import Customer from '#models/customer';
import Vendor from '#models/vendor';
function getSubsets(array) {
    const subsets = [[]];
    for (const element of array) {
        const last = subsets.length - 1;
        for (let i = 0; i <= last; i++) {
            subsets.push([...subsets[i], element]);
        }
    }
    return subsets.slice(1, subsets.length - 1);
}
export default class AssociationsController {
    async index({ response }) {
        const raw = await db
            .from('sales_order_items')
            .select('sales_order_id', 'product_id')
            .orderBy('sales_order_id', 'asc');
        const grouped = {};
        raw.forEach((item) => {
            if (!grouped[item.sales_order_id]) {
                grouped[item.sales_order_id] = [];
            }
            grouped[item.sales_order_id].push(item.product_id);
        });
        const transactions = Object.values(grouped);
        const fpgrowth = new FPGrowth.FPGrowth(0.25);
        const frequentItemsets = await fpgrowth.exec(transactions);
        const supportMap = new Map();
        frequentItemsets.forEach(itemset => {
            const key = [...itemset.items].sort().join(',');
            supportMap.set(key, itemset.support);
        });
        const minConfidence = 0.6;
        const associationRules = [];
        frequentItemsets.forEach(itemset => {
            if (itemset.items.length > 1) {
                const allSubsets = getSubsets(itemset.items);
                allSubsets.forEach(antecedent => {
                    const antecedentKey = [...antecedent].sort().join(',');
                    const antecedentSupport = supportMap.get(antecedentKey);
                    if (antecedentSupport) {
                        const confidence = itemset.support / antecedentSupport;
                        if (confidence >= minConfidence) {
                            const consequent = itemset.items.filter(item => !antecedent.includes(item));
                            if (consequent.length > 0) {
                                associationRules.push({
                                    antecedent,
                                    consequent,
                                    confidence,
                                    support: itemset.support,
                                });
                            }
                        }
                    }
                });
            }
        });
        const allInvolvedProductIds = [
            ...new Set(associationRules.flatMap(rule => [...rule.antecedent, ...rule.consequent]))
        ];
        const products = await db
            .from('products')
            .whereIn('id', allInvolvedProductIds)
            .select('id', 'name');
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p.name;
        });
        const result = associationRules.map(rule => ({
            antecedent: rule.antecedent.map((id) => productMap[id] || `#${id}`),
            consequent: rule.consequent.map((id) => productMap[id] || `#${id}`),
            support: rule.support,
            confidence: rule.confidence,
        }));
        return response.ok(result);
    }
    async getPerusahaanData({ response }) {
        try {
            const perusahaans = await Perusahaan.query()
                .select(['id', 'nmPerusahaan'])
                .orderBy('nmPerusahaan', 'asc');
            return response.ok(perusahaans);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data perusahaan',
                error: error.message,
            });
        }
    }
    async getCabangData({ response, request }) {
        try {
            const perusahaanId = request.input('perusahaanId');
            let query = Cabang.query()
                .select(['id', 'nmCabang', 'perusahaanId'])
                .orderBy('nmCabang', 'asc');
            if (perusahaanId) {
                query = query.where('perusahaanId', perusahaanId);
            }
            const cabangs = await query;
            return response.ok(cabangs);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data cabang',
                error: error.message,
            });
        }
    }
    async getWarehouseData({ response }) {
        try {
            const warehouses = await Warehouse.query()
                .select(['id', 'name', 'address'])
                .orderBy('name', 'asc');
            return response.ok(warehouses);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data warehouse',
                error: error.message,
            });
        }
    }
    async getProductData({ response }) {
        try {
            const products = await Product.query()
                .select(['id', 'name', 'sku'])
                .orderBy('name', 'asc');
            return response.ok(products);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data product',
                error: error.message,
            });
        }
    }
    async getCustomerData({ response }) {
        try {
            const customers = await Customer.query()
                .select(['id', 'name', 'email'])
                .orderBy('name', 'asc');
            return response.ok(customers);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data customer',
                error: error.message,
            });
        }
    }
    async getVendorData({ response }) {
        try {
            const vendors = await Vendor.query()
                .select(['id', 'name', 'email'])
                .orderBy('name', 'asc');
            return response.ok(vendors);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data vendor',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=associations_controller.js.map