import PegawaiHistory from '#models/pegawai_history';
import { DateTime } from 'luxon';
export default class PegawaiHistoriesController {
    async store({ request, response }) {
        const data = request.only([
            'pegawaiId',
            'jabatanId',
            'perusahaanId',
            'cabangId',
            'divisiId',
            'departemenId',
            'gaji_pegawai',
            'tunjangan_pegawai',
        ]);
        await PegawaiHistory.query()
            .where('pegawai_id', data.pegawaiId)
            .update({ updated_at: DateTime.now() });
        const riwayat = await PegawaiHistory.create({
            ...data,
        });
        return response.created(riwayat);
    }
}
//# sourceMappingURL=pegawai_histories_controller.js.map