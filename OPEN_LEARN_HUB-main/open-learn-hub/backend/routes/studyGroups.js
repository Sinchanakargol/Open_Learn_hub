import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  createStudyGroup,
  getStudyGroups,
  getMyStudyGroups,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  addResource,
  scheduleSession,
  updateMemberRole,
  deleteStudyGroup
} from '../controllers/studyGroupController.js'

const router = express.Router()

router.use(protect)

router.post('/', createStudyGroup)
router.get('/', getStudyGroups)
router.get('/my-groups', getMyStudyGroups)
router.get('/:id', getStudyGroup)
router.post('/:id/join', joinStudyGroup)
router.post('/:id/leave', leaveStudyGroup)
router.post('/:id/resources', addResource)
router.post('/:id/sessions', scheduleSession)
router.put('/:id/members', updateMemberRole)
router.delete('/:id', deleteStudyGroup)

export default router
