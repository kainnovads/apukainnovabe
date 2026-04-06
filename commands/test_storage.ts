import { BaseCommand } from '@adonisjs/core/ace'
import StorageService from '#services/storage_service'

export default class TestStorage extends BaseCommand {
  static commandName = 'test:storage'
  static description = 'Tes penyimpanan file lokal (public/uploads)'

  async run() {
    console.log('🧪 StorageService (local)...\n')

    const storageService = new StorageService()
    const result = await storageService.testStorage()

    console.log('Driver:', result.driver)
    console.log('Local OK:', result.local ? '✅' : '❌')
    console.log('Message:', result.message)

    if (result.local) {
      console.log('\n🎉 Selesai.')
    } else {
      console.log('\n❌ Periksa permission folder public/uploads.')
      this.exitCode = 1
    }
  }
}
