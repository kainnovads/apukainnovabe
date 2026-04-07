import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { stat } from 'node:fs/promises'
import { absoluteTmpUploadPath, isPathInsideTmpUploads } from '#helper/upload_paths'

/**
 * Melayani GET /uploads/... dari disk tmp/uploads (sesuai volume Docker).
 */
export default class ServeTmpUploadsMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    if (request.method() !== 'GET') {
      return next()
    }

    const rawUrl = request.url(true)
    const pathname = rawUrl.split('?')[0] ?? rawUrl
    if (!pathname.startsWith('/uploads/')) {
      return next()
    }

    const relative = pathname.slice(1)

    try {
      const absolute = absoluteTmpUploadPath(relative)
      if (!isPathInsideTmpUploads(absolute)) {
        return next()
      }

      const st = await stat(absolute)
      if (!st.isFile()) {
        return next()
      }

      await response.download(absolute)

      return
    } catch {
      return next()
    }
  }
}
