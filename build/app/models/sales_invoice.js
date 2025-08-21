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
import Customer from '#models/customer';
import SalesOrder from '#models/sales_order';
import SalesInvoiceItem from '#models/sales_invoice_item';
import { randomUUID } from 'node:crypto';
export default class SalesInvoice extends BaseModel {
    static assignUuid(invoice) {
        invoice.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], SalesInvoice.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], SalesInvoice.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], SalesInvoice.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesInvoice.prototype, "noInvoice", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesInvoice.prototype, "up", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesInvoice.prototype, "email", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesInvoice.prototype, "salesOrderId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesInvoice.prototype, "customerId", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SalesInvoice.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SalesInvoice.prototype, "dueDate", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "discountPercent", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "taxPercent", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "dpp", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "total", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "paidAmount", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoice.prototype, "remainingAmount", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesInvoice.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesInvoice.prototype, "description", void 0);
__decorate([
    belongsTo(() => SalesOrder),
    __metadata("design:type", Object)
], SalesInvoice.prototype, "salesOrder", void 0);
__decorate([
    belongsTo(() => Customer),
    __metadata("design:type", Object)
], SalesInvoice.prototype, "customer", void 0);
__decorate([
    hasMany(() => SalesInvoiceItem),
    __metadata("design:type", Object)
], SalesInvoice.prototype, "salesInvoiceItems", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SalesInvoice]),
    __metadata("design:returntype", void 0)
], SalesInvoice, "assignUuid", null);
//# sourceMappingURL=sales_invoice.js.map