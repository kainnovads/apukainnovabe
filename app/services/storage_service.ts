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
      return await this.uploadToS3(file, folder, isPublic)
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
    const url = `${env.get('HOST')}/${path}`

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
      return await this.s3Service.deleteFile(path)
    } else {
      // Local file deletion logic
      const fs = await import('fs/promises')
      const fullPath = app.publicPath(path)
      
      try {
        await fs.unlink(fullPath)
        return true
      } catch (error) {
        console.error('❌ Local file delete error:', error)
        return false
      }
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(path: string): string {
    if (this.storageDriver === 's3') {
      return this.s3Service.getPublicUrl(path)
    } else {
      return `${env.get('HOST')}/${path}`
    }
  }
}