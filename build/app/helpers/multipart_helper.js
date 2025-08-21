export class MultipartHelper {
    static validateFile(file, options = {}) {
        const { maxSize = 5 * 1024 * 1024, allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/x-png',
            'image/gif', 'image/webp', 'image/svg+xml'
        ], allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] } = options;
        if (!file.size || file.size === 0) {
            return { isValid: false, error: 'File kosong atau tidak valid' };
        }
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: `Ukuran file terlalu besar (maksimal ${Math.round(maxSize / 1024 / 1024)}MB)`
            };
        }
        const fileType = file.type || '';
        const fileExtension = file.clientName?.split('.').pop()?.toLowerCase() || '';
        const isValidMimeType = allowedTypes.includes(fileType);
        const isValidExtension = allowedExtensions.includes(fileExtension);
        if (!isValidMimeType && !isValidExtension) {
            return {
                isValid: false,
                error: `File harus berupa: ${allowedExtensions.join(', ')}. Detected: MIME=${fileType}, Ext=${fileExtension}`
            };
        }
        return { isValid: true };
    }
    static async readFileBuffer(file) {
        try {
            let fileContent;
            if (file.buffer) {
                fileContent = await file.buffer;
            }
            else if (file.tmpPath) {
                const fs = await import('fs/promises');
                fileContent = await fs.readFile(file.tmpPath);
            }
            else if (file.stream) {
                const chunks = [];
                const stream = file.stream();
                const streamTimeout = setTimeout(() => {
                    stream.destroy();
                    throw new Error('Stream timeout - file reading took too long');
                }, 30000);
                try {
                    stream.on('error', (error) => {
                        clearTimeout(streamTimeout);
                        console.error('Stream error:', error);
                        throw new Error(`Stream error: ${error.message}`);
                    });
                    for await (const chunk of stream) {
                        if (chunk && chunk.length > 0) {
                            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        }
                    }
                    clearTimeout(streamTimeout);
                    if (chunks.length === 0) {
                        throw new Error('No data received from stream');
                    }
                    fileContent = Buffer.concat(chunks);
                }
                catch (streamError) {
                    clearTimeout(streamTimeout);
                    console.error('Error reading stream:', streamError);
                    throw new Error(`Failed to read stream: ${streamError.message}`);
                }
            }
            else {
                throw new Error('Tidak dapat membaca file content - tidak ada buffer, tmpPath, atau stream');
            }
            if (!fileContent || fileContent.length === 0) {
                throw new Error('File buffer kosong setelah dibaca');
            }
            const sizeDifference = Math.abs(fileContent.length - file.size);
            const tolerancePercentage = 0.02;
            const maxTolerance = Math.max(file.size * tolerancePercentage, 100);
            if (sizeDifference > maxTolerance) {
                console.warn('⚠️ Buffer size tidak sesuai dengan file size:', {
                    bufferSize: fileContent.length,
                    fileSize: file.size,
                    difference: sizeDifference,
                    toleranceBytes: maxTolerance,
                    fileName: file.clientName
                });
                if (sizeDifference > file.size * 0.1) {
                    throw new Error(`File size mismatch terlalu besar: expected ${file.size}, got ${fileContent.length}`);
                }
            }
            return fileContent;
        }
        catch (error) {
            console.error('Error reading multipart file buffer:', error);
            throw new Error(`Gagal membaca file content: ${error.message}`);
        }
    }
    static detectMimeType(fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }
    static generateSafeFileName(originalName) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop()?.toLowerCase() || '';
        const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
        return `${timestamp}_${randomString}_${baseName}.${extension}`;
    }
}
//# sourceMappingURL=multipart_helper.js.map