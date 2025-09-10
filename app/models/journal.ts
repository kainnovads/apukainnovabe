import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import JournalLine from '#models/journal_line'
import User from '#models/auth/user'
import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'

export default class Journal extends BaseModel {
  public static table = 'journals'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static async assignUuidAndJournalNumber(journal: Journal) {
    journal.id = randomUUID()
    
    // Generate journal number jika belum ada
    if (!journal.journalNumber) {
      journal.journalNumber = await this.generateJournalNumber()
    }
  }

  /**
   * Generate nomor jurnal dengan format JRN-0000-ddmmyy
   */
  static async generateJournalNumber(): Promise<string> {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const year = today.getFullYear().toString().slice(-2)
    const dateStr = `${day}${month}${year}`
    
    // Cari nomor terakhir hari ini
    const lastJournal = await this.query()
      .where('journal_number', 'like', `JRN-%${dateStr}`)
      .orderBy('journal_number', 'desc')
      .first()
    
    let sequence = 1
    if (lastJournal) {
      // Extract sequence number from journal number
      const parts = lastJournal.journalNumber.split('-')
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[1])
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1
        }
      }
    }
    
    return `JRN-${sequence.toString().padStart(4, '0')}-${dateStr}`
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column({ columnName: 'journal_number' })
  declare journalNumber: string

  @column()
  declare date: Date

  @column()
  declare description: string

  @column()
  declare status: 'draft' | 'posted' | 'cancelled'

  @column({ columnName: 'reference_type' })
  declare referenceType: string | null

  @column({ columnName: 'reference_id' })
  declare referenceId: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: number

  @column({ columnName: 'updated_by' })
  declare updatedBy: number

  @hasMany(() => JournalLine)
  declare journalLines: HasMany<typeof JournalLine>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>
}