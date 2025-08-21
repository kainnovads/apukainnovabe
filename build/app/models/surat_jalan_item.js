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
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm';
import SalesOrderItem from '#models/sales_order_item';
import SuratJalan from '#models/surat_jalan';
import Product from '#models/product';
import Warehouse from '#models/warehouse';
import { randomUUID } from 'node:crypto';
export default class SuratJalanItem extends BaseModel {
    static assignUuid(item) {
        item.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], SuratJalanItem.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], SuratJalanItem.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], SuratJalanItem.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SuratJalanItem.prototype, "suratJalanId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SuratJalanItem.prototype, "salesOrderItemId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SuratJalanItem.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SuratJalanItem.prototype, "warehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SuratJalanItem.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SuratJalanItem.prototype, "description", void 0);
__decorate([
    column(),
    belongsTo(() => SuratJalan),
    __metadata("design:type", Object)
], SuratJalanItem.prototype, "suratJalan", void 0);
__decorate([
    belongsTo(() => SalesOrderItem),
    __metadata("design:type", Object)
], SuratJalanItem.prototype, "salesOrderItem", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], SuratJalanItem.prototype, "product", void 0);
__decorate([
    belongsTo(() => Warehouse),
    __metadata("design:type", Object)
], SuratJalanItem.prototype, "warehouse", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SuratJalanItem]),
    __metadata("design:returntype", void 0)
], SuratJalanItem, "assignUuid", null);
//# sourceMappingURL=surat_jalan_item.js.map