import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from '#models/auth/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Departemen from '#models/departemen'
import BankAccount from '#models/bank_account'

export default class Expense extends BaseModel {
  public static table = 'expenses'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(expense: Expense) {
    expense.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare expenseNumber: string

  @column()
  declare date: Date

  @column()
  declare departemenId: number

  @column()
  declare amount: number

  @column()
  declare paymentMethod: string

  @column()
  declare bankAccountId: string

  @column()
  declare description: string

  @column()
  declare createdBy: number

  @column()
  declare updatedBy: number

  @belongsTo(() => Departemen)
  declare departemen: BelongsTo<typeof Departemen>

  @belongsTo(() => BankAccount)
  declare bankAccount: BelongsTo<typeof BankAccount>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>
}