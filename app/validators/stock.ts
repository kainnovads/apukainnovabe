import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

// Custom rule untuk memastikan kombinasi productId + warehouseId unik
const uniqueStock = vine.createRule<{ ignoreId?: string }>(async (_value, options, field) => {
  const parent = field.parent?.data as Record<string, any>
  const productId = Number(parent?.productId)
  const warehouseId = Number(parent?.warehouseId)
  if (!productId || !warehouseId) return

  const query = db.from('stocks')
    .where('product_id', productId)
    .andWhere('warehouse_id', warehouseId)

  if (options?.ignoreId) {
    query.andWhereNot('id', options.ignoreId)
  }

  const exists = await query.first()
  if (exists) {
    field.report('Stock untuk produk dan gudang ini sudah ada', 'uniqueStock', field)
  }
})

export function makeStockValidator(ignoreId?: string) {
  return vine.compile(
    vine.object({
      productId  : vine.number().positive(),
      warehouseId: vine.number().positive().use(uniqueStock({ ignoreId })),
      quantity   : vine.number().min(0),
      description: vine.string().trim().maxLength(255).optional(),
    })
  )
}


