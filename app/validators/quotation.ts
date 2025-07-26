import vine from '@vinejs/vine'

export const quotationValidator = vine.compile(
  vine.object({
    customerId         : vine.number(),
    perusahaanId     : vine.number().optional(),
    cabangId         : vine.number().optional(),
    noQuotation      : vine.string().unique({ table: 'quotations', column: 'no_quotation' }).optional(),
    up               : vine.string(),
    date             : vine.date(),
    shipDate         : vine.date().optional(),
    fobPoint         : vine.string().optional(),
    termsOfPayment   : vine.string().optional(),
    prNumber         : vine.string().optional(),
    validUntil       : vine.date(),
    status           : vine.enum(['draft', 'approved', 'rejected'] as const),
    discountPercent  : vine.number(),
    taxPercent       : vine.number(),
    createdBy        : vine.number(),
    approvedBy       : vine.number().optional(),
    rejectedBy       : vine.number().optional(),
    description      : vine.string().optional(),
    approvedAt       : vine.date().optional(),
    rejectedAt       : vine.date().optional(),

    quotationItems: vine.array(
      vine.object({
        productId    : vine.number(),
        quantity     : vine.number(),
        price        : vine.number(),
        subtotal     : vine.number(),
        description  : vine.string().optional(),
      })
    ).minLength(1),
  })
)

export const updateQuotationValidator = vine.compile(
  vine.object({
    customerId         : vine.number(),
    perusahaanId     : vine.number().optional(),
    cabangId         : vine.number().optional(),
    noQuotation      : vine.string().optional(),
    up               : vine.string(),
    date             : vine.date(),
    shipDate         : vine.date().optional(),
    fobPoint         : vine.string().optional(),
    termsOfPayment   : vine.string().optional(),
    prNumber         : vine.string().optional(),
    validUntil       : vine.date(),
    status           : vine.enum(['draft', 'approved', 'rejected'] as const).optional(),
    discountPercent  : vine.number(),
    taxPercent       : vine.number(),
    createdBy        : vine.number().optional(),
    approvedBy       : vine.number().optional(),
    rejectedBy       : vine.number().optional(),
    description      : vine.string().optional(),
    approvedAt       : vine.date().optional(),
    rejectedAt       : vine.date().optional(),

    quotationItems: vine.array(
      vine.object({
        productId    : vine.number(),
        quantity     : vine.number(),
        price        : vine.number(),
        subtotal     : vine.number(),
        description  : vine.string().optional(),
      })
    ).minLength(1),
  })
)
