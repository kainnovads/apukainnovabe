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
import { column, BaseModel, hasMany, belongsTo } from '@adonisjs/lucid/orm';
import PegawaiHistory from '#models/pegawai_history';
import Users from '#models/auth/user';
import CutiBalance from '#models/cuti_balance';
export default class Pegawai extends BaseModel {
    static table = 'pegawai';
}
__decorate([
    column({ isPrimary: true, columnName: 'id_pegawai' }),
    __metadata("design:type", Number)
], Pegawai.prototype, "id_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Pegawai.prototype, "nm_pegawai", void 0);
__decorate([
    column.date(),
    __metadata("design:type", DateTime)
], Pegawai.prototype, "tgl_lahir_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Pegawai.prototype, "tmp_lahir_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Pegawai.prototype, "no_tlp_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Pegawai.prototype, "pendidikan_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Pegawai.prototype, "alamat_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Pegawai.prototype, "status_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Pegawai.prototype, "no_ktp_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Pegawai.prototype, "nik_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Pegawai.prototype, "npwp_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Pegawai.prototype, "jenis_kelamin_pegawai", void 0);
__decorate([
    column.date(),
    __metadata("design:type", DateTime)
], Pegawai.prototype, "tgl_masuk_pegawai", void 0);
__decorate([
    column.date(),
    __metadata("design:type", Object)
], Pegawai.prototype, "tgl_keluar_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Pegawai.prototype, "istri_suami_pegawai", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Pegawai.prototype, "anak_1", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Pegawai.prototype, "anak_2", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Pegawai.prototype, "avatar", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Pegawai.prototype, "user_id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Pegawai.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Pegawai.prototype, "updatedAt", void 0);
__decorate([
    hasMany(() => PegawaiHistory, {
        foreignKey: 'pegawai_id',
    }),
    __metadata("design:type", Object)
], Pegawai.prototype, "PegawaiHistory", void 0);
__decorate([
    hasMany(() => CutiBalance),
    __metadata("design:type", Object)
], Pegawai.prototype, "CutiBalance", void 0);
__decorate([
    belongsTo(() => Users, {
        foreignKey: 'user_id',
        localKey: 'id',
    }),
    __metadata("design:type", Object)
], Pegawai.prototype, "users", void 0);
//# sourceMappingURL=pegawai.js.map