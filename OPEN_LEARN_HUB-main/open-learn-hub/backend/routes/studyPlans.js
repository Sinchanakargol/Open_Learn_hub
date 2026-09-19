import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  generateStudyPlan,
  createStudyPlan,
  getMyStudyPlans,
  updateStudyPlan,
  completeMilestone,
  deleteStudyPlan
} from '../controllers/studyPlanController.js'

const router = express.Router()

router.use(protect)

router.post('/generate', generateStudyPlan)
router.post('/', createStudyPlan)
router.get('/', getMyStudyPlans)
router.put('/:id', updateStudyPlan)
router.post('/:id/milestones/:milestoneId/complete', completeMilestone)
router.delete('/:id', deleteStudyPlan)

export default router
