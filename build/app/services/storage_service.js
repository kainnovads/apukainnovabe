import env from '#start/env';
import app from '@adonisjs/core/services/app';
import S3Service from '#services/s3_service';
export default class StorageService {
    s3Service;
    storageDriver;
    constructor() {
        this.storageDriver = env.get('STORAGE_DRIVER', 'local');
        this.s3Service = new S3Service();
    }
    async uploadFile(file, folder, isPublic = true) {
        if (this.storageDriver === 's3') {
            try {
                const result = await this.uploadToS3(file, folder, isPublic);
                return result;
            }
            catch (error) {
                console.warn('S3 upload failed, fallback to local:', error.message);
                return await this.uploadToLocal(file, folder);
            }
        }
        else {
            return await this.uploadToLocal(file, folder);
        }
    }
    async uploadToS3(file, folder, isPublic) {
        const result = await this.s3Service.uploadMultipartFile(file, folder, isPublic);
        return {
            url: result.url,
            path: result.key
        };
    }
    async uploadToLocal(file, folder) {
        const fileName = `${Date.now()}_${file.clientName}`;
        const uploadPath = app.publicPath(`uploads/${folder}`);
        await file.move(uploadPath, {
            name: fileName,
            overwrite: true,
        });
        const path = `uploads/${folder}/${fileName}`;
        const host = env.get('HOST');
        let url;
        if (host === '0.0.0.0' || host === 'localhost') {
            const apiBase = env.get('APP_URL') || 'https://api.kainnovadigital.com';
            url = `${apiBase}/${path}`;
        }
        else {
            url = `${host}/${path}`;
        }
        return {
            url,
            path
        };
    }
    async deleteFile(path) {
        if (this.storageDriver === 's3') {
            try {
                return await this.s3Service.deleteFile(path);
            }
            catch (error) {
                console.warn('S3 delete failed:', error.message);
                return false;
            }
        }
        else {
            const fs = await import('fs/promises');
            const fullPath = app.publicPath(path);
            try {
                await fs.unlink(fullPath);
                return true;
            }
            catch (error) {
                console.error('Local file delete error:', error);
                return false;
            }
        }
    }
    getFileUrl(path) {
        if (this.storageDriver === 's3') {
            try {
                return this.s3Service.getPublicUrl(path);
            }
            catch (error) {
                console.warn('S3 URL generation failed, fallback to local:', error.message);
                return `${env.get('HOST')}/${path}`;
            }
        }
        else {
            return `${env.get('HOST')}/${path}`;
        }
    }
    async testStorage() {
        const s3Test = await this.s3Service.testConnection();
        let localTest = false;
        try {
            const fs = await import('fs/promises');
            const testPath = app.publicPath('uploads/test');
            await fs.access(testPath).catch(() => fs.mkdir(testPath, { recursive: true }));
            localTest = true;
        }
        catch (error) {
            console.error('Local storage test failed:', error);
        }
        return {
            s3: s3Test,
            local: localTest
        };
    }
}
//# sourceMappingURL=storage_service.js.map