import { BaseCommand } from '@adonisjs/core/ace';
import CronSchedulerService from '#services/cron_scheduler_service';
export default class CronSchedulerStatus extends BaseCommand {
    static commandName = 'cron:status';
    static description = 'Show the status of cron schedulers';
    static options = {
        allowUnknownFlags: false,
    };
    async run() {
        this.logger.info('📊 Status Cron Scheduler');
        try {
            const mailer = await this.app.container.make('mailer');
            const schedulerService = new CronSchedulerService(mailer);
            const status = schedulerService.getSchedulerStatus();
            this.logger.info(`📈 Total Jobs: ${status.totalJobs}`);
            this.logger.info(`✅ Active Jobs: ${status.activeJobs}`);
            this.logger.info(`❌ Inactive Jobs: ${status.totalJobs - status.activeJobs}`);
            if (status.jobs.length > 0) {
                this.logger.info('\n📋 Detail Jobs:');
                status.jobs.forEach((job, index) => {
                    const statusIcon = job.status === 'scheduled' ? '✅' : '❌';
                    const runningIcon = job.isRunning ? '🟢' : '🔴';
                    this.logger.info(`${index + 1}. ${statusIcon} Status: ${job.status} ${runningIcon} Running: ${job.isRunning}`);
                });
            }
            else {
                this.logger.info('\n Tidak ada job yang aktif');
            }
            this.logger.info('\n Cron Patterns yang tersedia:');
            this.logger.info('• Weekly: 0 9 * * 1 (Setiap Senin jam 9:00)');
            this.logger.info('• Daily: 0 9 * * * (Setiap hari jam 9:00)');
            this.logger.info('• Custom: Sesuai pattern yang diinginkan');
        }
        catch (error) {
            this.logger.error('❌ Error saat mengecek status:', error.message);
            this.exitCode = 1;
        }
    }
}
//# sourceMappingURL=cron_scheduler_status.js.map