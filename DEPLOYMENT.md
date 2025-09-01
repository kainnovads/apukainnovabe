# Deployment Guide - APU ADN

## Masalah Upload Gambar di Production

### Deskripsi Masalah
Error yang sering terjadi:
```json
{
    "message": "Gagal menyimpan file logo",
    "error": "ENOENT: no such file or directory, mkdir '/workspace/build/public'"
}
```

### Penyebab
1. **Konfigurasi S3 tidak lengkap** - Environment variables tidak sesuai
2. **Direktori uploads tidak ada** - Fallback ke local storage gagal
3. **Path yang salah** - Google Cloud App Engine menggunakan path `/workspace/build/`

### Solusi

#### 1. Konfigurasi Environment Variables
Pastikan `app.yaml` memiliki konfigurasi S3 yang benar:
```yaml
env_variables:
  # S3 Configuration
  AWS_ACCESS_KEY_ID: YOUR_ACCESS_KEY
  AWS_SECRET_ACCESS_KEY: YOUR_SECRET_KEY
  AWS_REGION: us-east1
  AWS_S3_BUCKET_NAME: your-bucket-name
  AWS_S3_ENDPOINT: https://storage.googleapis.com
  STORAGE_DRIVER: s3
```

#### 2. Setup Direktori Uploads
Jalankan script setup production:
```bash
npm run setup-production
```

Atau manual:
```bash
mkdir -p public/uploads/{perusahaan,customers,vendors,products,pegawai,sales_orders}
chmod -R 755 public/uploads
```

#### 3. Deployment
```bash
# Build dan setup production
npm run deploy

# Deploy ke Google Cloud
gcloud app deploy
```

#### 4. Verifikasi
Setelah deployment, pastikan:
- Direktori `public/uploads` ada di production
- S3 service berfungsi dengan baik
- Fallback ke local storage berfungsi jika S3 gagal

### Troubleshooting

#### S3 Upload Gagal
1. Periksa credentials S3
2. Periksa bucket permissions
3. Periksa network connectivity

#### Local Storage Fallback Gagal
1. Pastikan direktori `public/uploads` ada
2. Periksa file permissions
3. Periksa disk space

#### Gambar Tidak Muncul
1. Periksa URL yang di-generate
2. Periksa CORS settings
3. Periksa file permissions di storage

### Monitoring
Gunakan logging untuk monitor upload:
```typescript
console.log(`[StorageService] Upload attempt to: ${folder}`)
console.log(`[StorageService] Upload result: ${result.url}`)
```

### Best Practices
1. **Selalu gunakan S3** untuk production
2. **Siapkan fallback** ke local storage
3. **Monitor error logs** secara berkala
4. **Test upload** setelah setiap deployment
5. **Backup data** secara regular
