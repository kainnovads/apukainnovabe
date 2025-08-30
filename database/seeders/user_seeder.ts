import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/auth/user'
import Role from '#models/auth/role'

export default class extends BaseSeeder {
  public async run() {
    // 1. Pastikan role dengan id 1 ada
    let role = await Role.find(2)
    if (!role) {
      role = await Role.create({
        id: 2,
        name: 'admin',
      })
    }

    // 2. Buat user dengan role_id == 2
    const user = await User.create({
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isActive: true,
    })

    // 3. Assign role ke user menggunakan relasi many-to-many
    await user.related('roles').attach([role.id])

    console.log(`User ${user.username} (${user.email}) berhasil dibuat dengan role: ${role.name}`)

    // 4. Buat beberapa user tambahan jika diperlukan
    const additionalUsers = [
      {
        username: 'manager',
        fullName: 'Manager User',
        email: 'manager@example.com',
        password: 'password123',
        isActive: true,
      },
      {
        username: 'staff',
        fullName: 'Staff User',
        email: 'staff@example.com',
        password: 'password123',
        isActive: true,
      },
    ]

    for (const userData of additionalUsers) {
      const newUser = await User.create(userData)
      await newUser.related('roles').attach([role.id])
      console.log(`User ${newUser.username} (${newUser.email}) berhasil dibuat dengan role: ${role.name}`)
    }
  }
}
