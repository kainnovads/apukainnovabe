import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import StockTransfer from '#models/stock_transfer'
import Product from '#models/product'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class StockTransferDetail extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(stockTransferDetail: StockTransferDetail) {
    stockTransferDetail.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare stockTransferId: string

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare description: string

  @belongsTo(() => StockTransfer)
  declare stockTransfer: BelongsTo<typeof StockTransfer>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

}
