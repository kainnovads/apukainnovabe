import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import StockIn from '#models/stock_in'
import StockOut from '#models/stock_out'
import Product from '#models/product'
import Warehouse from '#models/warehouse'
import { randomUUID } from 'node:crypto'

export default class Stock extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(stock: Stock) {
    stock.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare productId: number

  @column()
  declare warehouseId: number

  @column()
  declare quantity: number

  @column()
  declare description: string

  @hasMany(() => StockIn)
  declare stockIns: HasMany<typeof StockIn>

  @hasMany(() => StockOut)
  declare stockOuts: HasMany<typeof StockOut>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>

}