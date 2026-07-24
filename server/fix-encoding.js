// One-off script to repair double-encoded (mojibake) Khmer text in the
// database. Some rows were saved where UTF-8 bytes got misread as
// Windows-1252 and re-saved as UTF-8, producing garbled text like
// "áž…áž·áž“" instead of "ចិន".
//
// Run once with: node fix-encoding.js
import db from './db.js'

function tryFix(str) {
  if (typeof str !== 'string' || !str) return null
  const dec = new TextDecoder('windows-1252')
  const map = new Map()
  for (let b = 0; b < 256; b += 1) map.set(dec.decode(Buffer.from([b])), b)

  const bytes = []
  for (const ch of str) {
    if (!map.has(ch)) return null
    bytes.push(map.get(ch))
  }

  try {
    const utf8dec = new TextDecoder('utf-8', { fatal: true })
    const fixed = utf8dec.decode(Buffer.from(bytes))
    return fixed !== str ? fixed : null
  } catch {
    return null
  }
}

const tables = {
  categories: ['label'],
  menus: ['label'],
  comments: ['content'],
  users: ['name'],
  site_settings: ['site_name', 'seo_description'],
  dramas: [
    'title',
    'description',
    'type',
    'broadcast',
    'duration',
    'producers',
    'studios',
    'source',
    'country',
  ],
}

let fixedCount = 0

for (const [table, cols] of Object.entries(tables)) {
  const rows = db.prepare(`SELECT * FROM ${table}`).all()
  for (const row of rows) {
    const updates = {}
    for (const col of cols) {
      const fixed = tryFix(row[col])
      if (fixed) updates[col] = fixed
    }
    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates)
        .map((c) => `${c} = @${c}`)
        .join(', ')
      db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = @id`).run({
        ...updates,
        id: row.id,
      })
      console.log(`Fixed ${table}#${row.id}:`, updates)
      fixedCount += 1
    }
  }
}

// episodes.subtitles stores a JSON string; fix the whole string if garbled.
const episodes = db.prepare('SELECT * FROM episodes').all()
for (const ep of episodes) {
  const fixed = tryFix(ep.subtitles)
  if (fixed) {
    db.prepare('UPDATE episodes SET subtitles = ? WHERE id = ?').run(fixed, ep.id)
    console.log(`Fixed episodes#${ep.id} subtitles`)
    fixedCount += 1
  }
}

console.log(`Done. Fixed ${fixedCount} row(s).`)
