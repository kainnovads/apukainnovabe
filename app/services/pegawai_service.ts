// app/Services/PegawaiService.ts
import User from '#models/auth/user'
import Role from '#models/auth/role'
import Pegawai from '#models/pegawai'
import PegawaiHistory from '#models/pegawai_history'
import { DateTime } from 'luxon'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import db from '@adonisjs/lucid/services/db'
import StorageService from '#services/storage_service'

export default class PegawaiService {
  private storageService: StorageService

  // Constructor
  constructor() {
    this.storageService = new StorageService()
  }

  /**
   * Create Pegawai + User + Role + Histori
   */
  public async createPegawaiWithUser(
    pegawaiData: any,
    historyData: any,
    avatar?: MultipartFile,
    email?: string
  ) {
    try {
      return await db.transaction(async (trx) => {
        console.log('[PegawaiService] Starting database transaction.');
        let avatarPath: string | null = null

        // 1. Handle avatar upload
        if (avatar && avatar instanceof MultipartFile) {
          try {
            // Validasi file tidak kosong
            if (!avatar.size || avatar.size === 0) {
              throw new Error('File logo kosong atau tidak valid')
            }

            // Validasi file adalah image
            const fileType = avatar.type || ''
            const fileExtension = avatar.clientName?.split('.').pop()?.toLowerCase() || ''

            const allowedMimeTypes = [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/x-png',
              'image/gif',
              'image/webp',
              'image/svg+xml'
            ]

            const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

            const isValidMimeType = allowedMimeTypes.includes(fileType)
            const isValidExtension = allowedExtensions.includes(fileExtension)

            if (!isValidMimeType && !isValidExtension) {
              throw new Error(`File harus berupa gambar (JPEG, PNG, GIF, WebP). Detected: MIME=${fileType}, Ext=${fileExtension}`)
            }

            // Validasi file size
            const maxSize = 5 * 1024 * 1024 // 5MB
            if (avatar.size > maxSize) {
              throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
            }

            const uploadResult = await this.storageService.uploadFile(
              avatar,
              'pegawai',
              true // public
            )

            avatarPath = uploadResult.url

          } catch (err) {
            console.error('Logo upload failed:', err)
            return {
              message: 'Gagal menyimpan file logo',
              error: err.message,
            }
          }
        }

        // 2. Create user (biarkan plaintext, AuthFinder akan handle hash)
        console.log('[PegawaiService] Creating User...');
        const user = new User()
        user.useTransaction(trx)
        user.fill({
          fullName: pegawaiData.nm_pegawai,
          email: email,
          password: 'password123',
          isActive: true,
        })
        await user.save()
        console.log(`[PegawaiService] User created with ID: ${user.id}`);

        // 3. Assign role guest
        const guestRole = await Role.findBy('name', 'guest')
        if (guestRole) {
          console.log('[PegawaiService] Assigning role to user...');
          await user.related('roles').attach([guestRole.id], trx)
          console.log('[PegawaiService] Role assigned.');
        }

        // 4. Create pegawai
        console.log('[PegawaiService] Creating Pegawai...');
        const pegawai = new Pegawai()
        pegawai.useTransaction(trx)
        pegawai.fill({
          ...pegawaiData,
          user_id: user.id,
          avatar: avatarPath,
          tgl_lahir_pegawai: DateTime.fromJSDate(pegawaiData.tgl_lahir_pegawai),
          tgl_masuk_pegawai: DateTime.fromJSDate(pegawaiData.tgl_masuk_pegawai),
          tgl_keluar_pegawai: pegawaiData.tgl_keluar_pegawai
            ? DateTime.fromJSDate(pegawaiData.tgl_keluar_pegawai)
            : null,
        })
        await pegawai.save()
        console.log(`[PegawaiService] Pegawai created with ID: ${pegawai.id_pegawai}`);

        // 5. Create histori pegawai
        console.log('[PegawaiService] Creating PegawaiHistory...');
        const history = new PegawaiHistory()
        history.useTransaction(trx)
        history.fill({
          ...historyData,
          pegawai_id: pegawai.id_pegawai,
        })
        await history.save()
        console.log(`[PegawaiService] PegawaiHistory created with ID: ${history.id}`);

        console.log('[PegawaiService] Committing transaction...');
        return { user, pegawai }
      })
    } catch (error) {
      console.error('!!! [PegawaiService] DATABASE TRANSACTION FAILED !!!:', error);
      throw error;
    }
  }
}
