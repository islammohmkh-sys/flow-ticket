# Deploy Online Guide

```bash
npm install
npm run build
npm start
```

Open:

```text
http://SERVER-IP:4000
```

For VPS use PM2:

```bash
npm install -g pm2
pm2 start "npm start" --name flow-ticket
pm2 save
pm2 startup
```

Backup: `server/data/`
