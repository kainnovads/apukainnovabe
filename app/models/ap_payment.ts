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

  @column({ columnName: 'vendor_id' })
  declare vendorId: number

  @belongsTo(() => Vendor)
  declare vendor: BelongsTo<typeof Vendor>

  @column()
  declare date: Date

  @column({ columnName: 'payment_number' })
  declare paymentNumber: string

  @column({ columnName: 'purchase_invoice_id' })
  declare invoiceId: string | null

  @belongsTo(() => PurchaseInvoice, {
    foreignKey: 'invoiceId'
  })
  declare purchaseInvoice: BelongsTo<typeof PurchaseInvoice>

  @column({ columnName: 'bank_account_id' })
  declare bankAccountId: string | null

  @belongsTo(() => BankAccount)
  declare bankAccount: BelongsTo<typeof BankAccount>

  @column()
  declare description: string | null

  @column()
  declare amount: number

  @column()
  declare method: string

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column({ columnName: 'updated_by' })
  declare updatedBy: number | null

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