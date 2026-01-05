import { DateTime } from 'luxon'
import { column, BaseModel, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/auth/user'

export default class ActivityLog extends BaseModel {
  public static table = 'activity_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @column()
  declare device: string | null

  @column()
  declare action: string

  @column()
  declare description: string | null

  @column({ columnName: 'ip_address' })
  declare ipAddress: string | null

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}

