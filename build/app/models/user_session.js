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
import User from '#models/auth/user';
export default class UserSession extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], UserSession.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], UserSession.prototype, "userId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], UserSession.prototype, "sessionId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], UserSession.prototype, "ipAddress", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], UserSession.prototype, "userAgent", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], UserSession.prototype, "deviceType", void 0);
__decorate([
    column(),
    __metadata("design:type", Boolean)
], UserSession.prototype, "isActive", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", DateTime)
], UserSession.prototype, "lastActivity", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], UserSession.prototype, "loginAt", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", Object)
], UserSession.prototype, "logoutAt", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'userId',
    }),
    __metadata("design:type", Object)
], UserSession.prototype, "user", void 0);
//# sourceMappingURL=user_session.js.map