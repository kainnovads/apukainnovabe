import PurchaseOrder from '#models/purchase_order';
import PurchaseOrderItem from '#models/purchase_order_item';
import StockIn from '#models/stock_in';
import StockInDetail from '#models/stock_in_detail';
import { DateTime } from 'luxon';
import db from '@adonisjs/lucid/services/db';
export default class PurchaseItemsController {
    async updateStatusPartial({ params, request, response, auth }) {
        const trx = await db.transaction();
        try {
            const { receivedQty } = request.only(['receivedQty']);
            const parsedReceivedQty = Number(receivedQty);
            if (isNaN(parsedReceivedQty)) {
                await trx.rollback();
                return response.badRequest({
                    message: 'Received Qty harus berupa angka yang valid',
                    receivedValue: receivedQty
                });
            }
            if (parsedReceivedQty < 0) {
                await trx.rollback();
                return response.badRequest({
                    message: 'Received Qty tidak boleh negatif',
                    receivedValue: parsedReceivedQty
                });
            }
            const purchaseOrderItem = await PurchaseOrderItem.query({ client: trx })
                .where('id', params.id)
                .preload('product')
                .preload('purchaseOrder')
                .firstOrFail();
            if (parsedReceivedQty > purchaseOrderItem.quantity) {
                await trx.rollback();
                return response.badRequest({
                    message: `Received Qty (${parsedReceivedQty}) tidak boleh melebihi quantity yang dipesan (${purchaseOrderItem.quantity})`,
                    maxAllowed: purchaseOrderItem.quantity
                });
            }
            const purchaseOrder = await PurchaseOrder.query({ client: trx })
                .where('id', purchaseOrderItem.purchaseOrderId)
                .preload('purchaseOrderItems')
                .firstOrFail();
            if (purchaseOrder.status === 'received') {
                await trx.rollback();
                return response.badRequest({
                    message: `Purchase Order sudah dalam status ${purchaseOrder.status.toUpperCase()} dan tidak dapat diubah lagi. Jika ada perubahan yang diperlukan, silakan buat Purchase Return.`,
                    currentStatus: purchaseOrder.status
                });
            }
            const oldReceivedQty = Number(purchaseOrderItem.receivedQty || 0);
            purchaseOrderItem.receivedQty = parsedReceivedQty;
            if (parsedReceivedQty === 0) {
                purchaseOrderItem.statusPartial = false;
            }
            else if (parsedReceivedQty >= purchaseOrderItem.quantity) {
                purchaseOrderItem.statusPartial = false;
            }
            else {
                purchaseOrderItem.statusPartial = true;
            }
            await purchaseOrderItem.useTransaction(trx).save();
            function generateNo() {
                const now = new Date();
                const timestamp = now.getTime();
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                return `SI-${timestamp}-${random}`;
            }
            const item = purchaseOrderItem;
            const currentReceivedQty = Number(item.receivedQty || 0);
            const qtyDifference = currentReceivedQty - oldReceivedQty;
            if (qtyDifference !== 0) {
                if (qtyDifference > 0) {
                    const stockIn = await StockIn.create({
                        noSi: generateNo(),
                        purchaseOrderId: purchaseOrder.id,
                        warehouseId: item.warehouseId || 0,
                        postedBy: auth.user?.id,
                        date: DateTime.now().toJSDate(),
                        status: 'draft',
                        description: `Received ${qtyDifference} unit(s) for ${item.product?.name || 'Unknown Product'}`,
                    }, { client: trx });
                    await StockInDetail.create({
                        stockInId: stockIn.id,
                        productId: item.productId,
                        quantity: qtyDifference,
                        description: `${item.description || ''} - Received ${qtyDifference} units (total: ${currentReceivedQty})`,
                    }, { client: trx });
                }
                else if (qtyDifference < 0) {
                    const qtyToRemove = Math.abs(qtyDifference);
                    const stockInsToUpdate = await StockIn.query({ client: trx })
                        .where('purchaseOrderId', purchaseOrder.id)
                        .whereHas('stockInDetails', (detailQuery) => {
                        detailQuery.where('productId', item.productId);
                    })
                        .where('status', 'draft')
                        .preload('stockInDetails', (detailQuery) => {
                        detailQuery.where('productId', item.productId);
                    })
                        .orderBy('createdAt', 'desc');
                    let remainingQtyToRemove = qtyToRemove;
                    for (const stockIn of stockInsToUpdate) {
                        if (remainingQtyToRemove <= 0)
                            break;
                        for (const detail of stockIn.stockInDetails) {
                            if (detail.productId === item.productId && remainingQtyToRemove > 0) {
                                const currentDetailQty = Number(detail.quantity);
                                if (currentDetailQty <= remainingQtyToRemove) {
                                    await detail.useTransaction(trx).delete();
                                    remainingQtyToRemove -= currentDetailQty;
                                    const remainingDetails = await StockInDetail.query({ client: trx })
                                        .where('stockInId', stockIn.id)
                                        .first();
                                    if (!remainingDetails) {
                                        await stockIn.useTransaction(trx).delete();
                                    }
                                }
                                else {
                                    detail.quantity = currentDetailQty - remainingQtyToRemove;
                                    await detail.useTransaction(trx).save();
                                    remainingQtyToRemove = 0;
                                }
                            }
                        }
                    }
                }
            }
            await purchaseOrder.load('purchaseOrderItems');
            const allItems = purchaseOrder.purchaseOrderItems;
            const totalReceived = allItems.reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0);
            const totalOrdered = allItems.reduce((sum, item) => sum + item.quantity, 0);
            const hasPartialItems = allItems.some(item => {
                const receivedQty = Number(item.receivedQty || 0);
                const isPartial = receivedQty > 0 && receivedQty < item.quantity;
                return isPartial;
            });
            if (totalReceived === 0) {
                purchaseOrder.status = 'approved';
            }
            else if (totalReceived < totalOrdered || hasPartialItems) {
                purchaseOrder.status = 'partial';
            }
            else if (totalReceived >= totalOrdered && !hasPartialItems) {
                purchaseOrder.status = 'received';
                purchaseOrder.receivedAt = new Date();
                if (auth.user) {
                    purchaseOrder.receivedBy = auth.user.id;
                }
            }
            await purchaseOrder.useTransaction(trx).save();
            await trx.commit();
            await purchaseOrderItem.load('product');
            await purchaseOrder.load('purchaseOrderItems', (query) => {
                query.preload('product');
            });
            return response.ok({
                message: 'Status item Purchase Order berhasil diperbarui',
                data: {
                    purchaseOrderItem: purchaseOrderItem.serialize(),
                    purchaseOrder: purchaseOrder.serialize()
                }
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('Error in updateStatusPartial:', error);
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Purchase Order Item tidak ditemukan',
                    itemId: params.id
                });
            }
            return response.internalServerError({
                message: 'Gagal memperbarui status item Purchase Order',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    async receiveAllItems({ params, response, auth }) {
        const trx = await db.transaction();
        try {
            const purchaseOrder = await PurchaseOrder.query({ client: trx })
                .where('id', params.id)
                .preload('purchaseOrderItems', (itemQuery) => {
                itemQuery.preload('product');
            })
                .firstOrFail();
            if (purchaseOrder.status == 'draft') {
                await trx.rollback();
                return response.badRequest({
                    message: 'Purchase Order harus dalam status approved atau partial untuk dapat menerima semua item',
                    currentStatus: purchaseOrder.status
                });
            }
            if (purchaseOrder.status === 'received') {
                await trx.rollback();
                return response.badRequest({
                    message: `Purchase Order sudah dalam status ${purchaseOrder.status.toUpperCase()}, semua item sudah diterima`,
                    currentStatus: purchaseOrder.status
                });
            }
            function generateNo() {
                const now = new Date();
                const timestamp = now.getTime();
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                return `SI-${timestamp}-${random}`;
            }
            let totalStockInsCreated = 0;
            const productsWithPendingQty = [];
            for (const item of purchaseOrder.purchaseOrderItems) {
                const orderedQty = Number(item.quantity || 0);
                const currentReceivedQty = Number(item.receivedQty || 0);
                const pendingQty = orderedQty - currentReceivedQty;
                if (pendingQty <= 0) {
                    continue;
                }
                productsWithPendingQty.push({
                    item: item,
                    pendingQty: pendingQty,
                    orderedQty: orderedQty
                });
                item.receivedQty = orderedQty;
                item.statusPartial = false;
                await item.useTransaction(trx).save();
            }
            if (productsWithPendingQty.length > 0) {
                const warehouseId = productsWithPendingQty[0].item.warehouseId || 0;
                const stockIn = await StockIn.create({
                    noSi: generateNo(),
                    purchaseOrderId: purchaseOrder.id,
                    warehouseId: warehouseId,
                    postedBy: auth.user?.id,
                    date: DateTime.now().toJSDate(),
                    status: 'draft',
                    description: `Receive All - ${productsWithPendingQty.length} products`,
                }, { client: trx });
                for (const productData of productsWithPendingQty) {
                    await StockInDetail.create({
                        stockInId: stockIn.id,
                        productId: productData.item.productId,
                        quantity: productData.pendingQty,
                        description: `Receive All - ${productData.pendingQty} units of ${productData.item.product?.name || 'Product'} (completing to ${productData.orderedQty})`,
                    }, { client: trx });
                }
                totalStockInsCreated = 1;
            }
            await purchaseOrder.load('purchaseOrderItems');
            const allItems = purchaseOrder.purchaseOrderItems;
            const totalReceived = allItems.reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0);
            const totalOrdered = allItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            const hasPartialItems = allItems.some(item => {
                const receivedQty = Number(item.receivedQty || 0);
                return receivedQty > 0 && receivedQty < item.quantity;
            });
            if (totalReceived >= totalOrdered && !hasPartialItems) {
                purchaseOrder.status = 'received';
                purchaseOrder.receivedAt = new Date();
                if (auth.user) {
                    purchaseOrder.receivedBy = auth.user.id;
                }
            }
            else {
                purchaseOrder.status = 'partial';
            }
            await purchaseOrder.useTransaction(trx).save();
            await trx.commit();
            await purchaseOrder.load('purchaseOrderItems', (query) => {
                query.preload('product');
            });
            return response.ok({
                message: totalStockInsCreated > 0
                    ? `Berhasil menerima semua item. ${totalStockInsCreated} Stock In telah dibuat untuk ${productsWithPendingQty.length} produk.`
                    : `Semua item sudah diterima sebelumnya. Tidak ada Stock In baru yang dibuat.`,
                data: {
                    purchaseOrder: purchaseOrder.serialize(),
                    totalStockInsCreated,
                    productsProcessed: productsWithPendingQty.length,
                    summary: {
                        totalOrdered,
                        totalReceived,
                        finalStatus: purchaseOrder.status
                    }
                }
            });
        }
        catch (error) {
            await trx.rollback();
            console.error('Error in receiveAllItems:', error);
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Purchase Order tidak ditemukan',
                    purchaseOrderId: params.id
                });
            }
            return response.internalServerError({
                message: 'Gagal menerima semua item Purchase Order',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}
//# sourceMappingURL=purchase_items_controller.js.map