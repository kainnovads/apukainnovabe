import { Storage } from '@google-cloud/storage'
import env from '#start/env'
import { MultipartHelper } from '../helpers/multipart_helper.js'

export default class GCSService {
  private storage: Storage | null = null
  private bucketName: string
  private projectId: string
  private isInitialized: boolean = false

  constructor() {
    this.projectId = env.get('GCP_PROJECT_ID', '')
    this.bucketName = env.get('GCP_BUCKET_NAME', '')
    
    // ✅ PERBAIKAN: Jika bucket name kosong, gunakan bucket dari app.yaml untuk production
    if (!this.bucketName) {
      this.bucketName = 'skilful-grove-470706-h5.appspot.com'
      console.log('Using default bucket name for production:', this.bucketName)
    }

    this.initializeGCSClient()
  }

  /**
   * Initialize GCS client dengan error handling
   */
  private initializeGCSClient(): void {
    try {
      const clientEmail = env.get('GCP_CLIENT_EMAIL', '')
      const privateKey = env.get('GCP_KEY_FILE', '')

      if (!clientEmail || !privateKey) {
        console.warn('GCP credentials tidak ditemukan, GCS service akan disabled')
        return
      }

      if (!this.bucketName) {
        console.warn('GCP_BUCKET_NAME tidak ditemukan, GCS service akan disabled')
        return
      }

      if (!this.projectId) {
        console.warn('GCP_PROJECT_ID tidak ditemukan, GCS service akan disabled')
        return
      }

      // Konfigurasi untuk Google Cloud Storage
      const credentials = {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      }

      this.storage = new Storage({
        projectId: this.projectId,
        credentials: credentials,
      })

      this.isInitialized = true
      console.log('GCS Service initialized successfully for bucket:', this.bucketName)
    } catch (error) {
      console.error('GCS Service initialization failed:', error)
      this.isInitialized = false
    }
  }

  /**
   * Check apakah GCS service siap
   */
  private isReady(): boolean {
    return this.isInitialized && this.storage !== null
  }

  /**
   * Normalize key untuk memastikan semua path dimulai dengan "apu/"
   */
  private normalizeKey(key: string): string {
    // Hapus leading slash jika ada
    const cleanKey = key.startsWith('/') ? key.substring(1) : key
    
    // Jika sudah dimulai dengan "apu/", return as is
    if (cleanKey.startsWith('apu/')) {
      return cleanKey
    }
    
    // Jika tidak dimulai dengan "apu/", tambahkan prefix
    return `apu/${cleanKey}`
  }

  /**
   * Upload file ke GCS
   */
  async uploadFile(
    file: Buffer | string,
    key: string,
    contentType?: string,
    isPublic: boolean = false
  ): Promise<string> {
    if (!this.isReady()) {
      throw new Error('GCS service tidak tersedia. Periksa GCP credentials dan bucket configuration.')
    }

    // Pastikan semua path dimulai dengan "apu/"
    const normalizedKey = this.normalizeKey(key)

    try {
      const bucket = this.storage!.bucket(this.bucketName)
      const fileObj = bucket.file(normalizedKey)

      const uploadOptions: any = {
        metadata: {
          contentType: contentType || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000',
        }
      }

      // ✅ PERBAIKAN: Untuk uniform bucket-level access, tidak perlu set ACL
      // File akan otomatis public jika bucket sudah dikonfigurasi dengan uniform access
      await fileObj.save(file, uploadOptions)

      // ✅ PERBAIKAN: Untuk uniform bucket-level access, tidak perlu makePublic()
      // karena file sudah otomatis public berdasarkan bucket policy

      // Return public URL jika public, atau signed URL jika private
      if (isPublic) {
        const url = this.getPublicUrl(normalizedKey)
        return url
      } else {
        const signedUrl = await this.getSignedUrl(normalizedKey)
        return signedUrl
      }
    } catch (error) {
      console.error('GCS Upload Error:', error)
      throw new Error(`Gagal upload file ke GCS: ${error.message}`)
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
      throw new Error('GCS service tidak tersedia. Periksa GCP credentials dan bucket configuration.')
    }

    try {
      // ✅ PERBAIKAN: Gunakan helper untuk generate nama file yang aman
      const fileName = MultipartHelper.generateSafeFileName(multipartFile.clientName || 'unknown')
      const key = `${folder}/${fileName}`
      
      // Pastikan semua path dimulai dengan "apu/"
      const normalizedKey = this.normalizeKey(key)

      // ✅ PERBAIKAN: Validasi file menggunakan helper
      const validation = MultipartHelper.validateFile(multipartFile)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // ✅ PERBAIKAN: Baca file content menggunakan helper yang lebih robust
      const fileContent = await MultipartHelper.readFileBuffer(multipartFile)

      // ✅ PERBAIKAN: Fix MIME type menggunakan helper
      let contentType = multipartFile.type
      if (!contentType || contentType === 'image') {
        contentType = MultipartHelper.detectMimeType(multipartFile.clientName || '')
      }

      const url = await this.uploadFile(
        fileContent,
        normalizedKey,
        contentType,
        isPublic
      )

      return {
        url,
        key: normalizedKey
      }
    } catch (error) {
      console.error('GCS MultipartFile Upload Error:', error)
      throw new Error(`Gagal upload multipart file ke GCS: ${error.message}`)
    }
  }

