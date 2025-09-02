import vine from '@vinejs/vine'

export const createAssetValidator = vine.compile(
  vine.object({
    assetCode: vine.string().trim().minLength(1).maxLength(100),
    name: vine.string().trim().minLength(1).maxLength(255),
    category: vine.string().trim().minLength(1).maxLength(100),
    acquisitionDate: vine.date(),
    acquisitionCost: vine.number().positive(),
    usefulLife: vine.number().positive(),
    depreciationMethod: vine.string().trim().minLength(1).maxLength(50),
    residualValue: vine.number().min(0),
    isActive: vine.boolean(),
    createdBy: vine.number().positive(),
    updatedBy: vine.number().positive(),
  })
)

export const updateAssetValidator = vine.compile(
  vine.object({
    assetCode: vine.string().trim().minLength(1).maxLength(100).optional(),
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    category: vine.string().trim().minLength(1).maxLength(100).optional(),
    acquisitionDate: vine.date().optional(),
    acquisitionCost: vine.number().positive().optional(),
    usefulLife: vine.number().positive().optional(),
    depreciationMethod: vine.string().trim().minLength(1).maxLength(50).optional(),
    residualValue: vine.number().min(0).optional(),
    isActive: vine.boolean().optional(),
    updatedBy: vine.number().positive(),
  })
)
