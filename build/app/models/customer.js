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
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm';
import SalesInvoice from '#models/sales_invoice';
import Product from '#models/product';
import SalesReturn from '#models/sales_return';
import SuratJalan from '#models/surat_jalan';
export default class Customer extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Customer.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Customer.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Customer.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Customer.prototype, "name", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Customer.prototype, "email", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Customer.prototype, "phone", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Customer.prototype, "address", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Customer.prototype, "npwp", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Customer.prototype, "logo", void 0);
__decorate([
    hasMany(() => SalesInvoice),
    __metadata("design:type", Object)
], Customer.prototype, "salesInvoices", void 0);
__decorate([
    hasMany(() => SalesReturn),
    __metadata("design:type", Object)
], Customer.prototype, "salesReturns", void 0);
__decorate([
    manyToMany(() => Product, {
        pivotTable: 'product_customers',
        pivotColumns: ['price_sell'],
    }),
    __metadata("design:type", Object)
], Customer.prototype, "products", void 0);
__decorate([
    hasMany(() => SuratJalan),
    __metadata("design:type", Object)
], Customer.prototype, "suratJalans", void 0);
//# sourceMappingURL=customer.js.map