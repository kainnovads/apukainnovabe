import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Cari user yang tidak memiliki username
    const usersWithoutUsername = await db.query().from('users').whereNull('username')
    
    console.log(`Found ${usersWithoutUsername.length} users without username`)
    
    for (const user of usersWithoutUsername) {
      // Generate username dari email atau fullName
      let username = ''
      
      if (user.full_name) {
        // Ambil nama depan dari fullName
        const firstName = user.full_name.trim().split(' ')[0]
        username = firstName.toLowerCase()
          .replace(/[^a-z0-9]/g, '') // Hapus karakter khusus
          .replace(/\s+/g, '') // Hapus spasi
      } else if (user.email) {
        // Ambil bagian sebelum @ dari email
        username = user.email.split('@')[0].toLowerCase()
          .replace(/[^a-z0-9]/g, '') // Hapus karakter khusus
      }
      
      // Jika username kosong, gunakan 'user'
      if (!username) {
        username = 'user'
      }
      
      // Cek apakah username sudah ada
      let finalUsername = username
      let counter = 1
      
      while (true) {
        const existingUser = await db.query().from('users').where('username', finalUsername).first()
        if (!existingUser || existingUser.id === user.id) {
          break
        }
        finalUsername = `${username}${counter}`
        counter++
      }
      
      // Update user dengan username
      await db.query().from('users').where('id', user.id).update({ username: finalUsername })
      
      console.log(`Updated user ${user.email} with username: ${finalUsername}`)
    }
  }

  async down() {
    // Tidak ada rollback yang diperlukan
  }
}