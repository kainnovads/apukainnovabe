import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SalesReturn from '#models/sales_return'
import Product from '#models/product'
import { randomUUID } from 'node:crypto'
import Warehouse from '#models/warehouse'
import SalesOrderItem from '#models/sales_order_item'

export default class SalesReturnItem extends BaseModel {
  public static table = 'sales_return_items'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(sri: SalesReturnItem) {
    sri.id = randomUUID()
  }

  @column()
  declare salesReturnId: string

  @column()
  declare salesOrderItemId: string

  @column()
  declare productId: number

  @column()
  declare warehouseId: number

  @column()
  declare quantity: number

  @column()
  declare price: number

  @column()
  declare reason: string

  @column()
  declare description: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => SalesReturn)
  declare salesReturn: BelongsTo<typeof SalesReturn>

  @belongsTo(() => SalesOrderItem)
  declare salesOrderItem: BelongsTo<typeof SalesOrderItem>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>
}