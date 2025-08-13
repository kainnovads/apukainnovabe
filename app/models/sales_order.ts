import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import SalesOrderItem from '#models/sales_order_item'
import Customer from '#models/customer'
import User from '#models/auth/user'
import Cabang from '#models/cabang'
import Perusahaan from '#models/perusahaan'
import SalesReturn from '#models/sales_return'
import SuratJalan from '#models/surat_jalan'
import Quotation from '#models/quotation'

export default class SalesOrder extends BaseModel {
  public static table = 'sales_orders'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(so: SalesOrder) {
    so.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare noSo: string

  @column()
  declare noPo: string

  @column()
  declare up: string

  @column()
  declare customerId: number | null

  @column()
  declare perusahaanId: number | null

  @column()
  declare cabangId: number | null

  @column()
  declare quotationId: string | null

  @column()
  declare date: Date

  @column()
  declare dueDate: Date

  @column()
  declare status: 'draft' | 'approved' | 'rejected' | 'delivered' | 'partial'

  @column()
  declare paymentMethod: 'cash' | 'transfer' | 'qris' | 'card'

  @column()
  declare source: 'pos' | 'admin'

  @column()
  declare total: number

  @column()
  declare discountPercent: number

  @column()
  declare taxPercent: number

  @column()
  declare createdBy: number | null

  @column()
  declare approvedBy: number | null

  @column()
  declare approvedAt: Date

  @column()
  declare rejectedBy: number | null

  @column()
  declare rejectedAt: Date

  @column()
  declare deliveredBy: number | null

  @column()
  declare deliveredAt: Date

  @column()
  declare description: string

  @column()
  declare attachment: string

  @hasMany(() => SalesOrderItem)
  declare salesOrderItems: HasMany<typeof SalesOrderItem>

  @hasMany(() => SalesReturn)
  declare salesReturns: HasMany<typeof SalesReturn>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => Cabang)
  declare cabang: BelongsTo<typeof Cabang>

  @belongsTo(() => Perusahaan)
  declare perusahaan: BelongsTo<typeof Perusahaan>

  @belongsTo(() => Quotation)
  declare quotation: BelongsTo<typeof Quotation>

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

  @belongsTo(() => User, {
    foreignKey: 'deliveredBy',
  })
  declare deliveredByUser: BelongsTo<typeof User>

  @hasMany(() => SuratJalan)
  declare suratJalans: HasMany<typeof SuratJalan>

}