  /**
   * Generate signed URL untuk private files
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isReady()) {
      throw new Error('GCS service tidak tersedia.')
    }

    // Pastikan semua path dimulai dengan "apu/"
    const normalizedKey = this.normalizeKey(key)

    try {
      const bucket = this.storage!.bucket(this.bucketName)
      const file = bucket.file(normalizedKey)

      const options = {
        version: 'v4' as const,
        action: 'read' as const,
        expires: Date.now() + expiresIn * 1000,
      }

      const [signedUrl] = await file.getSignedUrl(options)
      return signedUrl
    } catch (error) {
      console.error('GCS Signed URL Error:', error)
      throw new Error(`Gagal generate signed URL: ${error.message}`)
    }
  }

  /**
   * Delete file dari GCS
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('GCS service tidak tersedia, skip delete file')
      return false
    }

    // Pastikan semua path dimulai dengan "apu/"
    const normalizedKey = this.normalizeKey(key)

    try {
      const bucket = this.storage!.bucket(this.bucketName)
      const file = bucket.file(normalizedKey)

      await file.delete()
      return true
    } catch (error) {
      console.error('GCS Delete Error:', error)
      return false
    }
  }

  /**
   * Get public URL untuk file
   */
  getPublicUrl(key: string): string {
    // Pastikan semua path dimulai dengan "apu/"
    const normalizedKey = this.normalizeKey(key)
    return `https://storage.googleapis.com/${this.bucketName}/${normalizedKey}`
  }

  /**
   * Test GCS connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false
    }

    try {
      const bucket = this.storage!.bucket(this.bucketName)
      const [exists] = await bucket.exists()
      return exists
    } catch (error) {
      console.error('GCS Connection Test Failed:', error)
      return false
    }
  }

  /**
   * Get GCS configuration info
   */
  getConfigInfo(): { projectId: string; bucket: string; isInitialized: boolean } {
    return {
      projectId: this.projectId,
      bucket: this.bucketName,
      isInitialized: this.isInitialized
    }
  }

  /**
   * List files in bucket (optional utility method)
   */
  async listFiles(prefix?: string, maxResults?: number): Promise<string[]> {
    if (!this.isReady()) {
      throw new Error('GCS service tidak tersedia.')
    }

    try {
      const bucket = this.storage!.bucket(this.bucketName)
      const options: any = {}
      
      // Default prefix adalah "apu/" jika tidak ada prefix yang diberikan
      const searchPrefix = prefix ? this.normalizeKey(prefix) : 'apu/'
      options.prefix = searchPrefix
      
      if (maxResults) {
        options.maxResults = maxResults
      }

      const [files] = await bucket.getFiles(options)
      return files.map((file: { name: string }) => file.name)
    } catch (error) {
      console.error('GCS List Files Error:', error)
      throw new Error(`Gagal list files: ${error.message}`)
    }
  }

  /**
   * ✅ PERBAIKAN CORS: Konfigurasi CORS policy untuk bucket
   */
  async configureCorsPolicy(): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('GCS service tidak tersedia.')
    }

    try {
      const bucket = this.storage!.bucket(this.bucketName)
      
      // CORS configuration untuk mengizinkan akses dari frontend
      const corsConfig = [
        {
          origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://kainnovadigital.com',
            'https://*.kainnovadigital.com',
            'https://backendapu.kainnovadigital.com',
            'https://apu.kainnovadigital.com',
            'https://erp.kainnovadigital.com',
            'https://nuxt-erp.vercel.app',
            'https://nuxt-erp-git-main-kainnovadigital.vercel.app'
          ],
          method: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          responseHeader: [
            'Content-Type',
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers',
            'Access-Control-Max-Age',
            'Cache-Control',
            'ETag',
            'Last-Modified'
          ],
          maxAgeSeconds: 3600
        }
      ]

      await bucket.setCorsConfiguration(corsConfig)
      console.log('✅ CORS policy berhasil dikonfigurasi untuk bucket:', this.bucketName)
      return true
    } catch (error) {
      console.error('❌ Gagal mengkonfigurasi CORS policy:', error)
      throw new Error(`Gagal mengkonfigurasi CORS policy: ${error.message}`)
    }
  }

  /**
   * ✅ PERBAIKAN CORS: Test CORS configuration
   */
  async testCorsConfiguration(): Promise<{ success: boolean; message: string }> {
    if (!this.isReady()) {
      return { success: false, message: 'GCS service tidak tersedia' }
    }

    try {
      const bucket = this.storage!.bucket(this.bucketName)
      
      // ✅ PERBAIKAN: Gunakan method yang benar untuk mendapatkan CORS configuration
      const [corsConfig] = await bucket.getMetadata()
      
      if (corsConfig && corsConfig.cors && corsConfig.cors.length > 0) {
        return { 
          success: true, 
          message: `CORS policy sudah dikonfigurasi dengan ${corsConfig.cors.length} rules` 
        }
      } else {
        return { 
          success: false, 
          message: 'CORS policy belum dikonfigurasi' 
        }
      }
    } catch (error) {
      console.error('Error testing CORS configuration:', error)
      return { 
        success: false, 
        message: `Error testing CORS: ${error.message}` 
      }
    }
  }
}
