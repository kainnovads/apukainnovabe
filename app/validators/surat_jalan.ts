import vine from '@vinejs/vine'

export const suratJalanValidator = vine.compile(
  vine.object({
    picName: vine.string(),
    salesOrderId: vine.string().optional(),
    customerId: vine.number(),
    date: vine.date(),
    description: vine.string().optional(),
    alamatPengiriman: vine.string().optional(),
    suratJalanItems: vine.array(
      vine.object({
        salesOrderItemId: vine.string().optional(),
        productId: vine.number(),
        warehouseId: vine.number(),
        quantity: vine.number(),
        description: vine.string().optional(),
      })
    ).optional(),
  })
)

export const updateSuratJalanValidator = vine.compile(
  vine.object({
    picName: vine.string().optional(),
    salesOrderId: vine.string().optional().nullable(),
    customerId: vine.number().optional(),
    date: vine.date().optional(),
    description: vine.string().optional().nullable(),
    alamatPengiriman: vine.string().optional().nullable(),
    suratJalanItems: vine.array(
      vine.object({
        salesOrderItemId: vine.string().optional().nullable(),
        productId: vine.number(),
        warehouseId: vine.number(),
        quantity: vine.number(),
        description: vine.string().optional().nullable(),
      })
    ).optional(),
  })
)
