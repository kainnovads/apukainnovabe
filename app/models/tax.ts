import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from '#models/auth/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Tax extends BaseModel {
  public static table = 'taxes'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(tax: Tax) {
    tax.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare name: string

  @column()
  declare code: string
  
  @column()
  declare createdBy: number

  @column()
  declare updatedBy: number

  @column()
  declare rate: number
  
  @column()
  declare type: string

  @column()
  declare isActive: boolean

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>
}