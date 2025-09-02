import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from '#models/auth/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class BankAccount extends BaseModel {
  public static table = 'bank_accounts'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(bankAccount: BankAccount) {
    bankAccount.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare bankName: string

  @column()
  declare accountNumber: string
  
  @column()
  declare accountName: string
  
  @column()
  declare currency: string

  @column()
  declare openingBalance: number

  @column()
  declare createdBy: number

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
}