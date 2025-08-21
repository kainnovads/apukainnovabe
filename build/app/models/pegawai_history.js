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
import Jabatan from '#models/jabatan';
import Perusahaan from '#models/perusahaan';
import Cabang from '#models/cabang';
import Divisi from '#models/divisi';
import Departemen from '#models/departemen';
export default class PegawaiHistory extends BaseModel {
    static table = 'pegawai_history';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "pegawai_id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "jabatan_id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "perusahaan_id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "cabang_id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "divisi_id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "departemen_id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "gaji_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], PegawaiHistory.prototype, "tunjangan_pegawai", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], PegawaiHistory.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], PegawaiHistory.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => Pegawai),
    __metadata("design:type", Object)
], PegawaiHistory.prototype, "pegawai", void 0);
__decorate([
    belongsTo(() => Jabatan, {
        foreignKey: 'jabatan_id',
    }),
    __metadata("design:type", Object)
], PegawaiHistory.prototype, "jabatan", void 0);
__decorate([
    belongsTo(() => Perusahaan, {
        foreignKey: 'perusahaan_id',
    }),
    __metadata("design:type", Object)
], PegawaiHistory.prototype, "perusahaan", void 0);
__decorate([
    belongsTo(() => Cabang, {
        foreignKey: 'cabang_id',
    }),
    __metadata("design:type", Object)
], PegawaiHistory.prototype, "cabang", void 0);
__decorate([
    belongsTo(() => Divisi, {
        foreignKey: 'divisi_id',
    }),
    __metadata("design:type", Object)
], PegawaiHistory.prototype, "divisi", void 0);
__decorate([
    belongsTo(() => Departemen, {
        foreignKey: 'departemen_id',
    }),
    __metadata("design:type", Object)
], PegawaiHistory.prototype, "departemen", void 0);
//# sourceMappingURL=pegawai_history.js.map