import vine from '@vinejs/vine'

export const purchaseOrderValidator = vine.compile(
  vine.object({
    vendorId         : vine.number(),
    perusahaanId     : vine.number().optional(),
    cabangId         : vine.number().optional(),
    noPo             : vine.string().unique({ table: 'purchase_orders', column: 'no_po' }).optional(),
    up               : vine.string(),
    extNamaPerusahaan: vine.string().optional(),
    termOfPayment    : vine.string().optional(),
    date             : vine.date(),
    dueDate          : vine.date(),
    status           : vine.enum(['draft', 'approved', 'rejected', 'received', 'partial'] as const),
    poType           : vine.enum(['internal', 'external'] as const),
    discountPercent  : vine.number(),
    taxPercent       : vine.number(),
    createdBy        : vine.number(),
    approvedBy       : vine.number().optional(),
    receivedBy       : vine.number().optional(),
    rejectedBy       : vine.number().optional(),
    description      : vine.string().optional(),
    approvedAt       : vine.date().optional(),
    receivedAt       : vine.date().optional(),
    rejectedAt       : vine.date().optional(),
    attachment: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png', 'pdf', 'docs', 'doc', 'docx', 'xls', 'xlsx', 'csv']
    }).optional(),

    purchaseOrderItems: vine.array(
      vine.object({
        productId    : vine.number(),
        quantity     : vine.number(),
        price        : vine.number(),
        subtotal     : vine.number(),
        warehouseId  : vine.number().optional(),
        description  : vine.string().optional(),
        statusPartial: vine.boolean().optional(),
        receivedQty  : vine.number().optional(),
      })
    ).minLength(1),
  })
)

export const updatePurchaseOrderValidator = vine.compile(
  vine.object({
    vendorId         : vine.number(),
    perusahaanId     : vine.number().optional(),
    cabangId         : vine.number().optional(),
    noPo             : vine.string().optional(),
    up               : vine.string(),
    extNamaPerusahaan: vine.string().optional(),
    termOfPayment    : vine.string().optional(),
    date             : vine.date(),
    dueDate          : vine.date(),
    status           : vine.enum(['draft', 'approved', 'rejected', 'received', 'partial'] as const).optional(),
    poType           : vine.enum(['internal', 'external'] as const),
    discountPercent  : vine.number(),
    taxPercent       : vine.number(),
    createdBy        : vine.number().optional(),
    approvedBy       : vine.number().optional(),
    receivedBy       : vine.number().optional(),
    rejectedBy       : vine.number().optional(),
    description      : vine.string().optional(),
    approvedAt       : vine.date().optional(),
    receivedAt       : vine.date().optional(),
    rejectedAt       : vine.date().optional(),
    attachment: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png', 'pdf', 'docs', 'doc', 'docx', 'xls', 'xlsx', 'csv']
    }).optional(),

    purchaseOrderItems: vine.array(
      vine.object({
        productId    : vine.number(),
        quantity     : vine.number(),
        price        : vine.number(),
        subtotal     : vine.number(),
        warehouseId  : vine.number().optional(),
        description  : vine.string().optional(),
        statusPartial: vine.boolean().optional(),
        receivedQty  : vine.number().optional(),
      })
    ).minLength(1),
  })
)
