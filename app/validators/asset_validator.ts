import vine from '@vinejs/vine'

export const createAssetValidator = vine.compile(
  vine.object({
    perusahaanId: vine.number().positive(),
    assetCode: vine.string().trim().minLength(1).maxLength(100).optional(),
    name: vine.string().trim().minLength(1).maxLength(255),
    category: vine.string().trim().minLength(1).maxLength(100),
    acquisitionDate: vine.date(),
    acquisitionCost: vine.number().positive(),
    usefulLife: vine.number().positive(),
    depreciationMethod: vine.string().trim().minLength(1).maxLength(50),
    residualValue: vine.number().min(0),
    status: vine.enum(['active', 'inactive', 'sold', 'trashed']),
    location: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().maxLength(500).optional(),
    serialNumber: vine.string().trim().maxLength(100).optional(),
    warrantyExpiry: vine.date().optional(),
    cabangId: vine.number().positive(),
    vendorId: vine.number().positive(),
    createdBy: vine.number().positive().optional(),
    updatedBy: vine.number().positive().optional(),
  })
)

export const updateAssetValidator = vine.compile(
  vine.object({
    perusahaanId: vine.number().positive().optional(),
    assetCode: vine.string().trim().minLength(1).maxLength(100).optional(),
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    category: vine.string().trim().minLength(1).maxLength(100).optional(),
    acquisitionDate: vine.date().optional(),
    acquisitionCost: vine.number().positive().optional(),
    usefulLife: vine.number().positive().optional(),
    depreciationMethod: vine.string().trim().minLength(1).maxLength(50).optional(),
    residualValue: vine.number().min(0).optional(),
    status: vine.enum(['active', 'inactive', 'sold', 'trashed']).optional(),
    location: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().maxLength(500).optional(),
    serialNumber: vine.string().trim().maxLength(100).optional(),
    warrantyExpiry: vine.date().optional(),
    cabangId: vine.number().positive().optional(),
    vendorId: vine.number().positive().optional(),
    updatedBy: vine.number().positive().optional(),
  })
)
