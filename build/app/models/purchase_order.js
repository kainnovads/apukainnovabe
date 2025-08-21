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
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm';
import Vendor from '#models/vendor';
import Perusahaan from '#models/perusahaan';
import Cabang from '#models/cabang';
import PurchaseOrderItem from '#models/purchase_order_item';
import { randomUUID } from 'node:crypto';
import User from '#models/auth/user';
export default class PurchaseOrder extends BaseModel {
    static table = 'purchase_orders';
    static assignUuid(po) {
        po.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], PurchaseOrder.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], PurchaseOrder.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "vendorId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "perusahaanId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "cabangId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "noPo", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "up", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "extNamaPerusahaan", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "dueDate", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "poType", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "total", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "discountPercent", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "taxPercent", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "createdBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "approvedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "receivedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "rejectedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "approvedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "receivedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "rejectedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "attachment", void 0);
__decorate([
    belongsTo(() => Vendor),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "vendor", void 0);
__decorate([
    belongsTo(() => Perusahaan),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "perusahaan", void 0);
__decorate([
    belongsTo(() => Cabang),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "cabang", void 0);
__decorate([
    hasMany(() => PurchaseOrderItem),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "purchaseOrderItems", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "createdByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "approvedByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'receivedBy',
    }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "receivedByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], PurchaseOrder.prototype, "rejectedByUser", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PurchaseOrder]),
    __metadata("design:returntype", void 0)
], PurchaseOrder, "assignUuid", null);
//# sourceMappingURL=purchase_order.js.map