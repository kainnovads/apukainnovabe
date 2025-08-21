import Role from '#models/auth/role';
import Permission from '#models/auth/permission';
import { createRoleValidator } from '#validators/auth/role';
import db from '@adonisjs/lucid/services/db';
export default class RolesController {
    async index({ request, response }) {
        try {
            const draw = Number(request.input('draw', 1));
            const start = Number(request.input('start', 0));
            const length = Number(request.input('length', 10));
            const searchValue = request.input('search.value', '');
            const total = await Role.query().count('* as total');
            const recordsTotal = total[0]?.$extras.total || 0;
            let dataQuery = Role.query();
            if (searchValue) {
                dataQuery = dataQuery.where('name', 'like', `%${searchValue}%`);
            }
            const filtered = await dataQuery.clone().count('* as total');
            const recordsFiltered = filtered[0]?.$extras.total || 0;
            const data = await dataQuery.preload('permissions').offset(start).limit(length);
            const mappedData = data.map((role) => ({
                id: role.id,
                name: role.name,
                permissions: role.permissions.map((p) => p.name),
            }));
            return response.ok({
                draw,
                recordsTotal,
                recordsFiltered,
                data: mappedData,
            });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data role',
                error: error.message,
            });
        }
    }
    async show({ params, response }) {
        try {
            const role = await Role.query().where('id', params.id).preload('permissions').first();
            if (!role) {
                return response.notFound({ message: 'Role tidak ditemukan' });
            }
            return response.ok({
                ...role.serialize(),
                permissions: role.permissions.map((p) => p.id),
            });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data role',
                error: error.message,
            });
        }
    }
    async store({ request, response }) {
        const trx = await db.transaction();
        try {
            const { name, permissionIds } = await request.validateUsing(createRoleValidator);
            const role = await Role.create({ name }, { client: trx });
            if (permissionIds?.length) {
                await role.related('permissions').attach(permissionIds, trx);
            }
            await trx.commit();
            const roleWithPermissions = await Role.query()
                .where('id', role.id)
                .preload('permissions')
                .first();
            return response.created(roleWithPermissions);
        }
        catch (error) {
            await trx.rollback();
            if (error.messages) {
                return response.badRequest({
                    message: 'Validasi Gagal',
                    errors: error.messages,
                });
            }
            return response.badRequest({
                message: 'Gagal membuat role',
                error: error.message,
            });
        }
    }
    async update({ params, request, response }) {
        const trx = await db.transaction();
        try {
            const role = await Role.findOrFail(params.id, { client: trx });
            const { name, permissionIds } = request.only(['name', 'permissionIds']);
            role.name = name;
            await role.save();
            await role.related('permissions').sync(permissionIds || [], true, trx);
            await trx.commit();
            const updatedRole = await Role.query().where('id', role.id).preload('permissions').first();
            return response.ok({
                message: 'Role berhasil diperbarui',
                role: updatedRole,
            });
        }
        catch (error) {
            await trx.rollback();
            if (error.messages) {
                return response.badRequest({
                    message: 'Validasi Gagal',
                    errors: error.messages,
                });
            }
            return response.badRequest({
                message: 'Gagal membuat role',
                error: error.message,
            });
        }
    }
    async destroy({ params, response }) {
        const trx = await db.transaction();
        try {
            const role = await Role.findOrFail(params.id, { client: trx });
            await role.related('permissions').detach([], trx);
            await role.delete();
            await trx.commit();
            return response.ok({ message: 'Role berhasil dihapus' });
        }
        catch (error) {
            await trx.rollback();
            return response.badRequest({
                message: 'Gagal menghapus role',
                error: error.message,
            });
        }
    }
    async getPermissions({ response }) {
        try {
            const permissions = await Permission.query().orderBy('name', 'asc');
            return response.ok(permissions);
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data permission',
                error: error.message,
            });
        }
    }
    async usersByRole({ response }) {
        try {
            const users = await db
                .from('users')
                .whereIn('role_id', [1, 2, 3])
                .select('id', 'name', 'email', 'role_id');
            const totals = await db
                .from('users')
                .whereIn('role_id', [1, 2, 3])
                .select('role_id')
                .count('* as total')
                .groupBy('role_id');
            const totalPerRole = {};
            totals.forEach((row) => {
                totalPerRole[row.role_id] = Number(row.total);
            });
            const totalKeseluruhan = users.length;
            return response.ok({
                users,
                total_per_role: totalPerRole,
                total_keseluruhan: totalKeseluruhan,
            });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Gagal mengambil data user berdasarkan role',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=roles_controller.js.map