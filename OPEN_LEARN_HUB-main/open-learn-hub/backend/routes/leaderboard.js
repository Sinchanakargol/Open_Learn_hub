import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { getLeaderboard } from '../controllers/leaderboardController.js'

const r = Router()

r.get('/', auth, getLeaderboard)

export default r
