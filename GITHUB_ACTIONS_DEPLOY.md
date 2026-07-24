# Deploy ស្វ័យប្រវត្តិទៅ VPS តាម GitHub Actions

Workflow ស្ថិតនៅ `.github/workflows/deploy.yml` — run ស្វ័យប្រវត្តិរាល់ពេល push
ទៅ branch `main`, ឬអាចចុច "Run workflow" ដោយដៃពី GitHub Actions tab។

វា build frontend (`npm run build`) រួច upload:
- `dist/` contents → `htdocs/techkhmer.org/` (static site root)
- `server/` code → folder **ក្រៅ** htdocs (មិនចេញជាសាធារណៈ)

រួច SSH ចូល VPS ដើម្បី `npm install --omit=dev` និង `pm2 restart` ។

`.env`, `data.sqlite*`, `uploads/` លើ VPS មិនត្រូវប៉ះពាល់ដោយ deploy script នេះទេ
(មិន commit ចូល git ដូចគ្នា)។

## ជំហានទី ១ — បង្កើត SSH key ដាច់ដោយឡែកសម្រាប់ Deploy

លើ local machine (មិនមែន VPS):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""
```

នេះបង្កើត file ២៖ `deploy_key` (private) និង `deploy_key.pub` (public)។

## ជំហានទី ២ — ដាក់ Public Key លើ VPS

SSH ចូល VPS ជាមួយ user របស់ site (ឧ. `techkhmer`, មិនមែន `root`):

```bash
ssh techkhmer@<vps-ip>
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "PASTE_CONTENT_OF_deploy_key.pub_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## ជំហានទី ៣ — បន្ថែម GitHub Repo Secrets

GitHub repo → **Settings > Secrets and variables > Actions > New repository secret**៖

| Secret name           | ឧទាហរណ៍តម្លៃ                                  |
|------------------------|-----------------------------------------------|
| `DEPLOY_SSH_HOST`      | `techkhmer.org` ឬ IP address របស់ VPS         |
| `DEPLOY_SSH_USER`      | `techkhmer` (CloudPanel site user)            |
| `DEPLOY_SSH_KEY`       | ខ្លឹមសារទាំងមូលរបស់ file `deploy_key` (private)|
| `DEPLOY_SSH_PORT`      | `22` (ស្រេចចិត្ត — លុះត្រាតែប្តូរ port ផ្សេង)   |
| `DEPLOY_HTDOCS_PATH`   | `/home/techkhmer/htdocs/techkhmer.org`        |
| `DEPLOY_SERVER_PATH`   | `/home/techkhmer/dramatv-server/server`       |

`DEPLOY_SERVER_PATH` **ត្រូវនៅក្រៅ** `htdocs/` ដូចក្នុង `CLOUDPANEL_STATIC_FIX.md`
ជំហានទី ១ — មិនដូច្នេះទេ `server/` (រួមទាំង code, `.env` នាពេលអនាគត) នឹងអាចចេញជា
សាធារណៈម្តងទៀត។

## ជំហានទី ៤ — លើកដំបូង setup ដោយដៃម្តងលើ VPS

Workflow នេះមិនបង្កើត `server/.env`, `pm2 startup`, ឬ nginx vhost ទេ — ធ្វើម្តង
ដោយដៃតាមជំហានទី ៣-៥ ក្នុង `CLOUDPANEL_STATIC_FIX.md` សិន (បើមិនទាន់ធ្វើ)។ បន្ទាប់ពី
នោះ deploy ស្វ័យប្រវត្តិនឹងគ្រាន់តែ sync code ថ្មី + restart process ដែលមានស្រាប់។

## ជំហានទី ៥ — សាកល្បង

Push commit ណាមួយទៅ `main`, ឬចូល **Actions** tab លើ GitHub → ជ្រើស workflow
"Deploy to VPS" → **Run workflow**។ តាមមើល log — បើបញ្ហា SSH host key, run:

```bash
ssh-keyscan -p 22 techkhmer.org
```

ដើម្បីផ្ទៀងផ្ទាត់ fingerprint ត្រូវគ្នាមុននឹង trust ។

## សុវត្ថិភាព

- Private key (`deploy_key`) **កុំដាក់ចូល git ជាដាច់ខាត** — លុបចេញពី local
  disk បន្ទាប់ពី copy ចូល GitHub Secret ហើយ។
- `DEPLOY_SSH_USER` គួរប្រើ user កម្រិត site (CloudPanel-managed), មិនមែន
  `root`, ដើម្បីកំណត់ blast radius បើ key នេះលេចធ្លាយ។
- `server/.env` នៅតែត្រូវកែដោយដៃលើ VPS ដូចមុន — មិនដែលឆ្លងកាត់ GitHub ទេ។
