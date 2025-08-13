import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Customer from '#models/customer'
import SalesOrder from '#models/sales_order'
import SalesInvoiceItem from '#models/sales_invoice_item'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class SalesInvoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(invoice: SalesInvoice) {
    invoice.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare noInvoice: string

  @column()
  declare up: string

  @column()
  declare salesOrderId: string

  @column()
  declare customerId: number | null

  @column()
  declare date: Date

  @column()
  declare dueDate: Date

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

  @column()
  declare description: string

  @belongsTo(() => SalesOrder)
  declare salesOrder: BelongsTo<typeof SalesOrder>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @hasMany(() => SalesInvoiceItem)
  declare salesInvoiceItems: HasMany<typeof SalesInvoiceItem>
}
