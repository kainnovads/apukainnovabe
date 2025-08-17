import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/auth/user'

export default class UserSession extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare sessionId: string

  @column()
  declare ipAddress: string

  @column()
  declare userAgent: string

  @column()
  declare deviceType: string

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare lastActivity: DateTime

  @column.dateTime({ autoCreate: true })
  declare loginAt: DateTime

  @column.dateTime()
  declare logoutAt: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
