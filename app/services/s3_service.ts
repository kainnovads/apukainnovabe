import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import env from '#start/env'

export default class S3Service {
  private s3Client: S3Client | null = null
  private bucketName: string
  private region: string
  private isInitialized: boolean = false

  constructor() {
    this.region = env.get('AWS_REGION', 'us-east-1')
    this.bucketName = env.get('AWS_S3_BUCKET_NAME', '')
    
    // ✅ LAZY INITIALIZATION: Jangan initialize S3 client di constructor
    this.initializeS3Client()
  }

  /**
   * Initialize S3 client dengan error handling
   */
  private initializeS3Client(): void {
    try {
      const accessKeyId = env.get('AWS_ACCESS_KEY_ID', '')
      const secretAccessKey = env.get('AWS_SECRET_ACCESS_KEY', '')

      // ✅ VALIDASI: Pastikan credentials ada
      if (!accessKeyId || !secretAccessKey) {
        console.warn('⚠️ AWS credentials tidak ditemukan, S3 service akan disabled')
        console.log(' Debug - Access Key ID:', accessKeyId ? '***' + accessKeyId.slice(-4) : 'NOT SET')
        console.log(' Debug - Secret Key:', secretAccessKey ? '***' + secretAccessKey.slice(-4) : 'NOT SET')
        return
      }

      if (!this.bucketName) {
        console.warn('⚠️ AWS_S3_BUCKET_NAME tidak ditemukan, S3 service akan disabled')
        console.log('🔍 Debug - Bucket Name:', this.bucketName || 'NOT SET')
        return
      }

      console.log('🔍 Debug - Initializing S3 with:')
      console.log('  - Region:', this.region)
      console.log('  - Bucket:', this.bucketName)
      console.log('  - Access Key:', accessKeyId ? '***' + accessKeyId.slice(-4) : 'NOT SET')

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })

      this.isInitialized = true
      console.log('✅ S3 Service initialized successfully')
    } catch (error) {
      console.error('❌ S3 Service initialization failed:', error)
      this.isInitialized = false
    }
  }

  /**
   * Check apakah S3 service siap
   */
  private isReady(): boolean {
    return this.isInitialized && this.s3Client !== null
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
    if (!this.isReady()) {
      throw new Error('S3 service tidak tersedia. Periksa AWS credentials dan bucket configuration.')
    }

    try {
      console.log('🔍 Debug - Uploading to S3:')
      console.log('  - Bucket:', this.bucketName)
      console.log('  - Key:', key)
      console.log('  - Content Type:', contentType)
      console.log('  - Is Public:', isPublic)

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: isPublic ? 'public-read' : 'private',
      })

      await this.s3Client!.send(command)
      
      // Return public URL jika public, atau signed URL jika private
      if (isPublic) {
        const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
        console.log('✅ S3 Upload successful:', url)
        return url
      } else {
        const signedUrl = await this.getSignedUrl(key)
        console.log('✅ S3 Upload successful (signed):', signedUrl)
        return signedUrl
      }
    } catch (error) {
      console.error('❌ S3 Upload Error:', error)
      console.error('❌ Error Details:', {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      })
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
    if (!this.isReady()) {
      throw new Error('S3 service tidak tersedia. Periksa AWS credentials dan bucket configuration.')
    }

    try {
      const fileName = `${Date.now()}_${multipartFile.clientName}`
      const key = `${folder}/${fileName}`
      
      console.log('🔍 Debug - MultipartFile Upload:')
      console.log('  - File Name:', multipartFile.clientName)
      console.log('  - File Size:', multipartFile.size)
      console.log('  - File Type:', multipartFile.type)
      console.log('  - Folder:', folder)
      console.log('  - Key:', key)
      
      // ✅ VALIDASI: Pastikan file ada dan tidak kosong
      if (!multipartFile.size || multipartFile.size === 0) {
        throw new Error('File kosong atau tidak valid')
      }
      
      // ✅ Baca file content dengan validasi yang lebih robust
      let fileContent: Buffer
      try {
        // ✅ Coba beberapa cara untuk membaca file content
        if (multipartFile.buffer) {
          fileContent = await multipartFile.buffer
        } else if (multipartFile.tmpPath) {
          // Jika menggunakan tmpPath, baca file dari disk
          const fs = await import('fs/promises')
          fileContent = await fs.readFile(multipartFile.tmpPath)
        } else if (multipartFile.stream) {
          // Jika menggunakan stream, convert ke buffer
          const chunks: Buffer[] = []
          for await (const chunk of multipartFile.stream()) {
            chunks.push(chunk)
          }
          fileContent = Buffer.concat(chunks)
        } else {
          throw new Error('Tidak dapat membaca file content')
        }
        
        console.log('  - Buffer Size:', fileContent.length)
        
        // ✅ VALIDASI: Pastikan buffer tidak kosong
        if (!fileContent || fileContent.length === 0) {
          throw new Error('File buffer kosong')
        }
        
        // ✅ VALIDASI: Pastikan buffer size sesuai dengan file size
        if (fileContent.length !== multipartFile.size) {
          console.warn('⚠️ Buffer size tidak sesuai dengan file size:', {
            bufferSize: fileContent.length,
            fileSize: multipartFile.size
          })
        }
        
      } catch (bufferError) {
        console.error('❌ Error reading file buffer:', bufferError)
        console.error('❌ MultipartFile properties:', {
          hasBuffer: !!multipartFile.buffer,
          hasTmpPath: !!multipartFile.tmpPath,
          hasStream: !!multipartFile.stream,
          size: multipartFile.size,
          type: multipartFile.type
        })
        throw new Error(`Gagal membaca file content: ${bufferError.message}`)
      }
      
      // ✅ Fix MIME type jika tidak lengkap
      let contentType = multipartFile.type
      if (!contentType || contentType === 'image') {
        const extension = multipartFile.clientName?.split('.').pop()?.toLowerCase()
        switch (extension) {
          case 'png':
            contentType = 'image/png'
            break
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg'
            break
          case 'gif':
            contentType = 'image/gif'
            break
          case 'webp':
            contentType = 'image/webp'
            break
          default:
            contentType = 'application/octet-stream'
        }
        console.log('  - Fixed Content Type:', contentType)
      }
      
      const url = await this.uploadFile(
        fileContent,
        key,
        contentType,
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
    if (!this.isReady()) {
      throw new Error('S3 service tidak tersedia.')
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      return await getSignedUrl(this.s3Client!, command, { expiresIn })
    } catch (error) {
      console.error('❌ S3 Signed URL Error:', error)
      throw new Error(`Gagal generate signed URL: ${error.message}`)
    }
  }

  /**
   * Delete file dari S3
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('⚠️ S3 service tidak tersedia, skip delete file')
      return false
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.s3Client!.send(command)
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
   * Test S3 connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false
    }

    try {
      // Test dengan list objects (minimal operation)
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
      })

      await this.s3Client!.send(command)
      console.log('✅ S3 Connection test successful')
      return true
    } catch (error) {
      console.error('❌ S3 Connection Test Failed:', error)
      console.error('❌ Error Details:', {
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode
      })
      return false
    }
  }

  /**
   * Get S3 configuration info (untuk debugging)
   */
  getConfigInfo(): { region: string; bucket: string; isInitialized: boolean } {
    return {
      region: this.region,
      bucket: this.bucketName,
      isInitialized: this.isInitialized
    }
  }
}