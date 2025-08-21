import vine from '@vinejs/vine';
export const productValidator = vine.compile(vine.object({
    name: vine.string().minLength(1),
    sku: vine.string().minLength(1),
    stockMin: vine.number(),
    priceBuy: vine.number(),
    priceSell: vine.number(),
    isService: vine.boolean(),
    image: vine.file({
        size: '2mb',
        extnames: ['jpg', 'png', 'pdf', 'docs']
    }).optional(),
    berat: vine.number().optional(),
    kondisi: vine.enum(['baru', 'bekas', 'rusak', 'servis']),
    unitId: vine.number(),
    categoryId: vine.number(),
}));
//# sourceMappingURL=product.js.map