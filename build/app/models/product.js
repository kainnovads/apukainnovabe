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
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm';
import Unit from '#models/unit';
import Category from '#models/category';
import StockInDetail from '#models/stock_in_detail';
import StockOutDetail from '#models/stock_out_detail';
import Customer from '#models/customer';
import Stock from '#models/stock';
export default class Product extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Product.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Product.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Product.prototype, "sku", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "unitId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "categoryId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "stockMin", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "priceBuy", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "priceSell", void 0);
__decorate([
    column(),
    __metadata("design:type", Boolean)
], Product.prototype, "isService", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Product.prototype, "image", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "berat", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Product.prototype, "kondisi", void 0);
__decorate([
    belongsTo(() => Unit),
    __metadata("design:type", Object)
], Product.prototype, "unit", void 0);
__decorate([
    belongsTo(() => Category),
    __metadata("design:type", Object)
], Product.prototype, "category", void 0);
__decorate([
    hasMany(() => StockInDetail),
    __metadata("design:type", Object)
], Product.prototype, "stockInDetails", void 0);
__decorate([
    hasMany(() => StockOutDetail),
    __metadata("design:type", Object)
], Product.prototype, "stockOutDetails", void 0);
__decorate([
    hasMany(() => Stock),
    __metadata("design:type", Object)
], Product.prototype, "stocks", void 0);
__decorate([
    manyToMany(() => Customer, {
        pivotTable: 'product_customers',
        pivotColumns: ['price_sell'],
    }),
    __metadata("design:type", Object)
], Product.prototype, "customers", void 0);
//# sourceMappingURL=product.js.map