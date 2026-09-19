import User from '../models/User.js'
import { signToken } from '../utils/jwt.js'

export async function register(req,res){
  const { name, email, password, role } = req.body
  const exists = await User.findOne({ email })
  if (exists) return res.status(400).json({ message: 'Email exists' })
  const user = await User.create({ name, email, password, role })
  const token = signToken({ id: user._id, role: user.role, name: user.name })
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token })
}

export async function login(req,res){
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  const ok = await user.comparePassword(password)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
  const token = signToken({ id: user._id, role: user.role, name: user.name })
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token })
}

export async function me(req,res){
  const { id } = req.user
  const user = await User.findById(id).select('-password')
  res.json(user)
}

export async function updateProfile(req,res){
  try {
    const { id } = req.user
    const { consultationRate, bio, expertise } = req.body
    
    const user = await User.findByIdAndUpdate(
      id,
      { consultationRate, bio, expertise },
      { new: true }
    ).select('-password')
    
    res.json(user)
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
}
