import Role from '#models/auth/role';
import Permission from '#models/auth/permission';
import { BaseSeeder } from '@adonisjs/lucid/seeders';
import MenuGroup from '#models/menu_group';
import MenuDetail from '#models/menu_detail';
import db from '@adonisjs/lucid/services/db';
export default class RolePermissionSeeder extends BaseSeeder {
    async run() {
        await db.from('permission_roles').delete();
        await db.from('menu_detail_permission').delete();
        await db.from('menu_group_permission').delete();
        await Role.query().delete();
        await Permission.query().delete();
        const menuGroups = await MenuGroup.all();
        const menuDetails = await MenuDetail.all();
        const permissionsToCreate = [];
        for (const menuGroup of menuGroups) {
            const permissionName = `view_${menuGroup.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`;
            permissionsToCreate.push({ name: permissionName });
        }
        for (const menuDetail of menuDetails) {
            const baseName = menuDetail.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
            permissionsToCreate.push({ name: `view_${baseName}` });
            permissionsToCreate.push({ name: `create_${baseName}` });
            permissionsToCreate.push({ name: `edit_${baseName}` });
            permissionsToCreate.push({ name: `delete_${baseName}` });
            permissionsToCreate.push({ name: `show_${baseName}` });
        }
        const adminPermissions = [
            { name: 'view_role' },
            { name: 'create_role' },
            { name: 'edit_role' },
            { name: 'delete_role' },
            { name: 'show_role' },
            { name: 'view_menu_group' },
            { name: 'create_menu_group' },
            { name: 'edit_menu_group' },
            { name: 'delete_menu_group' },
            { name: 'show_menu_group' },
            { name: 'view_menu_detail' },
            { name: 'create_menu_detail' },
            { name: 'edit_menu_detail' },
            { name: 'delete_menu_detail' },
            { name: 'show_menu_detail' },
            { name: 'view_permission' },
            { name: 'create_permission' },
            { name: 'edit_permission' },
            { name: 'delete_permission' },
            { name: 'show_permission' },
            { name: 'access_perusahaan_data' },
            { name: 'access_cabang_data' },
            { name: 'access_warehouse_data' },
            { name: 'access_product_data' },
            { name: 'access_customer_data' },
            { name: 'access_vendor_data' },
        ];
        const dynamicallyGeneratedPermissions = new Set(permissionsToCreate.map((p) => p.name));
        const uniqueAdminPermissions = adminPermissions.filter((p) => !dynamicallyGeneratedPermissions.has(p.name));
        permissionsToCreate.push(...uniqueAdminPermissions);
        const allPermissions = await Permission.createMany(permissionsToCreate);
        for (const menuGroup of menuGroups) {
            const permissionName = `view_${menuGroup.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`;
            const permission = allPermissions.find((p) => p.name === permissionName);
            if (permission) {
                await menuGroup.related('permissions').attach([permission.id]);
            }
        }
        for (const menuDetail of menuDetails) {
            const baseName = menuDetail.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
            const viewPerm = allPermissions.find((p) => p.name === `view_${baseName}`);
            const createPerm = allPermissions.find((p) => p.name === `create_${baseName}`);
            const editPerm = allPermissions.find((p) => p.name === `edit_${baseName}`);
            const deletePerm = allPermissions.find((p) => p.name === `delete_${baseName}`);
            const showPerm = allPermissions.find((p) => p.name === `show_${baseName}`);
            const permissionIds = [];
            if (viewPerm)
                permissionIds.push(viewPerm.id);
            if (createPerm)
                permissionIds.push(createPerm.id);
            if (editPerm)
                permissionIds.push(editPerm.id);
            if (deletePerm)
                permissionIds.push(deletePerm.id);
            if (showPerm)
                permissionIds.push(showPerm.id);
            if (permissionIds.length > 0) {
                await menuDetail.related('permissions').attach(permissionIds);
            }
        }
        const superadminRole = await Role.create({ name: 'superadmin' });
        const adminRole = await Role.create({ name: 'admin' });
        const guestRole = await Role.create({ name: 'guest' });
        await superadminRole.related('permissions').attach(allPermissions.map((p) => p.id));
        const viewPermissions = allPermissions.filter((p) => p.name.startsWith('view_'));
        if (viewPermissions.length > 0) {
            const viewPermissionIds = viewPermissions.map((p) => p.id);
            await adminRole.related('permissions').attach(viewPermissionIds);
            await guestRole.related('permissions').attach(viewPermissionIds);
        }
    }
}
//# sourceMappingURL=role_permission_seeder.js.map