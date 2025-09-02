import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Customer from '#models/customer'
import SalesInvoice from '#models/sales_invoice'
import User from '#models/auth/user'
import BankAccount from '#models/bank_account'

export default class ArReceipt extends BaseModel {
  public static table = 'ar_receipts'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(arReceipt: ArReceipt) {
    arReceipt.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare customerId: number

  @column()
  declare salesInvoiceId: string

  @column()
  declare bankAccountId: string

  @belongsTo(() => BankAccount)
  declare bankAccount: BelongsTo<typeof BankAccount>
  
  @column()
  declare receiptNumber: string

  @column()
  declare date: Date

  @column()
  declare amount: number

  @column()
  declare method: string

  @column()
  declare description: string

  @column()
  declare createdBy: number

  @column()
  declare updatedBy: number
  
  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => SalesInvoice)
  declare salesInvoice: BelongsTo<typeof SalesInvoice>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>
}