import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import SalesOrderItem from '#models/sales_order_item.js'
import SuratJalan from '#models/surat_jalan.js'
import Product from '#models/product.js'
import Warehouse from '#models/warehouse.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class SuratJalanItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(item: SuratJalanItem) {
    item.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare suratJalanId: string

  @column()
  declare salesOrderItemId: string

  @column()
  declare productId: number

  @column()
  declare warehouseId: number | null

  @column()
  declare quantity: number

  @column()
  declare description: string | null

  @column()
  @belongsTo(() => SuratJalan)
  declare suratJalan: BelongsTo<typeof SuratJalan>

  @belongsTo(() => SalesOrderItem)
  declare salesOrderItem: BelongsTo<typeof SalesOrderItem>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>
}