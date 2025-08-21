import env from '#start/env';
import { defineConfig, stores } from '@adonisjs/session';
const sessionConfig = defineConfig({
    enabled: true,
    cookieName: 'adonis-session',
    clearWithBrowser: true,
    age: '2h',
    cookie: {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    },
    store: env.get('SESSION_DRIVER'),
    stores: {
        cookie: stores.cookie(),
    },
});
export default sessionConfig;
//# sourceMappingURL=session.js.map