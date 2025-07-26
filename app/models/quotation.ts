import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Customer from '#models/customer'
import Perusahaan from '#models/perusahaan'
import Cabang from '#models/cabang'
import QuotationItem from '#models/quotation_item'
import User from '#models/auth/user'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Quotation extends BaseModel {
  public static table = 'quotations'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(quotation: Quotation) {
    quotation.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare customerId: number

  @column()
  declare perusahaanId: number

  @column()
  declare cabangId: number

  @column()
  declare date: Date

  @column()
  declare validUntil: Date

  @column()
  declare shipDate: Date

  @column()
  declare fobPoint: string

  @column()
  declare termsOfPayment: string

  @column()
  declare prNumber: string

  @column()
  declare description: string

  @column()
  declare noQuotation: string

  @column()
  declare up: string

  @column()
  declare status: string

  @column()
  declare total: number

  @column()
  declare discountPercent: number

  @column()
  declare taxPercent: number

  @column()
  declare createdBy: number

  @column()
  declare approvedBy: number

  @column()
  declare rejectedBy: number

  @column()
  declare approvedAt: Date

  @column()
  declare rejectedAt: Date

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => Perusahaan)
  declare perusahaan: BelongsTo<typeof Perusahaan>

  @belongsTo(() => Cabang)
  declare cabang: BelongsTo<typeof Cabang>

  @hasMany(() => QuotationItem)
  declare quotationItems: HasMany<typeof QuotationItem>

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