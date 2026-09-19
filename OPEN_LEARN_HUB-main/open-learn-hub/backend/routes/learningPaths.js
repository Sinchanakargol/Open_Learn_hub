import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  generateLearningPath,
  createLearningPath,
  getMyLearningPaths,
  getPublicLearningPaths,
  getLearningPath,
  enrollInLearningPath,
  completeStep,
  updateLearningPath,
  deleteLearningPath
} from '../controllers/learningPathController.js'

const router = express.Router()

router.use(protect)

router.post('/generate', generateLearningPath)
router.post('/', createLearningPath)
router.get('/my-paths', getMyLearningPaths)
router.get('/public', getPublicLearningPaths)
router.get('/:id', getLearningPath)
router.post('/:id/enroll', enrollInLearningPath)
router.post('/:id/steps/:stepId/complete', completeStep)
router.put('/:id', updateLearningPath)
router.delete('/:id', deleteLearningPath)

export default router
