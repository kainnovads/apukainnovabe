import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PurchaseInvoice from '#models/purchase_invoice'
import Vendor from '#models/vendor'
import BankAccount from '#models/bank_account'
import User from '#models/auth/user'

export default class ApPayment extends BaseModel {
  public static table = 'ap_payments'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(po: ApPayment) {
    po.id = randomUUID()
  }

  @column()
  declare vendorId: number

  @belongsTo(() => Vendor)
  declare vendor: BelongsTo<typeof Vendor>

  @column()
  declare date: Date

  @column()
  declare dueDate: Date

  @column()
  declare paymentNumber: string

  @column()
  declare purchaseInvoiceId: string

  @belongsTo(() => PurchaseInvoice)
  declare purchaseInvoice: BelongsTo<typeof PurchaseInvoice>

  @column()
  declare bankAccountId: string

  @belongsTo(() => BankAccount)
  declare bankAccount: BelongsTo<typeof BankAccount>

  @column()
  declare description: string

  @column()
  declare createdBy: number

  @column()
  declare amount: number

  @column()
  declare method: string

  @column()
  declare updatedBy: number

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}