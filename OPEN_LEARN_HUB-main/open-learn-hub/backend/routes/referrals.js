import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  generateReferralCode,
  getMyReferrals,
  applyReferralCode,
  claimReward,
  trackReferralClick,
  getReferralLeaderboard,
  deleteReferralCode
} from '../controllers/referralController.js'

const router = express.Router()

router.use(protect)

router.post('/generate', generateReferralCode)
router.get('/my-referrals', getMyReferrals)
router.post('/apply', applyReferralCode)
router.post('/:id/claim', claimReward)
router.post('/track/:code', trackReferralClick)
router.get('/leaderboard', getReferralLeaderboard)
router.delete('/:id', deleteReferralCode)

export default router
