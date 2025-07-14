import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import SalesOrder from '#models/sales_order'
import Product from '#models/product'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Warehouse from '#models/warehouse'
import { randomUUID } from 'node:crypto'
import SalesReturnItem from '#models/sales_return_item'

export default class SalesOrderItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

   @beforeCreate()
  static assignUuid(soi: SalesOrderItem) {
    soi.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare salesOrderId: string

  @column()
  declare productId: number

  @column()
  declare warehouseId: number

  @column()
  declare quantity: number

  @column()
  declare deliveredQty: number

  @column()
  declare subtotal: number

  @column()
  declare price: number

  @column()
  declare statusPartial: boolean

  @column()
  declare description: string

  @belongsTo(() => SalesOrder)
  declare salesOrder: BelongsTo<typeof SalesOrder>

  @hasMany(() => SalesReturnItem, {
    foreignKey: 'salesOrderItemId',
  })
  declare salesReturnItems: HasMany<typeof SalesReturnItem>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>
}
