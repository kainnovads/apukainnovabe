import vine from '@vinejs/vine'

export const salesInvoiceValidator = vine.compile(
  vine.object({
    noInvoice        : vine.string().unique({ table: 'sales_invoices', column: 'no_invoice' }).optional(),
    customerId       : vine.number(),
    perusahaanId     : vine.number().optional(),
    cabangId         : vine.number().optional(),
    salesOrderId     : vine.string().optional(),
    date             : vine.date(),
    dueDate          : vine.date(),
    discountPercent  : vine.number().optional(),
    taxPercent       : vine.number().optional(),
    total            : vine.number(),
    paidAmount       : vine.number().optional(),
    remainingAmount  : vine.number().optional(),
    status           : vine.enum(['unpaid', 'partial', 'paid'] as const).optional(),
    description      : vine.string().optional(),
    salesInvoiceItems: vine.array(vine.object({
      salesOrderItemId: vine.string(),
      productId       : vine.number(),
      warehouseId     : vine.number().optional(),
      quantity        : vine.number(),
      price           : vine.number(),
      subtotal        : vine.number(),
      description     : vine.string().optional(),
      deliveredQty    : vine.number().optional(),
      isReturned      : vine.boolean().optional(),
    })).optional(),
  })
)

export const updateSalesInvoiceValidator = vine.compile(
  vine.object({
    noInvoice        : vine.string().unique({ table: 'sales_invoices', column: 'no_invoice' }).optional(),
    customerId       : vine.number().optional(),
    perusahaanId     : vine.number().optional(),
    cabangId         : vine.number().optional(),
    salesOrderId     : vine.string().optional(),
    date             : vine.date().optional(),
    dueDate          : vine.date().optional(),
    discountPercent  : vine.number().optional(),
    taxPercent       : vine.number().optional(),
    total            : vine.number().optional(),
    paidAmount       : vine.number().optional(),
    remainingAmount  : vine.number().optional(),
    status           : vine.enum(['unpaid', 'partial', 'paid'] as const).optional(),
    description      : vine.string().optional(),
    salesInvoiceItems: vine.array(vine.object({
      salesOrderItemId: vine.string(),
      productId       : vine.number(),
      warehouseId     : vine.number().optional(),
      quantity        : vine.number(),
      price           : vine.number(),
      subtotal        : vine.number(),
      description     : vine.string().optional(),
      deliveredQty    : vine.number().optional(),
      isReturned      : vine.boolean().optional(),
    })).optional(),
  })
)
