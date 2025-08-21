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
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm';
import MenuGroup from '#models/menu_group';
import MenuDetail from '#models/menu_detail';
import Role from '#models/auth/role';
export default class Permission extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Permission.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Permission.prototype, "name", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Permission.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Permission.prototype, "updatedAt", void 0);
__decorate([
    manyToMany(() => MenuGroup, {
        pivotTable: 'menu_group_permission',
        localKey: 'id',
        pivotForeignKey: 'permission_id',
        relatedKey: 'id',
        pivotRelatedForeignKey: 'menu_group_id',
    }),
    __metadata("design:type", Object)
], Permission.prototype, "menuGroups", void 0);
__decorate([
    manyToMany(() => MenuDetail, {
        pivotTable: 'menu_detail_permission',
        localKey: 'id',
        pivotForeignKey: 'permission_id',
        relatedKey: 'id',
        pivotRelatedForeignKey: 'menu_detail_id',
    }),
    __metadata("design:type", Object)
], Permission.prototype, "menuDetails", void 0);
__decorate([
    manyToMany(() => Role, {
        pivotTable: 'permission_role',
        localKey: 'id',
        pivotForeignKey: 'permission_id',
        relatedKey: 'id',
        pivotRelatedForeignKey: 'role_id',
    }),
    __metadata("design:type", Object)
], Permission.prototype, "roles", void 0);
//# sourceMappingURL=permission.js.map