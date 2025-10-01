import vine from '@vinejs/vine'

export const customerValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255),
    code: vine.string().minLength(1).maxLength(30).optional(),
    address: vine.string().minLength(1).maxLength(255),
    email: vine.string().minLength(1).maxLength(30),
    phone: vine.string().minLength(1).maxLength(30),
    npwp: vine.string().maxLength(30).optional(),
    logo: vine.file().optional(),

    customerProducts: vine.array(
      vine.object({
        productId: vine.number(),
        priceSell: vine.number(),
      })
    ).optional(),
  })
)