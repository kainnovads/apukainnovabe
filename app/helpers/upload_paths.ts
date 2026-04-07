import app from '@adonisjs/core/services/app'
import { join, normalize, resolve, sep } from 'node:path'

/**
 * Root persisten untuk upload (Docker: bind-mount ke tmp/uploads).
 */
export function tmpUploadsRoot(): string {
  return resolve(app.makePath('tmp', 'uploads'))
}

/**
 * Path absolut untuk nilai yang disimpan di DB, mis. uploads/products/file.png
 */
export function absoluteTmpUploadPath(storedRelativePath: string): string {
  const clean = normalize(storedRelativePath.replace(/^\//, ''))

  return resolve(join(app.makePath('tmp'), clean))
}

export function isPathInsideTmpUploads(absolutePath: string): boolean {
  const root = tmpUploadsRoot()
  const resolved = resolve(absolutePath)

  return resolved === root || resolved.startsWith(root + sep)
}

/**
 * Direktori untuk upload ke subfolder (products, customers, …)
 */
export function tmpUploadSubdir(folder: string): string {
  return app.makePath('tmp', 'uploads', folder)
}
