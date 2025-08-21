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
import Customer from '#models/customer';
import Product from '#models/product';
export default class ProductCustomer extends BaseModel {
    static table = 'product_customers';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], ProductCustomer.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], ProductCustomer.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], ProductCustomer.prototype, "customerId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], ProductCustomer.prototype, "priceSell", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], ProductCustomer.prototype, "product", void 0);
__decorate([
    belongsTo(() => Customer),
    __metadata("design:type", Object)
], ProductCustomer.prototype, "customer", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], ProductCustomer.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], ProductCustomer.prototype, "updatedAt", void 0);
//# sourceMappingURL=product_customer.js.map