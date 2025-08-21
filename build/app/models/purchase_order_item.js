var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { DateTime } from 'luxon';
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm';
import PurchaseOrder from '#models/purchase_order';
import Product from '#models/product';
import Warehouse from '#models/warehouse';
import { randomUUID } from 'node:crypto';
export default class PurchaseOrderItem extends BaseModel {
    static assignUuid(poi) {
        poi.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], PurchaseOrderItem.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], PurchaseOrderItem.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], PurchaseOrderItem.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PurchaseOrderItem.prototype, "purchaseOrderId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrderItem.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrderItem.prototype, "warehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrderItem.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrderItem.prototype, "price", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrderItem.prototype, "subtotal", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrderItem.prototype, "statusPartial", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrderItem.prototype, "receivedQty", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrderItem.prototype, "description", void 0);
__decorate([
    column(),
    belongsTo(() => PurchaseOrder),
    __metadata("design:type", Object)
], PurchaseOrderItem.prototype, "purchaseOrder", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], PurchaseOrderItem.prototype, "product", void 0);
__decorate([
    belongsTo(() => Warehouse),
    __metadata("design:type", Object)
], PurchaseOrderItem.prototype, "warehouse", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PurchaseOrderItem]),
    __metadata("design:returntype", void 0)
], PurchaseOrderItem, "assignUuid", null);
//# sourceMappingURL=purchase_order_item.js.map