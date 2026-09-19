import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  generateStudyMaterial,
  getMyStudyMaterials,
  getStudyMaterial,
  downloadStudyMaterial,
  deleteStudyMaterial,
  regeneratePDF
} from '../controllers/studyMaterialController.js'

const router = express.Router()

router.use(protect)

router.post('/generate', generateStudyMaterial)
router.get('/', getMyStudyMaterials)
router.get('/:id', getStudyMaterial)
router.get('/:id/download', downloadStudyMaterial)
router.post('/:id/regenerate', regeneratePDF)
router.delete('/:id', deleteStudyMaterial)

export default router
