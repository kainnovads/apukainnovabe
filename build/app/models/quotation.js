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
import { randomUUID } from 'node:crypto';
import Customer from '#models/customer';
import Perusahaan from '#models/perusahaan';
import Cabang from '#models/cabang';
import QuotationItem from '#models/quotation_item';
import User from '#models/auth/user';
import SalesOrder from '#models/sales_order';
export default class Quotation extends BaseModel {
    static table = 'quotations';
    static assignUuid(quotation) {
        quotation.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], Quotation.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Quotation.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Quotation.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "customerId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "perusahaanId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "cabangId", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], Quotation.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], Quotation.prototype, "validUntil", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], Quotation.prototype, "shipDate", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Quotation.prototype, "fobPoint", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Quotation.prototype, "termsOfPayment", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Quotation.prototype, "prNumber", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Quotation.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Quotation.prototype, "noQuotation", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Quotation.prototype, "up", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Quotation.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "total", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "discountPercent", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "taxPercent", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "createdBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "approvedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Quotation.prototype, "rejectedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], Quotation.prototype, "approvedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], Quotation.prototype, "rejectedAt", void 0);
__decorate([
    belongsTo(() => Customer),
    __metadata("design:type", Object)
], Quotation.prototype, "customer", void 0);
__decorate([
    belongsTo(() => Perusahaan),
    __metadata("design:type", Object)
], Quotation.prototype, "perusahaan", void 0);
__decorate([
    belongsTo(() => Cabang),
    __metadata("design:type", Object)
], Quotation.prototype, "cabang", void 0);
__decorate([
    hasMany(() => QuotationItem),
    __metadata("design:type", Object)
], Quotation.prototype, "quotationItems", void 0);
__decorate([
    hasMany(() => SalesOrder),
    __metadata("design:type", Object)
], Quotation.prototype, "salesOrders", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], Quotation.prototype, "createdByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], Quotation.prototype, "approvedByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], Quotation.prototype, "rejectedByUser", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Quotation]),
    __metadata("design:returntype", void 0)
], Quotation, "assignUuid", null);
//# sourceMappingURL=quotation.js.map