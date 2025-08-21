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
import MenuDetail from '#models/menu_detail';
import Permission from '#models/auth/permission';
export default class MenuGroup extends BaseModel {
    static table = 'menu_group';
    menuDetails;
    permissions;
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], MenuGroup.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], MenuGroup.prototype, "name", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], MenuGroup.prototype, "icon", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], MenuGroup.prototype, "order", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], MenuGroup.prototype, "jenisMenu", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], MenuGroup.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], MenuGroup.prototype, "updatedAt", void 0);
__decorate([
    hasMany(() => MenuDetail),
    __metadata("design:type", Object)
], MenuGroup.prototype, "menuDetails", void 0);
__decorate([
    manyToMany(() => Permission, {
        pivotTable: 'menu_group_permission',
    }),
    __metadata("design:type", Object)
], MenuGroup.prototype, "permissions", void 0);
//# sourceMappingURL=menu_group.js.map