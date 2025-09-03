import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import PurchaseInvoice from '#models/purchase_invoice'
import PurchaseOrderItem from '#models/purchase_order_item'
import Product from '#models/product'
import Warehouse from '#models/warehouse'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class PurchaseInvoiceItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(pii: PurchaseInvoiceItem) {
    pii.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare purchaseInvoiceId: string

  @column()
  declare purchaseOrderItemId: string | null

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare price: number

  @column()
  declare subtotal: number

  @column()
  declare description: string | null

  @column()
  declare receivedQty: number | null

  // Relationships
  @column()
  declare warehouseId: number | null

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>

  @belongsTo(() => PurchaseInvoice)
  declare purchaseInvoice: BelongsTo<typeof PurchaseInvoice>

  @belongsTo(() => PurchaseOrderItem)
  declare purchaseOrderItem: BelongsTo<typeof PurchaseOrderItem>

}