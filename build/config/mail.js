import env from '#start/env';
import { defineConfig, transports } from '@adonisjs/mail';
const mailConfig = defineConfig({
    default: 'smtp',
    mailers: {
        smtp: transports.smtp({
            host: env.get('SMTP_HOST') || 'smtp.gmail.com',
            port: env.get('SMTP_PORT') || '587',
            secure: env.get('SMTP_SECURE') === 'true',
            auth: {
                type: 'login',
                user: env.get('SMTP_USERNAME') || 'financeandara@gmail.com',
                pass: env.get('SMTP_PASSWORD') || 'dcdntkmvstdulhjp',
            },
            tls: {
                rejectUnauthorized: env.get('SMTP_TLS_REJECT_UNAUTHORIZED') === 'true'
            }
        }),
    },
});
export default mailConfig;
//# sourceMappingURL=mail.js.map