import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import JournalLine from '#models/journal_line'
import CashTransaction from '#models/cash_transaction'
import { randomUUID } from 'node:crypto'

export default class Account extends BaseModel {
  public static table = 'accounts'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(po: Account) {
    po.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

  @column({ columnName: 'normal_balance' })
  declare normalBalance: 'debit' | 'credit'

  @column({ columnName: 'is_parent' })
  declare isParent: boolean

  @column({ columnName: 'parent_id' })
  declare parentId: string | null

  @column()
  declare level: number

  @belongsTo(() => Account, {
    foreignKey: 'parentId',
  })
  declare parent: BelongsTo<typeof Account>

  @hasMany(() => Account, {
    foreignKey: 'parentId',
  })
  declare children: HasMany<typeof Account>

  @hasMany(() => JournalLine)
  declare journalLines: HasMany<typeof JournalLine>

  @hasMany(() => CashTransaction)
  declare cashTransactions: HasMany<typeof CashTransaction>
}
