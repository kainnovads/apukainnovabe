import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Quotation from '#models/quotation'
import Product from '#models/product'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class QuotationItem extends BaseModel {
  public static table = 'quotation_items'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(quotationItem: QuotationItem) {
    quotationItem.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare quotationId: string

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

  @belongsTo(() => Quotation)
  declare quotation: BelongsTo<typeof Quotation>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}