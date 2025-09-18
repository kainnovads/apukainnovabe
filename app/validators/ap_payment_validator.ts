import vine from '@vinejs/vine'

export const createApPaymentValidator = vine.compile(
  vine.object({
    vendorId: vine.number().positive(),
    date: vine.date(),
    paymentNumber: vine.string().trim().minLength(1).maxLength(100),
    invoiceId: vine.string().trim().maxLength(255).optional(),
    bankAccountId: vine.string().trim().maxLength(255).optional(),
    description: vine.string().trim().maxLength(1000).optional(),
    amount: vine.number().positive(),
    method: vine.string().trim().minLength(1).maxLength(50),
  })
)

export const updateApPaymentValidator = vine.compile(
  vine.object({
    vendorId: vine.number().positive().optional(),
    date: vine.date().optional(),
    paymentNumber: vine.string().trim().minLength(1).maxLength(100).optional(),
    invoiceId: vine.string().trim().maxLength(255).optional(),
    bankAccountId: vine.string().trim().maxLength(255).optional(),
    description: vine.string().trim().maxLength(1000).optional(),
    amount: vine.number().positive().optional(),
    method: vine.string().trim().minLength(1).maxLength(50).optional(),
  })
)
