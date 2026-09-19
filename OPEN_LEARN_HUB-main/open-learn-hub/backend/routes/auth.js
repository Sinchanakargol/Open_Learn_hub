import { Router } from 'express'
import { login, register, me, updateProfile } from '../controllers/authController.js'
import { auth } from '../middleware/auth.js'

const r = Router()

r.post('/register', register)
r.post('/login', login)
r.get('/me', auth, me)
r.patch('/profile', auth, updateProfile)

export default r
