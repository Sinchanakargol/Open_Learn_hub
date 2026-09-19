import express from 'express'
import { auth } from '../middleware/auth.js'
import {
  checkAndAwardBadges,
  getUserBadges,
  getBadgeStats,
  getAvailableBadges
} from '../controllers/badgeController.js'

const router = express.Router()

// All routes require authentication
router.use(auth)

// Check and award new badges
router.post('/check', checkAndAwardBadges)

// Get user's earned badges
router.get('/my-badges', getUserBadges)
router.get('/user/:userId', getUserBadges)

// Get badge statistics
router.get('/stats', getBadgeStats)

// Get all available badges
router.get('/available', getAvailableBadges)

export default router
