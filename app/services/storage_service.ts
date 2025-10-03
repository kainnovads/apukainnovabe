import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import GCSService from '#services/gcs_service'

export default class StorageService {
  private gcsService: GCSService
  private storageDriver: string

  constructor() {
    this.storageDriver = env.get('STORAGE_DRIVER', 'local')
    this.gcsService = new GCSService()
  }

  /**
   * Upload file dengan driver yang sesuai
   */
  async uploadFile(
    file: MultipartFile,
    folder: string,
    isPublic: boolean = true
  ): Promise<{ url: string; path: string }> {
    if (this.storageDriver === 'gcs') {
      try {
        console.log(`[StorageService] Attempting GCS upload to folder: ${folder}`)
        const result = await this.uploadToGCS(file, folder, isPublic)
        console.log(`[StorageService] GCS upload successful: ${result.url}`)
        return result
      } catch (error) {
        console.warn(`[StorageService] GCS upload failed, fallback to local: ${error.message}`)
        console.log(`[StorageService] Attempting local upload to folder: ${folder}`)
        return await this.uploadToLocal(file, folder)
      }
    } else {
      console.log(`[StorageService] Using local storage for folder: ${folder}`)
      return await this.uploadToLocal(file, folder)
    }
  }

  /**
   * Upload ke GCS
   */
  private async uploadToGCS(
    file: MultipartFile,
    folder: string,
    isPublic: boolean
  ): Promise<{ url: string; path: string }> {
    const result = await this.gcsService.uploadMultipartFile(file, folder, isPublic)
    
    return {
      url: result.url,
      path: result.key
    }
  }

  /**
   * Upload ke local storage
   */
  private async uploadToLocal(
    file: MultipartFile,
    folder: string
  ): Promise<{ url: string; path: string }> {
    const fileName = `${Date.now()}_${file.clientName}`
    const uploadPath = app.publicPath(`uploads/${folder}`)
    
    // Pastikan direktori upload ada
    try {
      const fs = await import('fs/promises')
      await fs.mkdir(uploadPath, { recursive: true })
      console.log(`[StorageService] Created directory: ${uploadPath}`)
    } catch (error) {
      console.error(`[StorageService] Failed to create directory: ${uploadPath}`, error)
      throw new Error(`Gagal membuat direktori upload: ${error.message}`)
    }
    
    await file.move(uploadPath, {
      name: fileName,
      overwrite: true,
    })

    const path = `uploads/${folder}/${fileName}`
    
    const host = env.get('HOST')
    let url: string
    
    if (host === '0.0.0.0' || host === 'localhost') {
      const apiBase = env.get('APP_URL') || 'https://api.kainnovadigital.com'
      url = `${apiBase}/${path}`
    } else {
      url = `${host}/${path}`
    }

    console.log(`[StorageService] Local upload successful: ${url}`)
    return {
      url,
      path
    }
  }

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<boolean> {
    if (this.storageDriver === 'gcs') {
      try {
        return await this.gcsService.deleteFile(path)
      } catch (error) {
        console.warn('GCS delete failed:', error.message)
        return false
      }
    } else {
      const fs = await import('fs/promises')
      const fullPath = app.publicPath(path)
      
      try {
        await fs.unlink(fullPath)
        return true
      } catch (error) {
        console.error('Local file delete error:', error)
        return false
      }
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(path: string): string {
    if (this.storageDriver === 'gcs') {
      try {
        return this.gcsService.getPublicUrl(path)
      } catch (error) {
        console.warn('GCS URL generation failed, fallback to local:', error.message)
        return `${env.get('HOST')}/${path}`
      }
    } else {
      return `${env.get('HOST')}/${path}`
    }
  }

  /**
   * Test storage service
   */
  async testStorage(): Promise<{ gcs: boolean; local: boolean }> {
    const gcsTest = await this.gcsService.testConnection()
    
    let localTest = false
    try {
      const fs = await import('fs/promises')
      const testPath = app.publicPath('uploads/test')
      await fs.access(testPath).catch(() => fs.mkdir(testPath, { recursive: true }))
      localTest = true
    } catch (error) {
      console.error('Local storage test failed:', error)
    }

    return {
      gcs: gcsTest,
      local: localTest
    }
  }
}