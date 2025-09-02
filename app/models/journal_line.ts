import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Account from '#models/account'
import Journal from '#models/journal'

export default class JournalLine extends BaseModel {
  public static table = 'journal_lines'

  @column({ isPrimary: true })
  declare id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare journalId: string

  @column()
  declare accountId: string

  @column()
  declare debit: number

  @column()
  declare credit: number

  @column()
  declare description: string | null

  @belongsTo(() => Journal)
  declare journal: BelongsTo<typeof Journal>

  @belongsTo(() => Account)
  declare account: BelongsTo<typeof Account>
}