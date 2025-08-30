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
import SalesOrderItem from '#models/sales_order_item';
import Customer from '#models/customer';
import User from '#models/auth/user';
import Cabang from '#models/cabang';
import Perusahaan from '#models/perusahaan';
import SalesReturn from '#models/sales_return';
import SuratJalan from '#models/surat_jalan';
import Quotation from '#models/quotation';
export default class SalesOrder extends BaseModel {
    static table = 'sales_orders';
    static assignUuid(so) {
        so.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], SalesOrder.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], SalesOrder.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], SalesOrder.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrder.prototype, "noSo", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrder.prototype, "noPo", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrder.prototype, "up", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "customerId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "perusahaanId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "cabangId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "quotationId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "termOfPayment", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SalesOrder.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SalesOrder.prototype, "dueDate", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrder.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrder.prototype, "paymentMethod", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrder.prototype, "source", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrder.prototype, "total", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrder.prototype, "discountPercent", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrder.prototype, "taxPercent", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "createdBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "approvedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SalesOrder.prototype, "approvedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "rejectedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SalesOrder.prototype, "rejectedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesOrder.prototype, "deliveredBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SalesOrder.prototype, "deliveredAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrder.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrder.prototype, "attachment", void 0);
__decorate([
    hasMany(() => SalesOrderItem),
    __metadata("design:type", Object)
], SalesOrder.prototype, "salesOrderItems", void 0);
__decorate([
    hasMany(() => SalesReturn),
    __metadata("design:type", Object)
], SalesOrder.prototype, "salesReturns", void 0);
__decorate([
    belongsTo(() => Customer),
    __metadata("design:type", Object)
], SalesOrder.prototype, "customer", void 0);
__decorate([
    belongsTo(() => Cabang),
    __metadata("design:type", Object)
], SalesOrder.prototype, "cabang", void 0);
__decorate([
    belongsTo(() => Perusahaan),
    __metadata("design:type", Object)
], SalesOrder.prototype, "perusahaan", void 0);
__decorate([
    belongsTo(() => Quotation),
    __metadata("design:type", Object)
], SalesOrder.prototype, "quotation", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "createdByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "approvedByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "rejectedByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'deliveredBy',
    }),
    __metadata("design:type", Object)
], SalesOrder.prototype, "deliveredByUser", void 0);
__decorate([
    hasMany(() => SuratJalan),
    __metadata("design:type", Object)
], SalesOrder.prototype, "suratJalans", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SalesOrder]),
    __metadata("design:returntype", void 0)
], SalesOrder, "assignUuid", null);
//# sourceMappingURL=sales_order.js.map