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
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import Pegawai from '#models/pegawai';
import CutiType from '#models/cuti_type';
export default class CutiBalance extends BaseModel {
    static table = 'cuti_balance';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], CutiBalance.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CutiBalance.prototype, "pegawaiId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CutiBalance.prototype, "cuti_type_id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CutiBalance.prototype, "tahun", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CutiBalance.prototype, "sisa_jatah_cuti", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CutiBalance.prototype, "cuti_terpakai", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CutiBalance.prototype, "sisa_cuti_tahun_lalu", void 0);
__decorate([
    column.date(),
    __metadata("design:type", Object)
], CutiBalance.prototype, "valid_sampai", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], CutiBalance.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], CutiBalance.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => Pegawai, {
        foreignKey: 'pegawaiId',
        localKey: 'id_pegawai',
    }),
    __metadata("design:type", Object)
], CutiBalance.prototype, "pegawai", void 0);
__decorate([
    belongsTo(() => CutiType, {
        foreignKey: 'cuti_type_id',
    }),
    __metadata("design:type", Object)
], CutiBalance.prototype, "cutiType", void 0);
//# sourceMappingURL=cuti_balance.js.map