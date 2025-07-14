import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import SalesReturnItem from '#models/sales_return_item'
import SalesOrder from '#models/sales_order'
import { randomUUID } from 'node:crypto'
import Customer from '#models/customer'
import Perusahaan from '#models/perusahaan'
import Cabang from '#models/cabang'
import User from '#models/auth/user'

export default class SalesReturn extends BaseModel {
  public static table = 'sales_returns'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(sr: SalesReturn) {
    sr.id = randomUUID()
  }

  @column()
  declare noSr: string

  @column()
  declare customerId: number

  @column()
  declare perusahaanId: number

  @column()
  declare cabangId: number


  @column()
  declare salesOrderId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare returnDate: Date

  @column()
  declare status: string

  @column()
  declare totalReturnAmount: number

  @column()
  declare description: string

  @column()
  declare attachment: string

  @column()
  declare createdBy: number

  @column()
  declare approvedBy: number

  @column()
  declare rejectedBy: number

  @column.dateTime()
  declare approvedAt: DateTime

  @column.dateTime()
  declare rejectedAt: DateTime

  @hasMany(() => SalesReturnItem)
  declare salesReturnItems: HasMany<typeof SalesReturnItem>

  @belongsTo(() => SalesOrder)
  declare salesOrder: BelongsTo<typeof SalesOrder>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => Perusahaan)
  declare perusahaan: BelongsTo<typeof Perusahaan>

  @belongsTo(() => Cabang)
  declare cabang: BelongsTo<typeof Cabang>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'approvedBy',
  })
  declare approvedByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'rejectedBy',
  })
  declare rejectedByUser: BelongsTo<typeof User>
}