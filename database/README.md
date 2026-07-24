# Database សម្រាប់ Drama Playlist Website

ថតនេះមាន SQL script ចំនួន ២ សម្រាប់ជម្រើស Database ២ប្រភេទ — ជ្រើសយក **មួយប៉ុណ្ណោះ**
អាស្រ័យលើកម្មវិធីដែលអ្នកបានដំឡើងលើម៉ាស៊ីនរបស់អ្នក៖

- `mysql_schema.sql` → សម្រាប់ **MySQL/MariaDB** (Import តាម **phpMyAdmin**)
- `postgresql_schema.sql` → សម្រាប់ **PostgreSQL** (Import តាម **pgAdmin**)

រចនាសម្ព័ន្ធតារាងទាំង ២ file ដូចគ្នា (dramas + episodes), ខុសគ្នាតែ syntax
បន្តិចបន្តួចដែល MySQL និង PostgreSQL តម្រូវខុសគ្នា។

## រចនាសម្ព័ន្ធតារាង (Schema)

**dramas** (រឿងភាគ)
| Column | ប្រភេទ | ន័យ |
|---|---|---|
| id | INT (Auto) | លេខសម្គាល់ ស្វ័យប្រវត្តិ |
| title | VARCHAR | ចំណងជើងរឿង |
| poster | VARCHAR | Link រូបភាព |
| description | TEXT | សេចក្តីពិពណ៌នា |
| created_at | TIMESTAMP | ថ្ងៃបង្កើត (ស្វ័យប្រវត្តិ) |

**episodes** (ភាគរឿង) — ភ្ជាប់ទៅ `dramas` ដោយ `drama_id`
| Column | ប្រភេទ | ន័យ |
|---|---|---|
| id | INT (Auto) | លេខសម្គាល់ ស្វ័យប្រវត្តិ |
| drama_id | INT | ភ្ជាប់ទៅរឿងណាមួយក្នុង `dramas` |
| episode_number | INT | លេខរៀងភាគ (1, 2, 3...) |
| episode_title | VARCHAR | ចំណងជើងភាគ |
| video_url | VARCHAR | Link វីដេអូ |
| created_at | TIMESTAMP | ថ្ងៃបង្កើត (ស្វ័យប្រវត្តិ) |

រឿងភាគមួយ (1 drama) អាចមានច្រើនភាគ (many episodes) — នេះជា **One-to-Many
Relationship** ដែលអ្នកចង់បាន។ បើលុបរឿងភាគចេញ ភាគទាំងអស់របស់វានឹងត្រូវលុប
ដោយស្វ័យប្រវត្តិដែរ (`ON DELETE CASCADE`)។

---

## ជម្រើស A — MySQL + phpMyAdmin

### ជំហានទី ១ — បើក phpMyAdmin
បើកកម្មវិធីម៉ាស៊ីនអ្នក (ឧ. XAMPP, WAMP, Laragon) ហើយចូល phpMyAdmin តាម browser
(ធម្មតាតែងតែជា `http://localhost/phpmyadmin`)។

### ជំហានទី ២ — Import File
1. ចុច tab **Import** នៅខាងលើ
2. ចុច **Choose File** ជ្រើសយក `mysql_schema.sql`
3. ចុច **Go** (ខាងក្រោមទំព័រ)
4. រង់ចាំបន្តិច នឹងឃើញសារ "Import has been successfully finished"

**លម្អិត**: File នេះមានបញ្ចូល `CREATE DATABASE` រួចស្រាប់ ដូច្នេះមិនចាំបាច់
បង្កើត Database ដោយដៃមុននោះទេ — Import តែម្តង Database ឈ្មោះ `drama_playlist_db`
នឹងលេចឡើងដោយស្វ័យប្រវត្តិខាងឆ្វេង។

### ជំហានទី ៣ — ពិនិត្យមើលទិន្នន័យ
ចុចលើ `drama_playlist_db` ខាងឆ្វេង → ចុច `dramas` ឬ `episodes` → tab **Browse**
ដើម្បីមើលទិន្នន័យគំរូដែល Import ចូលរួច។

### ជំហានទី ៤ — Export (យក Backup ចេញវិញនៅថ្ងៃក្រោយ)
1. ចុចលើ Database `drama_playlist_db` ខាងឆ្វេង
2. ចុច tab **Export** នៅខាងលើ
3. ជ្រើស **Quick** (Export method) និង format **SQL**
4. ចុច **Go** — file `.sql` នឹង Download មកកុំព្យូទ័រអ្នក

