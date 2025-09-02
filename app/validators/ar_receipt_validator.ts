import vine from '@vinejs/vine'

export const createArReceiptValidator = vine.compile(
  vine.object({
    customerId: vine.number().positive(),
    salesInvoiceId: vine.string().trim().minLength(1).maxLength(255),
    bankAccountId: vine.string().trim().minLength(1).maxLength(255),
    receiptNumber: vine.string().trim().minLength(1).maxLength(100),
    date: vine.date(),
    amount: vine.number().positive(),
    method: vine.string().trim().minLength(1).maxLength(50),
    description: vine.string().trim().minLength(1).maxLength(1000),
    createdBy: vine.number().positive(),
    updatedBy: vine.number().positive(),
  })
)

export const updateArReceiptValidator = vine.compile(
  vine.object({
    customerId: vine.number().positive().optional(),
    salesInvoiceId: vine.string().trim().minLength(1).maxLength(255).optional(),
    bankAccountId: vine.string().trim().minLength(1).maxLength(255).optional(),
    receiptNumber: vine.string().trim().minLength(1).maxLength(100).optional(),
    date: vine.date().optional(),
    amount: vine.number().positive().optional(),
    method: vine.string().trim().minLength(1).maxLength(50).optional(),
    description: vine.string().trim().minLength(1).maxLength(1000).optional(),
    updatedBy: vine.number().positive(),
  })
)
