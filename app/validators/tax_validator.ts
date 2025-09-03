import vine from '@vinejs/vine'

export const createTaxValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    code: vine.string().trim().minLength(1).maxLength(50),
    rate: vine.number().positive().max(100),
    type: vine.string().trim().minLength(1).maxLength(50),
    isActive: vine.boolean(),
  })
)

export const updateTaxValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    code: vine.string().trim().minLength(1).maxLength(50).optional(),
    rate: vine.number().positive().max(100).optional(),
    type: vine.string().trim().minLength(1).maxLength(50).optional(),
    isActive: vine.boolean().optional(),
  })
)
