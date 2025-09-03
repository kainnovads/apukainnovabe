import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from '#models/auth/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Perusahaan from '#models/perusahaan'
import Cabang from '#models/cabang'
import Vendor from '#models/vendor'

export default class Asset extends BaseModel {
  public static table = 'assets'

  @column({ isPrimary: true, columnName: 'id' })
  declare id: string

  @beforeCreate()
  static assignUuid(asset: Asset) {
    asset.id = randomUUID()
  }

  @column.dateTime({ autoCreate: true, columnName: 'createdAt' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updatedAt' })
  declare updatedAt: DateTime

  @column({ columnName: 'assetCode' })
  declare assetCode: string

  @column({ columnName: 'name' })
  declare name: string

  @column({ columnName: 'category' })
  declare category: string

  @column({ columnName: 'acquisitionDate' })
  declare acquisitionDate: Date

  @column({ columnName: 'acquisitionCost' })
  declare acquisitionCost: number
  
  @column({ columnName: 'usefulLife' })
  declare usefulLife: number

  @column({ columnName: 'depreciationMethod' })
  declare depreciationMethod: string

  @column({ columnName: 'residualValue' })
  declare residualValue: number
  
  @column({ columnName: 'status' })
  declare status: 'active' | 'inactive' | 'sold' | 'trashed'

  @column({ columnName: 'location' })
  declare location: string

  @column({ columnName: 'description' })
  declare description: string

  @column({ columnName: 'serialNumber' })
  declare serialNumber: string

  @column({ columnName: 'warrantyExpiry' })
  declare warrantyExpiry: Date

  @column({ columnName: 'createdBy' })
  declare createdBy: number

  @column({ columnName: 'updatedBy' })
  declare updatedBy: number
 
  @column({ columnName: 'perusahaanId' })
  declare perusahaanId: number | null
  
  @column({ columnName: 'cabangId' })
  declare cabangId: number | null

  @column({ columnName: 'vendorId' })
  declare vendorId: number | null

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare createdByUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'updatedBy',
  })
  declare updatedByUser: BelongsTo<typeof User>

  @belongsTo(() => Perusahaan, {
    foreignKey: 'perusahaanId',
  })
  declare perusahaan: BelongsTo<typeof Perusahaan>

  @belongsTo(() => Cabang, {
    foreignKey: 'cabangId',
  })
  declare cabang: BelongsTo<typeof Cabang>

  @belongsTo(() => Vendor, {
    foreignKey: 'vendorId',
  })
  declare vendor: BelongsTo<typeof Vendor>
}