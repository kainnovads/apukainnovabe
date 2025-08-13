import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import env from '#start/env'

export default class S3Service {
  private s3Client: S3Client
  private bucketName: string
  private region: string

  constructor() {
    this.region = env.get('AWS_REGION', 'us-east-1')
    this.bucketName = env.get('AWS_S3_BUCKET_NAME', '')
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY', ''),
      },
    })
  }

  /**
   * Upload file ke S3
   */
  async uploadFile(
    file: Buffer | string,
    key: string,
    contentType?: string,
    isPublic: boolean = false
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: isPublic ? 'public-read' : 'private',
      })

      await this.s3Client.send(command)
      
      // Return public URL jika public, atau signed URL jika private
      if (isPublic) {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
      } else {
        return await this.getSignedUrl(key)
      }
    } catch (error) {
      console.error('❌ S3 Upload Error:', error)
      throw new Error(`Gagal upload file ke S3: ${error.message}`)
    }
  }

  /**
   * Upload file dari MultipartFile
   */
  async uploadMultipartFile(
    multipartFile: any,
    folder: string,
    isPublic: boolean = true
  ): Promise<{ url: string; key: string }> {
    try {
      const fileName = `${Date.now()}_${multipartFile.clientName}`
      const key = `${folder}/${fileName}`
      
      // Baca file content
      const fileContent = await multipartFile.buffer
      
      const url = await this.uploadFile(
        fileContent,
        key,
        multipartFile.type,
        isPublic
      )

      return {
        url,
        key
      }
    } catch (error) {
      console.error('❌ S3 MultipartFile Upload Error:', error)
      throw new Error(`Gagal upload multipart file ke S3: ${error.message}`)
    }
  }

  /**
   * Generate signed URL untuk private files
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      return await getSignedUrl(this.s3Client, command, { expiresIn })
    } catch (error) {
      console.error('❌ S3 Signed URL Error:', error)
      throw new Error(`Gagal generate signed URL: ${error.message}`)
    }
  }

  /**
   * Delete file dari S3
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.s3Client.send(command)
      return true
    } catch (error) {
      console.error('❌ S3 Delete Error:', error)
      return false
    }
  }

  /**
   * Get public URL untuk file
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
  }

  /**
   * Check apakah file exists di S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.s3Client.send(command)
      return true
    } catch (error) {
      return false
    }
  }
}