// PM2 process config for running the backend on the VPS.
// Usage on the server (inside the `server/` folder):
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup   (run the printed command once, so PM2 survives reboots)
module.exports = {
  apps: [
    {
      name: 'dramatv-api',
      cwd: __dirname,
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      watch: false,
    },
  ],
}
