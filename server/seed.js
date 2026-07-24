import 'dotenv/config'
import bcrypt from 'bcryptjs'
import db from './db.js'

const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

const sampleDramas = [
  {
    title: 'Kumpy Yuthisil Banhchea Ke Ah Ka Cheat Khnhom',
    poster: 'https://picsum.photos/seed/drama1/300/450',
    category: 'chinese',
    status: 'ENDED',
    premiered: 2023,
    broadcast: '2023-05-26',
    date_aired: '2023-05-26',
    duration: '35 min',
    studios: 'iQiyi',
    source: 'TMDB',
    country: 'China',
    rating: 2.0,
    votes: 33,
    description:
      "An adventure begins with a mistaken identity after a nobody pretends to be the illegitimate daughter of the Murong family.",
    genres: ['chinese', 'martial arts', 'romance', 'historical', 'drama'],
    totalEpisodes: 6,
  },
  {
    title: 'Chumrov Sneh Min Ach Bomplech',
    poster: 'https://picsum.photos/seed/drama2/300/450',
    category: 'chinese',
    totalEpisodes: 10,
  },
  {
    title: 'Athkombang Samai Thang Vak Chhang Cheat',
    poster: 'https://picsum.photos/seed/drama3/300/450',
    category: 'thai',
    totalEpisodes: 2,
  },
  {
    title: 'Kampul Torb Akas',
    poster: 'https://picsum.photos/seed/drama4/300/450',
    category: 'chinese',
    totalEpisodes: 14,
  },
  {
    title: 'Kumleat Sneha',
    poster: 'https://picsum.photos/seed/drama5/300/450',
    category: 'korean',
    totalEpisodes: 3,
  },
  {
    title: 'Reung Ayutethor Robos Preah Neang',
    poster: 'https://picsum.photos/seed/drama6/300/450',
    category: 'chinese',
    totalEpisodes: 30,
  },
]

function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username)
  if (existing) {
    console.log(`Admin "${username}" already exists, skipping.`)
    return
  }

  const hash = bcrypt.hashSync(password, 10)
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash)
  console.log(`Admin "${username}" created.`)
}

function seedDramas() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM dramas').get().c
  if (count > 0) {
    console.log('Dramas table already has data, skipping seed.')
    return
  }

  const insertDrama = db.prepare(`
    INSERT INTO dramas (
      title, poster, category, status, type, premiered, broadcast, date_aired,
      duration, producers, studios, source, country, rating, votes,
      description, genres, total_episodes
    ) VALUES (
      @title, @poster, @category, @status, @type, @premiered, @broadcast, @date_aired,
      @duration, @producers, @studios, @source, @country, @rating, @votes,
      @description, @genres, @total_episodes
    )
  `)
  const insertEpisode = db.prepare(
    'INSERT INTO episodes (drama_id, number, video_url) VALUES (?, ?, ?)',
  )

  db.exec('BEGIN')
  try {
    for (const d of sampleDramas) {
      const result = insertDrama.run({
        title: d.title,
        poster: d.poster || null,
        category: d.category || 'chinese',
        status: d.status || 'ONGOING',
        type: d.type || 'TV Series',
        premiered: d.premiered || null,
        broadcast: d.broadcast || null,
        date_aired: d.date_aired || null,
        duration: d.duration || null,
        producers: d.producers || null,
        studios: d.studios || null,
        source: d.source || null,
        country: d.country || null,
        rating: d.rating || 0,
        votes: d.votes || 0,
        description: d.description || '',
        genres: JSON.stringify(d.genres || []),
        total_episodes: d.totalEpisodes,
      })

      const dramaId = result.lastInsertRowid
      for (let i = 1; i <= d.totalEpisodes; i += 1) {
        insertEpisode.run(dramaId, i, SAMPLE_VIDEO)
      }
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }

  console.log(`Seeded ${sampleDramas.length} dramas.`)
}

seedAdmin()
seedDramas()
console.log('Done.')
