import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Pegawai from '#models/pegawai'
import PegawaiHistory from '#models/pegawai_history'
import Perusahaan from '#models/perusahaan'
import Cabang from '#models/cabang'
import Jabatan from '#models/jabatan'
import Divisi from '#models/divisi'
import Departemen from '#models/departemen'

export default class extends BaseSeeder {
  public async run() {
    // Ambil data yang sudah ada
    const pegawai = await Pegawai.first()
    const perusahaan = await Perusahaan.first()
    const cabang = await Cabang.first()
    const jabatan = await Jabatan.first()
    const divisi = await Divisi.first()
    const departemen = await Departemen.first()

    if (pegawai && perusahaan && cabang && jabatan && divisi && departemen) {
      await PegawaiHistory.create({
        pegawai_id: pegawai.id_pegawai,
        perusahaan_id: perusahaan.id,
        cabang_id: cabang.id,
        jabatan_id: jabatan.id_jabatan,
        divisi_id: divisi.id,
        departemen_id: departemen.id,
        gaji_pegawai: 5000000,
        tunjangan_pegawai: 1000000,
      })
    }
  }
}
