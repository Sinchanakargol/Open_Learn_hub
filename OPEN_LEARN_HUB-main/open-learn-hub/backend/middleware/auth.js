import jwt from 'jsonwebtoken'

export function auth(req,res,next){
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'No token' })
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
    req.user = decoded
    next()
  }catch(e){
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export function permit(...roles){
  return (req,res,next)=>{
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

// Alias for compatibility with new routes
export const protect = auth
