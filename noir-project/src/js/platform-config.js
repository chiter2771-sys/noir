// NOIR platform configuration blueprint for auth, API, video balancers and runtime flags.
// Values are intentionally environment-driven so Railway/VPS deployment only requires env updates.
export const platformConfig = Object.freeze({
  app: {
    name: 'NOIR',
    publicUrl: process.env.PUBLIC_APP_URL || 'http://localhost:3000',
    port: Number(process.env.PORT || 3000),
    locale: process.env.DEFAULT_LOCALE || 'ru-RU'
  },
  security: {
    csrfCookie: '__Host-noir_csrf',
    sessionCookie: '__Host-noir_session',
    cookieSameSite: 'lax',
    csp: "default-src 'self'; img-src 'self' https: data:; media-src 'self' https: blob:; frame-src https:; connect-src 'self' https:; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
    rateLimits: {
      auth: { windowMs: 60_000, max: 10 },
      api: { windowMs: 60_000, max: 120 },
      search: { windowMs: 60_000, max: 60 }
    }
  },
  oauth: {
    google: {
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackPath: '/auth/google/callback',
      scopes: ['openid', 'email', 'profile']
    },
    yandex: {
      enabled: Boolean(process.env.YANDEX_CLIENT_ID),
      clientId: process.env.YANDEX_CLIENT_ID || '',
      clientSecret: process.env.YANDEX_CLIENT_SECRET || '',
      callbackPath: '/auth/yandex/callback',
      scopes: ['login:email', 'login:info']
    },
    vk: {
      enabled: Boolean(process.env.VK_CLIENT_ID),
      clientId: process.env.VK_CLIENT_ID || '',
      clientSecret: process.env.VK_CLIENT_SECRET || '',
      callbackPath: '/auth/vk/callback',
      scopes: ['email']
    }
  },
  videoBalancers: [
    {
      id: 'primary',
      provider: process.env.VIDEO_BALANCER_PROVIDER || 'stub-adapter',
      baseUrl: process.env.VIDEO_BALANCER_URL || '',
      apiKey: process.env.VIDEO_BALANCER_API_KEY || '',
      supports: ['movies', 'series', 'anime', 'translations', 'episodes', 'qualities', 'watch-position']
    }
  ]
});
