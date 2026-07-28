// PM2-конфіг для standalone-сервера Next.js на VPS.
// Перед запуском: npm run build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
// Запуск:        pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: "smr-web",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "400M",
    },
  ],
};
