import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '#start/env';
import { MultipartHelper } from '../helpers/multipart_helper.js';
export default class S3Service {
    s3Client = null;
    bucketName;
    region;
    isInitialized = false;
    constructor() {
        this.region = env.get('AWS_REGION', 'us-east-1');
        this.bucketName = env.get('AWS_S3_BUCKET_NAME', '');
        this.initializeS3Client();
    }
    initializeS3Client() {
        try {
            const accessKeyId = env.get('AWS_ACCESS_KEY_ID', '');
            const secretAccessKey = env.get('AWS_SECRET_ACCESS_KEY', '');
            if (!accessKeyId || !secretAccessKey) {
                console.warn('AWS credentials tidak ditemukan, S3 service akan disabled');
                return;
            }
            if (!this.bucketName) {
                console.warn('AWS_S3_BUCKET_NAME tidak ditemukan, S3 service akan disabled');
                return;
            }
            this.s3Client = new S3Client({
                region: this.region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
            this.isInitialized = true;
        }
        catch (error) {
            console.error('S3 Service initialization failed:', error);
            this.isInitialized = false;
        }
    }
    isReady() {
        return this.isInitialized && this.s3Client !== null;
    }
    async uploadFile(file, key, contentType, isPublic = false) {
        if (!this.isReady()) {
            throw new Error('S3 service tidak tersedia. Periksa AWS credentials dan bucket configuration.');
        }
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: file,
                ContentType: contentType,
                ACL: isPublic ? 'public-read' : 'private',
                CacheControl: 'max-age=31536000',
            });
            await this.s3Client.send(command);
            if (isPublic) {
                const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
                return url;
            }
            else {
                const signedUrl = await this.getSignedUrl(key);
                return signedUrl;
            }
        }
        catch (error) {
            console.error('S3 Upload Error:', error);
            throw new Error(`Gagal upload file ke S3: ${error.message}`);
        }
    }
    async uploadMultipartFile(multipartFile, folder, isPublic = true) {
        if (!this.isReady()) {
            throw new Error('S3 service tidak tersedia. Periksa AWS credentials dan bucket configuration.');
        }
        try {
            const fileName = MultipartHelper.generateSafeFileName(multipartFile.clientName || 'unknown');
            const key = `${folder}/${fileName}`;
            const validation = MultipartHelper.validateFile(multipartFile);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            const fileContent = await MultipartHelper.readFileBuffer(multipartFile);
            let contentType = multipartFile.type;
            if (!contentType || contentType === 'image') {
                contentType = MultipartHelper.detectMimeType(multipartFile.clientName || '');
            }
            const url = await this.uploadFile(fileContent, key, contentType, isPublic);
            return {
                url,
                key
            };
        }
        catch (error) {
            console.error('S3 MultipartFile Upload Error:', error);
            throw new Error(`Gagal upload multipart file ke S3: ${error.message}`);
        }
    }
    async getSignedUrl(key, expiresIn = 3600) {
        if (!this.isReady()) {
            throw new Error('S3 service tidak tersedia.');
        }
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            return await getSignedUrl(this.s3Client, command, { expiresIn });
        }
        catch (error) {
            console.error('S3 Signed URL Error:', error);
            throw new Error(`Gagal generate signed URL: ${error.message}`);
        }
    }
    async deleteFile(key) {
        if (!this.isReady()) {
            console.warn('S3 service tidak tersedia, skip delete file');
            return false;
        }
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3Client.send(command);
            return true;
        }
        catch (error) {
            console.error('S3 Delete Error:', error);
            return false;
        }
    }
    getPublicUrl(key) {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
    async testConnection() {
        if (!this.isReady()) {
            return false;
        }
        try {
            const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                MaxKeys: 1,
            });
            await this.s3Client.send(command);
            return true;
        }
        catch (error) {
            console.error('S3 Connection Test Failed:', error);
            return false;
        }
    }
    getConfigInfo() {
        return {
            region: this.region,
            bucket: this.bucketName,
            isInitialized: this.isInitialized
        };
    }
}
//# sourceMappingURL=s3_service.js.map