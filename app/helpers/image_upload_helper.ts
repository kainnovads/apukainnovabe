import type { MultipartFile } from '@adonisjs/core/bodyparser'

export const PRODUCT_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/jfif',
  'image/png',
  'image/x-png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

export const PRODUCT_IMAGE_ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'jfif',
  'png',
  'gif',
  'webp',
  'svg',
] as const

export const PRODUCT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024

export function getFileExtension(fileName?: string | null): string {
  return fileName?.split('.').pop()?.toLowerCase() || ''
}

export function isAllowedProductImage(
  mimeType?: string | null,
  fileName?: string | null,
): boolean {
  const extension = getFileExtension(fileName)
  const mime = (mimeType || '').toLowerCase()

  const isValidMimeType = PRODUCT_IMAGE_ALLOWED_MIME_TYPES.includes(
    mime as (typeof PRODUCT_IMAGE_ALLOWED_MIME_TYPES)[number],
  )
  const isValidExtension = PRODUCT_IMAGE_ALLOWED_EXTENSIONS.includes(
    extension as (typeof PRODUCT_IMAGE_ALLOWED_EXTENSIONS)[number],
  )

  return isValidMimeType || isValidExtension
}

export function validateProductImageFile(
  file: MultipartFile,
  maxSizeBytes: number = PRODUCT_IMAGE_MAX_SIZE_BYTES,
): void {
  if (!file.size || file.size === 0) {
    throw new Error('File gambar kosong atau tidak valid')
  }

  if (!isAllowedProductImage(file.type, file.clientName)) {
    const extension = getFileExtension(file.clientName)
    throw new Error(
      `File harus berupa gambar (JPEG, JPG, PNG, GIF, WebP). Detected: MIME=${file.type || '-'}, Ext=${extension || '-'}`,
    )
  }

  if (file.size > maxSizeBytes) {
    throw new Error('Ukuran file terlalu besar (maksimal 5MB)')
  }
}
