import vine from '@vinejs/vine'

export const createExpenseValidator = vine.compile(
  vine.object({
    expenseNumber: vine.string().trim().minLength(1).maxLength(100),
    date: vine.date(),
    departemenId: vine.number().positive(),
    amount: vine.number().positive(),
    paymentMethod: vine.string().trim().minLength(1).maxLength(50),
    bankAccountId: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().minLength(1).maxLength(1000),
    createdBy: vine.number().positive(),
    updatedBy: vine.number().positive(),
  })
)

export const updateExpenseValidator = vine.compile(
  vine.object({
    expenseNumber: vine.string().trim().minLength(1).maxLength(100).optional(),
    date: vine.date().optional(),
    departemenId: vine.number().positive().optional(),
    amount: vine.number().positive().optional(),
    paymentMethod: vine.string().trim().minLength(1).maxLength(50).optional(),
    bankAccountId: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().minLength(1).maxLength(1000).optional(),
    updatedBy: vine.number().positive(),
  })
)
