import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import SalesOrder from '#models/sales_order'
import SuratJalanItem from '#models/surat_jalan_item'
import Customer from '#models/customer'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import User from '#models/auth/user'

export default class SuratJalan extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(suratJalan: SuratJalan) {
    suratJalan.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare noSuratJalan: string

  @column()
  declare salesOrderId: string

  @column()
  declare customerId: number | null

  @column()
  declare date: Date

  @column()
  declare picName: string

  @column()
  declare penerima: string

  @column()
  declare createdBy: number

  @column()
  declare total: number

  @column()
  declare description: string

  @column()
  declare alamatPengiriman: string

   @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => SalesOrder)
  declare salesOrder: BelongsTo<typeof SalesOrder>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @hasMany(() => SuratJalanItem)
  declare suratJalanItems: HasMany<typeof SuratJalanItem>
}
