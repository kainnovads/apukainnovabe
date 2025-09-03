import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Vendor from '#models/vendor'
import PurchaseOrder from '#models/purchase_order'
import PurchaseInvoiceItem from '#models/purchase_invoice_item'
import User from '#models/auth/user'
import Perusahaan from '#models/perusahaan'
import Cabang from '#models/cabang'

export default class PurchaseInvoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(pi: PurchaseInvoice) {
    pi.id = randomUUID()
  }

  @column()
  declare noInvoice: string

  @column()
  declare up: string

  @column()
  declare email: string

  @column()
  declare paymentMethod: 'cash' | 'transfer' | 'qris' | 'card'

  @column()
  declare purchaseOrderId: string | null

  @column()
  declare vendorId: number | null

  @column()
  declare perusahaanId: number | null

  @column()
  declare cabangId: number | null

  @column()
  declare paymentDate: Date

  @column()
  declare discountPercent: number

  @column()
  declare taxPercent: number

  @column()
  declare dpp: number

  @column()
  declare total: number

  @column()
  declare paidAmount: number

  @column()
  declare remainingAmount: number

  @column()
  declare status: 'unpaid' | 'partial' | 'paid'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare description: string

  @column()
  declare createdBy: number

  @column()
  declare updatedBy: number

  @belongsTo(() => PurchaseOrder)
  declare purchaseOrder: BelongsTo<typeof PurchaseOrder>

  @belongsTo(() => Vendor)
  declare vendor: BelongsTo<typeof Vendor>

  @belongsTo(() => Perusahaan)
  declare perusahaan: BelongsTo<typeof Perusahaan>

  @belongsTo(() => Cabang)
  declare cabang: BelongsTo<typeof Cabang>

  @hasMany(() => PurchaseInvoiceItem)
  declare purchaseInvoiceItems: HasMany<typeof PurchaseInvoiceItem>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>
}