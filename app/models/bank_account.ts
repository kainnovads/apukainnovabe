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

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime

  @column({ columnName: 'bank_name' })
  declare bankName: string

  @column({ columnName: 'account_number' })
  declare accountNumber: string
  
  @column({ columnName: 'account_name' })
  declare accountName: string
  
  @column()
  declare currency: string

  @column({ columnName: 'opening_balance' })
  declare openingBalance: number | string

  @column({ columnName: 'created_by' })
  declare createdBy: number

  @column({ columnName: 'updated_by' })
  declare updatedBy: number
  
  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>

  // Serialize untuk frontend
  serializeExtras() {
    return {
      account_name: this.accountName,
      account_number: this.accountNumber,
      bank_name: this.bankName,
      currency: this.currency,
      opening_balance: Number(this.openingBalance) || 0
    }
  }
}