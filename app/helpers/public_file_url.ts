import env from '#start/env'

/**
 * Basis URL publik untuk file di /uploads/...
 * Urutan: ASSET_URL (khusus file statis) → APP_URL → fallback dev.
 */
export function publicFilesBaseUrl(): string {
  const assetUrl = env.get('ASSET_URL', '')
  if (assetUrl) {
    return assetUrl.replace(/\/$/, '')
  }

  const appUrl = env.get('APP_URL', '')
  if (appUrl) {
    return appUrl.replace(/\/$/, '')
  }

  const port = env.get('PORT')
  const host = env.get('HOST')
  if (host === '0.0.0.0') {
    return `http://127.0.0.1:${port}`
  }

  return `http://${host}:${port}`
}

const UPLOAD_FOLDER_PATTERN =
  /^(products|customers|vendors|perusahaan|pegawai|sales|purchases|attachments|users)\//

/**
 * Normalisasi nilai di DB ke path relatif uploads/... (tanpa leading slash).
 */
export function normalizeStoredUploadPath(stored: string): string {
  let path = stored.trim().replace(/^\//, '')

  if (path.startsWith('api/uploads/')) {
    path = path.slice('api/'.length)
  }

  if (path.startsWith('uploads/')) {
    return path
  }

  if (UPLOAD_FOLDER_PATTERN.test(path)) {
    return `uploads/${path}`
  }

  return path
}

/**
 * Ekstrak path uploads/... dari URL absolut (localhost, /api/uploads/, dll.).
 */
function uploadPathFromAbsoluteUrl(url: URL): string | null {
  let path = url.pathname.replace(/^\//, '')

  if (path.startsWith('api/uploads/')) {
    path = path.slice('api/'.length)
  }

  if (path.startsWith('uploads/')) {
    return path
  }

  return null
}

function isLocalDevHost(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '0.0.0.0'
}

/**
 * Encode setiap segmen path agar spasi/karakter khusus aman di browser (<img src>).
 */
export function encodePublicUploadUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const parsed = new URL(trimmed)
    parsed.pathname = parsed.pathname
      .split('/')
      .map((segment) => {
        if (!segment) {
          return segment
        }
        try {
          return encodeURIComponent(decodeURIComponent(segment))
        } catch {
          return encodeURIComponent(segment)
        }
      })
      .join('/')

    return parsed.toString()
  } catch {
    return trimmed
      .split('/')
      .map((segment) => {
        if (!segment) {
          return segment
        }
        try {
          return encodeURIComponent(decodeURIComponent(segment))
        } catch {
          return encodeURIComponent(segment)
        }
      })
      .join('/')
  }
}

/**
 * Nilai di DB: path relatif (uploads/...) atau URL absolut lama.
 * Perbaiki URL localhost/127.0.0.1 agar pakai basis publik saat ini.
 */
export function resolveStoredUploadUrl(stored: string | null | undefined): string {
  if (!stored || typeof stored !== 'string') {
    return ''
  }

  const trimmed = stored.trim()
  if (!trimmed) {
    return ''
  }

  const base = publicFilesBaseUrl()
  let resolved = trimmed

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed)
      const uploadPath = uploadPathFromAbsoluteUrl(u)

      if (uploadPath && isLocalDevHost(u.hostname)) {
        resolved = `${base}/${uploadPath}`
      }
    } catch {
      /* biarkan URL apa adanya */
    }
  } else {
    const normalized = normalizeStoredUploadPath(trimmed)
    resolved = `${base}/${normalized}`
  }

  return encodePublicUploadUrl(resolved)
}
