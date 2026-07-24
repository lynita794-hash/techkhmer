import { Router } from 'express'
import db from '../db.js'
import { requireAuth, requireUserAuth } from '../auth.js'
import { sendMail } from '../mailer.js'
import { logActivity } from '../activityLog.js'

const router = Router()

function mapComment(row) {
  return {
    id: row.id,
    dramaId: row.drama_id,
    userId: row.user_id,
    userName: row.user_name,
    content: row.content,
    createdAt: row.created_at,
  }
}

function mapCommentWithDrama(row) {
  return { ...mapComment(row), dramaTitle: row.drama_title }
}

// GET /api/comments/all — every comment site-wide, newest first, with the
// drama title attached (admin only). Used by Admin Panel > Comment
// Moderation so admins can review/remove comments from one place instead
// of hunting through each drama's Watch page individually. Optional
// `search` filters by comment content, commenter name, or drama title.
router.get('/all', requireAuth, (req, res) => {
  const search = (req.query.search || '').trim()

  let rows
  if (search) {
    const like = `%${search}%`
    rows = db
      .prepare(
        `SELECT c.*, u.name AS user_name, d.title AS drama_title FROM comments c
         JOIN users u ON u.id = c.user_id
         JOIN dramas d ON d.id = c.drama_id
         WHERE c.content LIKE ? OR u.name LIKE ? OR d.title LIKE ?
         ORDER BY c.created_at DESC`,
      )
      .all(like, like, like)
  } else {
    rows = db
      .prepare(
        `SELECT c.*, u.name AS user_name, d.title AS drama_title FROM comments c
         JOIN users u ON u.id = c.user_id
         JOIN dramas d ON d.id = c.drama_id
         ORDER BY c.created_at DESC`,
      )
      .all()
  }

  res.json(rows.map(mapCommentWithDrama))
})

// POST /api/comments/bulk-delete — remove multiple comments at once
// (admin only), for clearing out spam/abuse quickly from the moderation
// list instead of deleting one at a time.
router.post('/bulk-delete', requireAuth, (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' })
  }

  const del = db.prepare('DELETE FROM comments WHERE id = ?')
  for (const id of ids) del.run(Number(id))
  logActivity(req.admin, 'bulk_delete_comments', `${ids.length} comments`, ids.join(','))

  res.json({ deleted: ids.length })
})

// GET /api/comments?dramaId=1 — list comments for a drama (public)
router.get('/', (req, res) => {
  const { dramaId } = req.query
  if (!dramaId) return res.status(400).json({ error: 'dramaId is required' })

  const rows = db
    .prepare(
      `SELECT c.*, u.name AS user_name FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.drama_id = ?
       ORDER BY c.created_at DESC`,
    )
    .all(dramaId)

  res.json(rows.map(mapComment))
})

// POST /api/comments — add a comment (signed-in visitors only)
router.post('/', requireUserAuth, (req, res) => {
  const { dramaId, content } = req.body || {}
  if (!dramaId || !content?.trim()) {
    return res.status(400).json({ error: 'dramaId and content are required' })
  }

  const drama = db.prepare('SELECT id FROM dramas WHERE id = ?').get(dramaId)
  if (!drama) return res.status(404).json({ error: 'Drama not found' })

  const result = db
    .prepare('INSERT INTO comments (drama_id, user_id, content) VALUES (?, ?, ?)')
    .run(dramaId, req.user.id, content.trim())

  const row = db
    .prepare(
      `SELECT c.*, u.name AS user_name FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
    )
    .get(result.lastInsertRowid)

  // Notify other commenters on this same drama (who opted in) that a new
  // reply/comment was posted — best-effort, doesn't block the response.
  notifyOtherCommenters(dramaId, req.user.id, row.user_name, content.trim()).catch(() => {})

  res.status(201).json(mapComment(row))
})

// Emails every other distinct user who has previously commented on this
// drama (and hasn't opted out via notify_comments) about the new comment,
// so people get pulled back into ongoing discussions.
async function notifyOtherCommenters(dramaId, posterId, posterName, content) {
  const drama = db.prepare('SELECT title FROM dramas WHERE id = ?').get(dramaId)
  const recipients = db
    .prepare(
      `SELECT DISTINCT u.id, u.email, u.name FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.drama_id = ? AND c.user_id != ? AND u.notify_comments = 1`,
    )
    .all(dramaId, posterId)

  await Promise.all(
    recipients.map((r) =>
      sendMail({
        to: r.email,
        subject: `មតិយោបល់ថ្មីលើ "${drama?.title || 'Drama'}" - DramaTV`,
        html: `<p>សួស្តី ${r.name},</p>
          <p><strong>${posterName}</strong> បានសរសេរមតិយោបល់ថ្មីលើ "${drama?.title}"៖</p>
          <p style="padding:10px;background:#f5f5f5;border-radius:6px;">${content}</p>`,
      }),
    ),
  )
}

// DELETE /api/comments/:id — remove a comment (admin only)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM comments WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Comment not found' })

  db.prepare('DELETE FROM comments WHERE id = ?').run(existing.id)
  logActivity(req.admin, 'delete_comment', `comment #${existing.id}`, null)
  res.status(204).end()
})

export default router
