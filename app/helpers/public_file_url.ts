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

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed)
      const isLocalDevHost =
        u.hostname === '127.0.0.1' || u.hostname === 'localhost' || u.hostname === '0.0.0.0'
      const path = u.pathname.replace(/^\//, '')
      if (isLocalDevHost && path.startsWith('uploads/')) {
        return `${base}/${path}`
      }
    } catch {
      /* biarkan URL apa adanya */
    }

    return trimmed
  }

  return `${base}/${trimmed.replace(/^\//, '')}`
}
