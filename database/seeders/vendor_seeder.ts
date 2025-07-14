import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Vendor from '#models/vendor'

export default class VendorSeeder extends BaseSeeder {
  public async run() {
    await Vendor.createMany([
      {
        name: 'PT Sukses Sari',
        email: 'info@suksessari.co.id',
        phone: '081234567890',
        address: 'Jl. Merdeka No. 123, Jakarta',
        npwp: '01.234.567.8-999.000',
        logo: 'suksessari.png',
      },
      {
        name: 'CV Maju Terus',
        email: 'contact@maju.com',
        phone: '081234567890',
        address: 'Jl. Sudirman No. 45, Bandung',
        npwp: '02.345.678.9-888.000',
        logo: 'maju.png',
      },
      {
        name: 'PT Sentosa Abadi',
        email: 'admin@sentosa.co.id',
        phone: '081234567890',
        address: 'Jl. Diponegoro No. 67, Surabaya',
        npwp: '03.456.789.0-777.000',
        logo: 'sentosa.png',
      },
      {
        name: 'PT Maju Mundur Cantik',
        email: 'mundur@cantik.co.id',
        phone: '081234567890',
        address: 'Jl. Gajahmada No. 89, Semarang',
        npwp: '04.567.890.1-666.000',
        logo: 'mundur.png',
      },
      {
        name: 'PT Amanah Sejahtera',
        email: 'cs@amanah.co.id',
        phone: '081234567890',
        address: 'Jl. Pajajaran No. 101, Bogor',
        npwp: '05.678.901.2-555.000',
        logo: 'amanah.png',
      },
    ])
  }
}