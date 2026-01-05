import type { HttpContext } from '@adonisjs/core/http'
import ActivityLogService from '#services/activity_log_service'

/**
 * Helper function untuk logging activity dari HttpContext
 * Menggunakan helper ini di controller untuk logging otomatis
 */
export async function logActivity(
  ctx: HttpContext,
  action: string,
  options?: {
    latitude?: number | null
    longitude?: number | null
    device?: string | null
    description?: string | null
    skipIfNoAuth?: boolean // Skip logging jika user tidak terautentikasi
  }
) {
  try {
    const user = ctx.auth?.user
    if (!user) {
      if (options?.skipIfNoAuth) {
        return null
      }
      // Jika tidak ada user tapi tidak skip, tetap log dengan user_id null (optional)
      return null
    }

    // Deteksi device dari user agent jika tidak disediakan
    const userAgent = ctx.request.header('user-agent') || null
    const device = options?.device || ActivityLogService.getDeviceType(userAgent)

    // Ambil latitude dan longitude dari request jika tidak disediakan di options
    // Bisa dari header (X-Latitude, X-Longitude) atau body/query
    let latitude = options?.latitude ?? null
    let longitude = options?.longitude ?? null

    if (latitude === null || longitude === null) {
      // Coba ambil dari header terlebih dahulu
      const headerLat = ctx.request.header('x-latitude')
      const headerLng = ctx.request.header('x-longitude')
      
      if (headerLat && headerLng) {
        latitude = parseFloat(headerLat) || null
        longitude = parseFloat(headerLng) || null
      } else {
        // Jika tidak ada di header, coba ambil dari body/query
        const bodyLat = ctx.request.input('latitude')
        const bodyLng = ctx.request.input('longitude')
        
        if (bodyLat !== undefined && bodyLng !== undefined) {
          latitude = typeof bodyLat === 'string' ? parseFloat(bodyLat) : bodyLat
          longitude = typeof bodyLng === 'string' ? parseFloat(bodyLng) : bodyLng
          
          // Validasi: pastikan adalah angka yang valid
          if (isNaN(latitude as number) || isNaN(longitude as number)) {
            latitude = null
            longitude = null
          }
        }
      }
    }

    await ActivityLogService.logFromContext(ctx, action, {
      latitude   : latitude,
      longitude  : longitude,
      device     : device,
      description: options?.description ?? null,
    })
  } catch (error) {
    // Jangan throw error, hanya log ke console untuk debugging
    console.error('Error logging activity:', error)
  }
}

/**
 * Helper untuk logging dengan format yang lebih deskriptif
 */
export async function logActivityWithDetails(
  ctx        : HttpContext,
  action     : string,
  entityType : string,
  entityId   : string | number,
  details   ?: {
    latitude      ?: number | null
    longitude     ?: number | null
    device        ?: string | null
    additionalInfo?: string
  }
) {
  const description = `${entityType} ID: ${entityId}${details?.additionalInfo ? ` - ${details.additionalInfo}` : ''}`
  
  return await logActivity(ctx, action, {
    latitude : details?.latitude ?? null,
    longitude: details?.longitude ?? null,
    device   : details?.device ?? null,
    description,
  })
}

/**
 * Helper untuk logging CRUD operations
 */
export const ActivityLogger = {
  /**
   * Log create operation
   */
  async create(ctx: HttpContext, entityType: string, entityId: string | number, entityName?: string) {
    const description = entityName 
      ? `Membuat ${entityType} baru: ${entityName} (ID: ${entityId})`
      : `Membuat ${entityType} baru (ID: ${entityId})`
    
    return await logActivity(ctx, `create_${entityType.toLowerCase()}`, {
      description,
    })
  },

  /**
   * Log update operation
   */
  async update(ctx: HttpContext, entityType: string, entityId: string | number, entityName?: string) {
    const description = entityName 
      ? `Memperbarui ${entityType}: ${entityName} (ID: ${entityId})`
      : `Memperbarui ${entityType} (ID: ${entityId})`
    
    return await logActivity(ctx, `update_${entityType.toLowerCase()}`, {
      description,
    })
  },

  /**
   * Log delete operation
   */
  async delete(ctx: HttpContext, entityType: string, entityId: string | number, entityName?: string) {
    const description = entityName 
      ? `Menghapus ${entityType}: ${entityName} (ID: ${entityId})`
      : `Menghapus ${entityType} (ID: ${entityId})`
    
    return await logActivity(ctx, `delete_${entityType.toLowerCase()}`, {
      description,
    })
  },

  /**
   * Log approve operation
   */
  async approve(ctx: HttpContext, entityType: string, entityId: string | number, entityName?: string) {
    const description = entityName 
      ? `Menyetujui ${entityType}: ${entityName} (ID: ${entityId})`
      : `Menyetujui ${entityType} (ID: ${entityId})`
    
    return await logActivity(ctx, `approve_${entityType.toLowerCase()}`, {
      description,
    })
  },

  /**
   * Log reject operation
   */
  async reject(ctx: HttpContext, entityType: string, entityId: string | number, entityName?: string, reason?: string) {
    const description = reason
      ? `Menolak ${entityType} (ID: ${entityId}): ${reason}`
      : entityName
      ? `Menolak ${entityType}: ${entityName} (ID: ${entityId})`
      : `Menolak ${entityType} (ID: ${entityId})`
    
    return await logActivity(ctx, `reject_${entityType.toLowerCase()}`, {
      description,
    })
  },

  /**
   * Log custom action
   */
  async custom(ctx: HttpContext, action: string, description: string, options?: {
    latitude?: number | null
    longitude?: number | null
    device?: string | null
  }) {
    return await logActivity(ctx, action, {
      description,
      latitude : options?.latitude ?? null,
      longitude: options?.longitude ?? null,
      device   : options?.device ?? null,
    })
  },
}

