-- ============================================================
-- Drama Playlist Website — PostgreSQL Schema
-- ប្រើសម្រាប់ Import ចូល pgAdmin (PostgreSQL)
-- ============================================================

-- ចំណាំ: pgAdmin មិនអោយបង្កើត Database ដោយ script ធម្មតាទេ
-- (ត្រូវបង្កើត Database ដោយដៃជាមុនសិន ឈ្មោះ drama_playlist_db)
-- មើលជំហានទី ២ ក្នុងការណែនាំខាងក្រោម រួចទើប Run script នេះខាងក្នុង Database នោះ។

-- ១. តារាង Dramas (រឿងភាគ)
-- ផ្ទុកព័ត៌មានទូទៅរបស់រឿងភាគនីមួយៗ
CREATE TABLE IF NOT EXISTS dramas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,        -- ចំណងជើងរឿង
  poster VARCHAR(500),                -- Link រូបភាព Poster
  description TEXT,                  -- សេចក្តីពិពណ៌នារឿង
  content_rating VARCHAR(20),         -- អាយុសម្រាប់មើល (ឧ. TV-14, PG-13) — សម្រាប់ SEO Schema
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ២. តារាង Episodes (ភាគរឿង)
-- ភ្ជាប់ទៅ dramas ដោយ drama_id (One-to-Many: រឿងមួយមានច្រើនភាគ)
CREATE TABLE IF NOT EXISTS episodes (
  id SERIAL PRIMARY KEY,
  drama_id INTEGER NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,    -- លេខរៀងភាគ (1, 2, 3, ...)
  episode_title VARCHAR(255),         -- ចំណងជើងភាគ (មិនចាំបាច់)
  video_url VARCHAR(500) NOT NULL,    -- Link វីដេអូ
  duration VARCHAR(20),               -- រយៈពេលភាគ (នាទី, ឧ. "24") — សម្រាប់ Video Schema/Sitemap
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_drama_episode UNIQUE (drama_id, episode_number)
    -- មិនអោយរឿងតែមួយមានលេខភាគស្ទួន
);

-- ============================================================
-- គំរូទិន្នន័យ (Sample Data) — អាចលុប ឬកែប្រែបានតាមចង់
-- ============================================================

INSERT INTO dramas (title, poster, description) VALUES
('ស្នេហាចុងក្រោយ', 'https://via.placeholder.com/300x450?text=Drama+A', 'រឿងភាគស្នេហាមួយដែលនិយាយពីជីវិតគូស្នេហ៍វ័យក្មេងម្នាក់ ដែលត្រូវជម្នះឧបសគ្គជាច្រើនដើម្បីនៅជាមួយគ្នា។'),
('អាថ៌កំបាំងទីក្រុង', 'https://via.placeholder.com/300x450?text=Drama+B', 'រឿងភាគអន្ទះសារ ស៊ើបអង្កេតករបញ្ជរណាមួយ ដែលកំពុងស្វែងរកអាថ៌កំបាំងនៅក្នុងទីក្រុងធំមួយ។'),
('គ្រួសារយើង', 'https://via.placeholder.com/300x450?text=Drama+C', 'រឿងភាគគ្រួសារ ដែលបង្ហាញពីទំនាក់ទំនងឪពុកម្តាយកូន និងបុព្វហេតុនៃភាពជោគជ័យក្នុងជីវិត។');

INSERT INTO episodes (drama_id, episode_number, episode_title, video_url) VALUES
(1, 1, 'ការជួបគ្នាលើកទីមួយ', 'https://example.com/videos/drama-a-ep1.mp4'),
(1, 2, 'ការសម្រេចចិត្ត',     'https://example.com/videos/drama-a-ep2.mp4'),
(1, 3, 'ឧបសគ្គថ្មី',          'https://example.com/videos/drama-a-ep3.mp4'),
(2, 1, 'អាថ៌កំបាំងចាប់ផ្តើម', 'https://example.com/videos/drama-b-ep1.mp4'),
(2, 2, 'ភស្តុតាងថ្មី',        'https://example.com/videos/drama-b-ep2.mp4'),
(3, 1, 'ថ្ងៃដំបូងនៃគ្រួសារ',   'https://example.com/videos/drama-c-ep1.mp4');
