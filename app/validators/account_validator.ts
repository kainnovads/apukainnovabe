import vine from '@vinejs/vine'

export const createAccountValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(20),
    name: vine.string().trim().minLength(1).maxLength(255),
    category: vine.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
    normalBalance: vine.enum(['debit', 'credit']),
    isParent: vine.boolean(),
    parentId: vine.string().trim().optional(),
    level: vine.number().positive().max(10),
  })
)

export const updateAccountValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(20).optional(),
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    category: vine.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional(),
    normalBalance: vine.enum(['debit', 'credit']).optional(),
    isParent: vine.boolean().optional(),
    parentId: vine.string().trim().optional(),
    level: vine.number().positive().max(10).optional(),
  })
)
