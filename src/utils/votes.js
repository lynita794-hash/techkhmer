// Simple client-side Like/Dislike tracking (no backend votes table yet).
// Stores the current visitor's reaction per drama in localStorage so it
// persists across page reloads, and derives a live rating/votes count.

const STORAGE_KEY = 'dramatv_votes'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// Splits the drama's seed rating/votes into a base like/dislike count so the
// numbers shown before any interaction match the original data.
function baseCounts(rating, votes) {
  const total = Math.max(0, Math.round(votes) || 0)
  const likes = Math.max(0, Math.min(total, Math.round((rating / 5) * total)))
  return { likes, dislikes: total - likes }
}

export function getVoteState(dramaId, rating, votes) {
  const store = readStore()
  const entry = store[dramaId] || { myVote: null }
  const { likes: baseLikes, dislikes: baseDislikes } = baseCounts(rating, votes)

  let likes = baseLikes
  let dislikes = baseDislikes
  if (entry.myVote === 'like') likes += 1
  if (entry.myVote === 'dislike') dislikes += 1

  const total = likes + dislikes
  const displayRating = total > 0 ? (likes / total) * 5 : rating

  return {
    myVote: entry.myVote,
    likes,
    dislikes,
    votes: total,
    rating: displayRating,
  }
}

export function setVote(dramaId, vote) {
  const store = readStore()
  const current = store[dramaId]?.myVote || null
  const next = current === vote ? null : vote // clicking the same reaction again removes it
  store[dramaId] = { myVote: next }
  writeStore(store)
  return next
}
