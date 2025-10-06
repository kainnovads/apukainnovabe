import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import GCSService from '#services/gcs_service'

export default class ConfigureGcsCors extends BaseCommand {
  static commandName = 'gcs:configure-cors'
  static description = 'Konfigurasi CORS policy untuk Google Cloud Storage bucket'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  async run() {
    this.logger.info('🚀 Memulai konfigurasi CORS untuk GCS bucket...')

    try {
      const gcsService = new GCSService()
      
      // Test koneksi GCS terlebih dahulu
      this.logger.info('🔍 Testing koneksi GCS...')
      const connectionTest = await gcsService.testConnection()
      
      if (!connectionTest) {
        this.logger.error('❌ GCS service tidak tersedia. Periksa konfigurasi GCP credentials.')
        return
      }
      
      this.logger.info('✅ Koneksi GCS berhasil')

      // Test CORS configuration saat ini
      this.logger.info('🔍 Checking CORS configuration saat ini...')
      const corsTest = await gcsService.testCorsConfiguration()
      this.logger.info(`📋 Status CORS: ${corsTest.message}`)

      // Konfigurasi CORS policy
      this.logger.info('⚙️ Mengkonfigurasi CORS policy...')
      const corsConfigured = await gcsService.configureCorsPolicy()
      
      if (corsConfigured) {
        this.logger.success('✅ CORS policy berhasil dikonfigurasi!')
        
        // Test ulang CORS configuration
        this.logger.info('🔍 Verifikasi CORS configuration...')
        const finalCorsTest = await gcsService.testCorsConfiguration()
        this.logger.info(`📋 Status CORS setelah konfigurasi: ${finalCorsTest.message}`)
        
        this.logger.success('🎉 Konfigurasi CORS selesai! File upload sekarang seharusnya bisa diakses dari frontend.')
      } else {
        this.logger.error('❌ Gagal mengkonfigurasi CORS policy')
      }

    } catch (error) {
      this.logger.error('❌ Error saat mengkonfigurasi CORS:', error.message)
      this.logger.error('💡 Pastikan:')
      this.logger.error('   - GCP credentials sudah benar')
      this.logger.error('   - Bucket name sudah benar')
      this.logger.error('   - Service account memiliki permission untuk mengatur CORS')
    }
  }
}
