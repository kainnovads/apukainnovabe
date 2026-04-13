import app from '@adonisjs/core/services/app'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import { absoluteTmpUploadPath, tmpUploadSubdir } from '#helper/upload_paths'
import { publicFilesBaseUrl } from '#helper/public_file_url'

export default class StorageService {
  private buildPublicUrl(relativePath: string): string {
    const base = publicFilesBaseUrl()
    const path = relativePath.replace(/^\//, '')

    return `${base}/${path}`
  }

  /**
   * Upload file ke tmp/uploads/... (bind-mount Docker: ./storage/apukainnova-uploads → tmp/uploads)
   */
  async uploadFile(
    file: MultipartFile,
    folder: string,
    _isPublic: boolean = true
  ): Promise<{ url: string; path: string }> {
    const fileName = `${Date.now()}_${file.clientName}`
    const uploadPath = tmpUploadSubdir(folder)

    try {
      const fs = await import('node:fs/promises')
      await fs.mkdir(uploadPath, { recursive: true })
    } catch (error: any) {
      console.error(`[StorageService] Failed to create directory: ${uploadPath}`, error)
      throw new Error(`Gagal membuat direktori upload: ${error.message}`)
    }

    await file.move(uploadPath, {
      name: fileName,
      overwrite: true,
    })

    const path = `uploads/${folder}/${fileName}`

    return {
      url: this.buildPublicUrl(path),
      path,
    }
  }

  /**
   * Hapus file; path DB biasanya uploads/subfolder/file
   */
  async deleteFile(path: string): Promise<boolean> {
    const fs = await import('node:fs/promises')
    const fullPath = absoluteTmpUploadPath(path)

    try {
      await fs.unlink(fullPath)

      return true
    } catch (error) {
      console.error('Local file delete error:', error)

      return false
    }
  }

  getFileUrl(path: string): string {
    return this.buildPublicUrl(path)
  }

  async testStorage(): Promise<{ local: boolean; driver: string; message: string }> {
    let localTest = false
    try {
      const fs = await import('node:fs/promises')
      const testPath = app.makePath('tmp', 'uploads', 'test')
      await fs.access(testPath).catch(() => fs.mkdir(testPath, { recursive: true }))
      localTest = true
    } catch (error) {
      console.error('Local storage test failed:', error)
    }

    return {
      local: localTest,
      driver: 'local',
      message: localTest ? 'Penyimpanan siap (tmp/uploads, URL /uploads/...)' : 'Gagal mengakses tmp/uploads',
    }
  }

  async configureCors(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message:
        'File dilayani dari aplikasi; CORS di @adonisjs/cors atau Nginx. Volume: tmp/uploads → host storage.',
    }
  }
}
