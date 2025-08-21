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
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm';
import PurchaseInvoice from '#models/purchase_invoice';
import PurchaseOrder from '#models/purchase_order';
export default class Vendor extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Vendor.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Vendor.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Vendor.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Vendor.prototype, "name", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Vendor.prototype, "email", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Vendor.prototype, "phone", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Vendor.prototype, "address", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Vendor.prototype, "npwp", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Vendor.prototype, "logo", void 0);
__decorate([
    hasMany(() => PurchaseInvoice),
    __metadata("design:type", Object)
], Vendor.prototype, "purchaseInvoices", void 0);
__decorate([
    hasMany(() => PurchaseOrder),
    __metadata("design:type", Object)
], Vendor.prototype, "purchaseOrders", void 0);
//# sourceMappingURL=vendor.js.map