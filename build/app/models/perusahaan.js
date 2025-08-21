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
import { BaseModel, column, hasOne, hasMany } from '@adonisjs/lucid/orm';
import Pegawai from '#models/pegawai';
import Cabang from '#models/cabang';
import PurchaseOrder from '#models/purchase_order';
import SalesOrder from '#models/sales_order';
import StockTransfer from '#models/stock_transfer';
import SalesReturn from '#models/sales_return';
export default class Perusahaan extends BaseModel {
    static table = 'perusahaan';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Perusahaan.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Perusahaan.prototype, "nmPerusahaan", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Perusahaan.prototype, "alamatPerusahaan", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Perusahaan.prototype, "tlpPerusahaan", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Perusahaan.prototype, "emailPerusahaan", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Perusahaan.prototype, "npwpPerusahaan", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Perusahaan.prototype, "kodePerusahaan", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Perusahaan.prototype, "logoPerusahaan", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Perusahaan.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Perusahaan.prototype, "updatedAt", void 0);
__decorate([
    hasOne(() => Pegawai),
    __metadata("design:type", Object)
], Perusahaan.prototype, "pegawai", void 0);
__decorate([
    hasMany(() => Cabang),
    __metadata("design:type", Object)
], Perusahaan.prototype, "cabang", void 0);
__decorate([
    hasMany(() => PurchaseOrder),
    __metadata("design:type", Object)
], Perusahaan.prototype, "purchaseOrder", void 0);
__decorate([
    hasMany(() => SalesOrder),
    __metadata("design:type", Object)
], Perusahaan.prototype, "salesOrder", void 0);
__decorate([
    hasMany(() => StockTransfer),
    __metadata("design:type", Object)
], Perusahaan.prototype, "stockTransfer", void 0);
__decorate([
    hasMany(() => SalesReturn),
    __metadata("design:type", Object)
], Perusahaan.prototype, "salesReturn", void 0);
//# sourceMappingURL=perusahaan.js.map