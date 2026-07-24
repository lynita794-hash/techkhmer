import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { fetchComments, postComment } from '../utils/adminApi'
import './CommentSection.css'

// Lets signed-in visitors post and read comments on a drama's watch page.
// The backend (server/routes/comments.js) already existed and enforced
// auth on POST — this component is the missing frontend half.
function CommentSection({ dramaId }) {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const timeAgo = (isoString) => {
    const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
    if (seconds < 60) return t('comments.justNow')
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return t('comments.minutesAgo', minutes)
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t('comments.hoursAgo', hours)
    const days = Math.floor(hours / 24)
    return t('comments.daysAgo', days)
  }

  useEffect(() => {
    setLoading(true)
    fetchComments(dramaId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dramaId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setError('')
    setPosting(true)
    try {
      const created = await postComment(token, dramaId, content.trim())
      setComments((prev) => [created, ...prev])
      setContent('')
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <section className="comment-section">
      <h2 className="comment-section-title">{t('comments.title', comments.length)}</h2>

      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('comments.placeholder')}
            maxLength={1000}
          />
          <button type="submit" disabled={posting || !content.trim()}>
            {posting ? t('comments.sending') : t('comments.send')}
          </button>
        </form>
      ) : (
        <p className="comment-login-hint">
          <Link to="/login">{t('comments.loginHintLink')}</Link> {t('comments.loginHintSuffix')}
        </p>
      )}

      {error && <p className="comment-error">{error}</p>}

      {loading ? (
        <p className="comment-loading">{t('common.loading')}</p>
      ) : comments.length === 0 ? (
        <p className="comment-empty">{t('comments.empty')}</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li className="comment-item" key={c.id}>
              <span className="comment-avatar">{c.userName.charAt(0).toUpperCase()}</span>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{c.userName}</span>
                  <span className="comment-time">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="comment-text">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default CommentSection
