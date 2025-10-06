import type { HttpContext } from '@adonisjs/core/http'
import StorageService from '#services/storage_service'

export default class StorageController {
  private storageService: StorageService

  constructor() {
    this.storageService = new StorageService()
  }

  /**
   * Test storage service dan CORS configuration
   */
  async testStorage({ response }: HttpContext) {
    try {
      const testResult = await this.storageService.testStorage()
      
      return response.ok({
        message: 'Storage test completed',
        data: testResult,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Storage test failed',
        error: error.message
      })
    }
  }

  /**
   * Konfigurasi CORS untuk GCS
   */
  async configureCors({ response }: HttpContext) {
    try {
      const corsResult = await this.storageService.configureCors()
      
      if (corsResult.success) {
        return response.ok({
          message: corsResult.message,
          success: true,
          timestamp: new Date().toISOString()
        })
      } else {
        return response.badRequest({
          message: corsResult.message,
          success: false,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      return response.internalServerError({
        message: 'CORS configuration failed',
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Test upload file untuk memverifikasi CORS
   */
  async testUpload({ request, response }: HttpContext) {
    try {
      const testFile = request.file('testFile')
      
      if (!testFile) {
        return response.badRequest({
          message: 'Test file is required',
          success: false
        })
      }

      // Upload test file
      const uploadResult = await this.storageService.uploadFile(
        testFile,
        'test-cors',
        true // public
      )

      return response.ok({
        message: 'Test upload successful',
        data: {
          url: uploadResult.url,
          path: uploadResult.path,
          corsTestUrl: uploadResult.url
        },
        success: true,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Test upload failed',
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      })
    }
  }
}
