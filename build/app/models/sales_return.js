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
import { BaseModel, column, hasMany, belongsTo, beforeCreate } from '@adonisjs/lucid/orm';
import SalesReturnItem from '#models/sales_return_item';
import SalesOrder from '#models/sales_order';
import { randomUUID } from 'node:crypto';
import Customer from '#models/customer';
import Perusahaan from '#models/perusahaan';
import Cabang from '#models/cabang';
import User from '#models/auth/user';
export default class SalesReturn extends BaseModel {
    static table = 'sales_returns';
    static assignUuid(sr) {
        sr.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], SalesReturn.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturn.prototype, "noSr", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturn.prototype, "customerId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturn.prototype, "perusahaanId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturn.prototype, "cabangId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturn.prototype, "salesOrderId", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], SalesReturn.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], SalesReturn.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SalesReturn.prototype, "returnDate", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturn.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturn.prototype, "totalReturnAmount", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturn.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturn.prototype, "attachment", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturn.prototype, "createdBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturn.prototype, "approvedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturn.prototype, "rejectedBy", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", DateTime)
], SalesReturn.prototype, "approvedAt", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", DateTime)
], SalesReturn.prototype, "rejectedAt", void 0);
__decorate([
    hasMany(() => SalesReturnItem),
    __metadata("design:type", Object)
], SalesReturn.prototype, "salesReturnItems", void 0);
__decorate([
    belongsTo(() => SalesOrder),
    __metadata("design:type", Object)
], SalesReturn.prototype, "salesOrder", void 0);
__decorate([
    belongsTo(() => Customer),
    __metadata("design:type", Object)
], SalesReturn.prototype, "customer", void 0);
__decorate([
    belongsTo(() => Perusahaan),
    __metadata("design:type", Object)
], SalesReturn.prototype, "perusahaan", void 0);
__decorate([
    belongsTo(() => Cabang),
    __metadata("design:type", Object)
], SalesReturn.prototype, "cabang", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], SalesReturn.prototype, "createdByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], SalesReturn.prototype, "approvedByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], SalesReturn.prototype, "rejectedByUser", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SalesReturn]),
    __metadata("design:returntype", void 0)
], SalesReturn, "assignUuid", null);
//# sourceMappingURL=sales_return.js.map