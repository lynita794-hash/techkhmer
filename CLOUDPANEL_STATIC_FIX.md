# ជួសជុល techkhmer.org (Static site → Node backend មិនដំណើរការ)

Site type ជា **Static HTML** ដូច្នេះ CloudPanel/nginx serve តែ file ក្នុង `dist/`
ដោយផ្ទាល់។ `/admin/*` និង `/api/*` គ្មាន file ត្រូវគ្នា → 404។ ដំណោះស្រាយខាងក្រោម
រក្សា site static ដើម (មិនចាំបាច់លុប) ហើយបញ្ជូន traffic ត្រូវការទៅ Node backend
តាម PM2 + nginx location rules។

## ជំហានទី ១ — Upload code ទៅ VPS

Upload/pull ថតទាំងអស់ (`server/` folder ជាមួយ code, `package.json`, ។ល។)
ទៅទីតាំងណាមួយក្រៅពី `htdocs/techkhmer.org` ឧទាហរណ៍:

```bash
/home/<cloudpanel-site-user>/dramatv-server
```

## ជំហានទី ២ — តំឡើង dependencies + build frontend

លើ local (ឬតាម CI), build frontend ជាមុន:

```bash
npm install
npm run build
```

នេះនឹងបង្កើត `dist/` folder។ Upload **មាតិកាខាងក្នុង** `dist/` (មិនមែន folder
`dist` ខ្លួនវា) ទៅជាន់ត្រូវនឹង `htdocs/techkhmer.org/` (root របស់ static site
ក្នុង CloudPanel) ដូច្នេះ `index.html`, `assets/`, `favicon.svg` ស្ថិតនៅ root
ដោយផ្ទាល់។

## ជំហានទី ៣ — Run backend ជាមួយ PM2

SSH ចូល VPS:

```bash
cd /home/<cloudpanel-site-user>/dramatv-server/server
npm install --omit=dev
npm install -g pm2   # បើមិនទាន់មាន
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup          # រត់ command ដែលវា print ចេញ ១ដង
```

`ecosystem.config.cjs` ត្រូវបានបង្កើតរួចហើយក្នុង `server/` folder (ចេញ port 4000
តាម `PORT` ក្នុង `.env`)។

## ជំហានទី ៤ — កែ `server/.env` លើ VPS

```dotenv
PORT=4000
JWT_SECRET=<generate ថ្មី ២០+ characters random>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password ខ្លាំង ថ្មី>
CORS_ORIGIN=https://techkhmer.org
TMDB_API_KEY=<key ដូចគ្នា ឬថ្មី>
```

កំណត់សំខាន់: `.env` file នេះមិនត្រូវ commit ចូល git ទេ (មាន `.gitignore` រួចហើយ)
ត្រូវបង្កើត/កែផ្ទាល់លើ VPS។

## ជំហានទី ៥ — កែ Nginx Vhost ក្នុង CloudPanel

CloudPanel → Sites → techkhmer.org → **Vhost** tab → បន្ថែម location blocks
ខាងក្នុង `server { ... }` block ដែលមានស្រាប់ (មុន `location /` ចាស់ ឬជំនួស):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

`location /` ជាមួយ `try_files ... /index.html` គឺជា **SPA fallback**៖ route
client-side ដូចជា `/admin/login` គ្មាន file ត្រូវគ្នា នឹងត្រូវ serve
`index.html` ជំនួស ដើម្បីឲ្យ React Router គ្រប់គ្រង route នោះ។

រក្សា `Save` ក្នុង CloudPanel — វានឹង reload nginx ដោយស្វ័យប្រវត្តិ។

## ជំហានទី ៦ — សាកល្បង

```bash
curl -I https://techkhmer.org/admin/login   # ត្រូវរង់ចាំ 200
curl https://techkhmer.org/api/health       # ត្រូវរង់ចាំ {"ok":true}
```

បើដំណើរការត្រឹមត្រូវ, ចូល `https://techkhmer.org/admin/login` ក្នុង browser
ហើយ login ជាមួយ `ADMIN_USERNAME` / `ADMIN_PASSWORD` ថ្មីក្នុង `.env`។

## ពេលមាន update កូដថ្មី (Deploy script)

រាល់ពេលមាន code ថ្មី លើ VPS:

```bash
cd /home/<cloudpanel-site-user>/dramatv-server
git pull                      # ឬ upload ថ្មី
npm install
npm run build
cp -r dist/* /home/<cloudpanel-site-user>/htdocs/techkhmer.org/
cd server
npm install --omit=dev
pm2 restart dramatv-api
```