File នេះនឹងមានទាំង Schema (CREATE TABLE) និងទិន្នន័យទាំងអស់ដែលអ្នកមាននៅពេលនោះ
— អាចយកទៅ Import ចូល Database ផ្សេង ឬរក្សាទុកជា Backup។

---

## ជម្រើស B — PostgreSQL + pgAdmin

### ជំហានទី ១ — បើក pgAdmin ហើយបង្កើត Database ថ្មី
1. បើក pgAdmin ហើយ Connect ទៅ Server (localhost) របស់អ្នក
2. ចុចខាងស្តាំលើ **Databases** → **Create** → **Database...**
3. ដាក់ឈ្មោះ `drama_playlist_db` → ចុច **Save**

(PostgreSQL តម្រូវអោយបង្កើត Database ដោយដៃមុន — មិនអាចដាក់ក្នុង script បានទេ
ដូច MySQL)

### ជំហានទី ២ — Import File
1. ចុចខាងស្តាំលើ Database `drama_playlist_db` ដែលទើបបង្កើត
2. ជ្រើស **Query Tool**
3. ចុច icon **Open File** (រូប folder) នៅខាងលើ Query Tool ជ្រើសយក
   `postgresql_schema.sql`
4. ចុច **Execute/Run** (រូប play ▶ ឬចុច F5)

នឹងឃើញសារ "Query returned successfully" ខាងក្រោម មានន័យថាបានជោគជ័យ។

### ជំហានទី ៣ — ពិនិត្យមើលទិន្នន័យ
ចុចបំបែក (expand) `drama_playlist_db` → **Schemas** → **public** → **Tables**
→ ចុចខាងស្តាំលើ `dramas` ឬ `episodes` → **View/Edit Data** → **All Rows**

### ជំហានទី ៤ — Export (យក Backup ចេញវិញនៅថ្ងៃក្រោយ)
1. ចុចខាងស្តាំលើ Database `drama_playlist_db`
2. ជ្រើស **Backup...**
3. ជ្រើស Format: **Plain** (នេះនឹង Export ជា file `.sql` ធម្មតាបើកមើលបានផ្ទាល់)
4. ជ្រើសទីតាំង Save File → ចុច **Backup**

File `.sql` ដែលបានគឺជា Backup ពេញលេញ រួមទាំង Schema និងទិន្នន័យទាំងអស់។

---

## សំណួរញឹកញាប់ (FAQ)

**តើអ្នកគួរជ្រើសមួយណា MySQL ឬ PostgreSQL?**
ទាំង ២ ដំណើរការបានល្អសម្រាប់ project ដូចនេះ។ បើអ្នកទើបចាប់ផ្តើម ហើយចង់បាន
tool ដែលងាយប្រើ (phpMyAdmin visual, drag-click សំរាប់ស្រាប់ជាមួយ XAMPP/Laragon),
MySQL ជាធម្មតាងាយសម្រាប់ beginner ជាង។

**បន្ទាប់ពី Import រួច តេ React (Backend) ត្រូវធ្វើអ្វីទៀត?**
Script នេះគ្រាន់តែបង្កើត Database/Tables ប៉ុណ្ណោះ។ ដើម្បីអោយ Website
(React frontend) អាចទាញ/បញ្ចូលទិន្នន័យបាន អ្នកនឹងត្រូវការ **Backend server**
(ឧ. Node.js + Express ភ្ជាប់ទៅ MySQL/PostgreSQL តាម library ដូចជា `mysql2`
ឬ `pg`) ដើម្បីជា "ស្ពាន" ចង្កោមរវាង React និង Database។ បើអ្នកចង់ ខ្ញុំអាចជួយ
បង្កើត Backend នេះជំហានបន្ទាប់។

**បើខ្ញុំចង់បន្ថែម Column ថ្មី (ឧ. Category, Status) តេធ្វើដូចម្តេច?**
មិនចាំបាច់សរសេរ SQL ដោយខ្លួនឯងទេ — គ្រាន់តែសួរខ្ញុំថា "ខ្ញុំចង់បន្ថែម column
X ទៅតារាង Y" ខ្ញុំនឹងសរសេរ `ALTER TABLE` statement ខ្លីមួយអោយអ្នក Copy ទៅ Run
ក្នុង phpMyAdmin/pgAdmin Query Tool។
