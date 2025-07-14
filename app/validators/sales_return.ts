import vine from '@vinejs/vine'

export const salesReturnValidator = vine.compile(
  vine.object({
    noSr             : vine.string().unique({ table: 'sales_returns', column: 'no_sr' }).optional(),
    customerId       : vine.number(),
    perusahaanId     : vine.number(),
    cabangId         : vine.number(),
    salesOrderId     : vine.string(),
    returnDate       : vine.date(),
    status           : vine.enum(['draft', 'approved', 'rejected'] as const),
    totalReturnAmount: vine.number(),
    createdBy        : vine.number(),
    approvedBy       : vine.number().optional(),
    rejectedBy       : vine.number().optional(),
    description      : vine.string().optional(),
    attachment       : vine.file().optional(),
    approvedAt       : vine.date().optional(),
    rejectedAt       : vine.date().optional(),


    salesReturnItems: vine.array(
      vine.object({
        salesOrderItemId: vine.string().uuid().optional(),
        productId    : vine.number(),
        warehouseId  : vine.number(),
        quantity     : vine.number(),
        price        : vine.number(),
        reason       : vine.string().optional(),
        description  : vine.string().optional(),
      })
    ).minLength(1),
  })
)

export const updateSalesReturnValidator = vine.compile(
  vine.object({
    noSr             : vine.string().unique({ table: 'sales_returns', column: 'no_sr' }).optional(),
    customerId       : vine.number(),
    perusahaanId     : vine.number(),
    cabangId         : vine.number(),
    salesOrderId     : vine.string(),
    returnDate       : vine.date(),
    status           : vine.enum(['draft', 'approved', 'rejected'] as const).optional(),
    totalReturnAmount: vine.number().optional(),
    createdBy        : vine.number().optional(),
    approvedBy       : vine.number().optional(),
    rejectedBy       : vine.number().optional(),
    description      : vine.string().optional(),
    attachment       : vine.file().optional(),
    approvedAt       : vine.date().optional(),
    rejectedAt       : vine.date().optional(),

    salesReturnItems: vine.array(
      vine.object({
        salesOrderItemId: vine.string().uuid().optional(),
        productId    : vine.number(),
        warehouseId  : vine.number(),
        quantity     : vine.number(),
        price        : vine.number(),
        reason       : vine.string().optional(),
        description  : vine.string().optional(),
      })
    ).minLength(1),
  })
)
