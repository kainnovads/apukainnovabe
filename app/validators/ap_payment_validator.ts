import vine from '@vinejs/vine'

export const createApPaymentValidator = vine.compile(
  vine.object({
    vendorId: vine.number().positive(),
    date: vine.date(),
    dueDate: vine.date(),
    paymentNumber: vine.string().trim().minLength(1).maxLength(100),
    purchaseInvoiceId: vine.string().trim().minLength(1).maxLength(255),
    bankAccountId: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().minLength(1).maxLength(1000),
    amount: vine.number().positive(),
    method: vine.string().trim().minLength(1).maxLength(50),
    createdBy: vine.number().positive(),
    updatedBy: vine.number().positive(),
  })
)

export const updateApPaymentValidator = vine.compile(
  vine.object({
    vendorId: vine.number().positive().optional(),
    date: vine.date().optional(),
    dueDate: vine.date().optional(),
    paymentNumber: vine.string().trim().minLength(1).maxLength(100).optional(),
    purchaseInvoiceId: vine.string().trim().minLength(1).maxLength(255).optional(),
    bankAccountId: vine.string().trim().minLength(1).maxLength(255).optional(),
    description: vine.string().trim().minLength(1).maxLength(1000).optional(),
    amount: vine.number().positive().optional(),
    method: vine.string().trim().minLength(1).maxLength(50).optional(),
    updatedBy: vine.number().positive(),
  })
)
