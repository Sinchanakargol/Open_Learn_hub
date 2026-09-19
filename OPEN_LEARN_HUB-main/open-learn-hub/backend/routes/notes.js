import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  createNote,
  generateSummary,
  getMyNotes,
  updateNote,
  deleteNote,
  shareNote
} from '../controllers/noteController.js'

const router = express.Router()

router.use(protect)

router.post('/', createNote)
router.get('/', getMyNotes)
router.post('/:id/summary', generateSummary)
router.put('/:id', updateNote)
router.delete('/:id', deleteNote)
router.post('/:id/share', shareNote)

export default router
