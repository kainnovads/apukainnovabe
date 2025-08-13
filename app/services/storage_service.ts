import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import S3Service from '#services/s3_service'

export default class StorageService {
  private s3Service: S3Service
  private storageDriver: string

  constructor() {
    this.storageDriver = env.get('STORAGE_DRIVER', 'local')
    this.s3Service = new S3Service()
  }

  /**
   * Upload file dengan driver yang sesuai
   */
  async uploadFile(
    file: MultipartFile,
    folder: string,
    isPublic: boolean = true
  ): Promise<{ url: string; path: string }> {
    if (this.storageDriver === 's3') {
      try {
        const result = await this.uploadToS3(file, folder, isPublic)
        return result
      } catch (error) {
        console.warn('S3 upload failed, fallback to local:', error.message)
        return await this.uploadToLocal(file, folder)
      }
    } else {
      return await this.uploadToLocal(file, folder)
    }
  }

  /**
   * Upload ke S3
   */
  private async uploadToS3(
    file: MultipartFile,
    folder: string,
    isPublic: boolean
  ): Promise<{ url: string; path: string }> {
    const result = await this.s3Service.uploadMultipartFile(file, folder, isPublic)
    
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

    return {
      url,
      path
    }
  }

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<boolean> {
    if (this.storageDriver === 's3') {
      try {
        return await this.s3Service.deleteFile(path)
      } catch (error) {
        console.warn('S3 delete failed:', error.message)
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
    if (this.storageDriver === 's3') {
      try {
        return this.s3Service.getPublicUrl(path)
      } catch (error) {
        console.warn('S3 URL generation failed, fallback to local:', error.message)
        return `${env.get('HOST')}/${path}`
      }
    } else {
      return `${env.get('HOST')}/${path}`
    }
  }

  /**
   * Test storage service
   */
  async testStorage(): Promise<{ s3: boolean; local: boolean }> {
    const s3Test = await this.s3Service.testConnection()
    
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
      s3: s3Test,
      local: localTest
    }
  }
}