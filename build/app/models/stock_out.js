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
import StockOutDetail from '#models/stock_out_detail';
import SalesOrder from '#models/sales_order';
import User from '#models/auth/user';
import Warehouse from '#models/warehouse';
import { randomUUID } from 'node:crypto';
export default class StockOut extends BaseModel {
    static assignUuid(stockOut) {
        stockOut.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], StockOut.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], StockOut.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], StockOut.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockOut.prototype, "noSo", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], StockOut.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], StockOut.prototype, "postedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockOut.prototype, "salesOrderId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockOut.prototype, "warehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockOut.prototype, "postedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockOut.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockOut.prototype, "description", void 0);
__decorate([
    hasMany(() => StockOutDetail),
    __metadata("design:type", Object)
], StockOut.prototype, "stockOutDetails", void 0);
__decorate([
    belongsTo(() => SalesOrder),
    __metadata("design:type", Object)
], StockOut.prototype, "salesOrder", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'postedBy',
    }),
    __metadata("design:type", Object)
], StockOut.prototype, "postedByUser", void 0);
__decorate([
    belongsTo(() => Warehouse),
    __metadata("design:type", Object)
], StockOut.prototype, "warehouse", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StockOut]),
    __metadata("design:returntype", void 0)
], StockOut, "assignUuid", null);
//# sourceMappingURL=stock_out.js.map