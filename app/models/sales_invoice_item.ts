import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import SalesInvoice from './sales_invoice.js'
import SalesOrderItem from './sales_order_item.js'
import Product from './product.js'
import Warehouse from './warehouse.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class SalesInvoiceItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(item: SalesInvoiceItem) {
    item.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare salesInvoiceId: string

  @column()
  declare salesOrderItemId: string

  @column()
  declare productId: number

  @column()
  declare warehouseId: number | null

  @column()
  declare quantity: number

  @column()
  declare price: number

  @column()
  declare subtotal: number

  @column()
  declare description: string | null

  @column()
  declare deliveredQty: number

  @column()
  declare isReturned: boolean

  // Relationships
  @belongsTo(() => SalesInvoice)
  declare salesInvoice: BelongsTo<typeof SalesInvoice>

  @belongsTo(() => SalesOrderItem)
  declare salesOrderItem: BelongsTo<typeof SalesOrderItem>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>
} 