import db from '@adonisjs/lucid/services/db'

/**
 * ✅ OPTIMIZED: Helper class untuk validasi yang efisien
 */
export class ValidationHelper {
  /**
   * Validasi apakah produk-produk tertentu dimiliki oleh customer
   * @param customerId ID customer
   * @param productIds Array ID produk yang akan divalidasi
   * @returns Array ID produk yang tidak valid (tidak dimiliki customer)
   */
  static async validateCustomerProducts(customerId: number, productIds: number[]): Promise<number[]> {
    if (!productIds || productIds.length === 0) {
      return []
    }

    // ✅ Single query untuk validasi produk customer
    const validProductsResult = await db
      .from('product_customers')
      .where('customer_id', customerId)
      .whereIn('product_id', productIds)
      .select('product_id')
      
    const validProductIds = validProductsResult.map(row => row.product_id)
      
    // Return produk yang tidak valid
    return productIds.filter(id => !validProductIds.includes(id))
  }

  /**
   * Validasi apakah produk-produk tersedia dalam sistem
   * @param productIds Array ID produk yang akan divalidasi
   * @returns Array ID produk yang tidak valid (tidak ditemukan)
   */
  static async validateProductsExist(productIds: number[]): Promise<number[]> {
    if (!productIds || productIds.length === 0) {
      return []
    }

    // ✅ Query untuk cek produk yang tersedia
    const validProductsResult = await db
      .from('products')
      .whereIn('id', productIds)
      .select('id')
      
    const validProductIds = validProductsResult.map(row => row.id)
      
    // Return produk yang tidak ditemukan
    return productIds.filter(id => !validProductIds.includes(id))
  }

  /**
   * Validasi stock availability untuk produk di warehouse tertentu
   * @param items Array berisi {productId, warehouseId, quantity}
   * @returns Array item yang tidak memiliki stock cukup
   */
  static async validateStockAvailability(items: Array<{productId: number, warehouseId: number, quantity: number}>): Promise<Array<{productId: number, warehouseId: number, required: number, available: number}>> {
    if (!items || items.length === 0) {
      return []
    }

    const insufficientItems = []

    for (const item of items) {
      const stock = await db
        .from('stocks')
        .where('product_id', item.productId)
        .where('warehouse_id', item.warehouseId)
        .first()

      const availableQty = stock?.quantity || 0
      
      if (availableQty < item.quantity) {
        insufficientItems.push({
          productId: item.productId,
          warehouseId: item.warehouseId,
          required: item.quantity,
          available: availableQty
        })
      }
    }

    return insufficientItems
  }
}
