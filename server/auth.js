import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env and configure it.')
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

function getBearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}

// Requires an admin JWT (issued by /api/auth/login)
export function requireAuth(req, res, next) {
  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Requires a regular user JWT (issued by /api/users/login or /register)
export function requireUserAuth(req, res, next) {
  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.role !== 'user') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
