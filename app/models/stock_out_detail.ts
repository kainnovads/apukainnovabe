import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import Product from '#models/product'
import StockOut from '#models/stock_out'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class StockOutDetail extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(stockOutDetail: StockOutDetail) {
    stockOutDetail.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare stockOutId: string

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare description: string

  @belongsTo(() => StockOut)
  declare stockOut: BelongsTo<typeof StockOut>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
