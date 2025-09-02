import vine from '@vinejs/vine'

export const createBankAccountValidator = vine.compile(
  vine.object({
    bankName: vine.string().trim().minLength(1).maxLength(255),
    accountNumber: vine.string().trim().minLength(1).maxLength(100),
    accountName: vine.string().trim().minLength(1).maxLength(255),
    currency: vine.string().trim().minLength(1).maxLength(10),
    openingBalance: vine.number(),
    createdBy: vine.number().positive(),
    updatedBy: vine.number().positive(),
  })
)

export const updateBankAccountValidator = vine.compile(
  vine.object({
    bankName: vine.string().trim().minLength(1).maxLength(255).optional(),
    accountNumber: vine.string().trim().minLength(1).maxLength(100).optional(),
    accountName: vine.string().trim().minLength(1).maxLength(255).optional(),
    currency: vine.string().trim().minLength(1).maxLength(10).optional(),
    openingBalance: vine.number().optional(),
    updatedBy: vine.number().positive(),
  })
)
