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
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import Vendor from '#models/vendor';
import PurchaseOrder from '#models/purchase_order';
export default class PurchaseInvoice extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], PurchaseInvoice.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], PurchaseInvoice.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "purchaseOrderId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "vendorId", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], PurchaseInvoice.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], PurchaseInvoice.prototype, "dueDate", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "total", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PurchaseInvoice.prototype, "paidAmount", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PurchaseInvoice.prototype, "description", void 0);
__decorate([
    belongsTo(() => Vendor),
    __metadata("design:type", Object)
], PurchaseInvoice.prototype, "vendor", void 0);
__decorate([
    belongsTo(() => PurchaseOrder),
    __metadata("design:type", Object)
], PurchaseInvoice.prototype, "purchaseOrder", void 0);
//# sourceMappingURL=purchase_invoice.js.map