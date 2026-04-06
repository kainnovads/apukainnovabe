import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { MultipartFile } from '@adonisjs/core/bodyparser'

export default class StorageService {
  /**
   * Basis URL untuk file di `public/uploads` (sama dengan pendekatan bind-mount Docker).
   */
  private publicFileBaseUrl(): string {
    const explicit = env.get('APP_URL', '')
    if (explicit) {
      return explicit.replace(/\/$/, '')
    }

    const port = env.get('PORT')
    const host = env.get('HOST')
    if (host === '0.0.0.0') {
      return `http://127.0.0.1:${port}`
    }

    return `http://${host}:${port}`
  }

  private buildPublicUrl(relativePath: string): string {
    const base = this.publicFileBaseUrl()
    const path = relativePath.replace(/^\//, '')

    return `${base}/${path}`
  }

  /**
   * Upload file ke direktori public (public/uploads/...)
   */
  async uploadFile(
    file: MultipartFile,
    folder: string,
    _isPublic: boolean = true
  ): Promise<{ url: string; path: string }> {
    const fileName = `${Date.now()}_${file.clientName}`
    const uploadPath = app.publicPath(`uploads/${folder}`)

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
   * Hapus file dari public path relatif (mis. uploads/foo/bar.jpg)
   */
  async deleteFile(path: string): Promise<boolean> {
    const fs = await import('node:fs/promises')
    const fullPath = app.publicPath(path)

    try {
      await fs.unlink(fullPath)

      return true
    } catch (error) {
      console.error('Local file delete error:', error)

      return false
    }
  }

  /**
   * URL publik untuk path relatif di bawah public/
   */
  getFileUrl(path: string): string {
    return this.buildPublicUrl(path)
  }

  /**
   * Tes akses direktori upload lokal
   */
  async testStorage(): Promise<{ local: boolean; driver: string; message: string }> {
    let localTest = false
    try {
      const fs = await import('node:fs/promises')
      const testPath = app.publicPath('uploads/test')
      await fs.access(testPath).catch(() => fs.mkdir(testPath, { recursive: true }))
      localTest = true
    } catch (error) {
      console.error('Local storage test failed:', error)
    }

    return {
      local: localTest,
      driver: 'local',
      message: localTest ? 'Penyimpanan lokal siap (public/uploads)' : 'Gagal mengakses public/uploads',
    }
  }

  /**
   * File disajikan dari disk aplikasi; CORS diatur di Adonis / reverse proxy, bukan di object storage.
   */
  async configureCors(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message:
        'Penyimpanan lokal tidak memerlukan CORS bucket. Atur CORS di @adonisjs/cors atau Nginx bila perlu.',
    }
  }
}
