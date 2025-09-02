import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from '#models/auth/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Asset extends BaseModel {
  public static table = 'assets'

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(asset: Asset) {
    asset.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare assetCode: string

  @column()
  declare name: string

  @column()
  declare category: string

  @column()
  declare acquisitionDate: Date

  @column()
  declare acquisitionCost: number
  
  @column()
  declare usefulLife: number

  @column()
  declare depreciationMethod: string

  @column()
  declare residualValue: number
  
  @column()
  declare isActive: boolean

  @column()
  declare createdBy: number

  @column()
  declare updatedBy: number
  
  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>
}