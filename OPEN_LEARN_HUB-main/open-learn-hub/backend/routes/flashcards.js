import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  generateFlashcards,
  createFlashcard,
  getDueFlashcards,
  reviewFlashcard,
  getDecks,
  deleteFlashcard
} from '../controllers/flashcardController.js'

const router = express.Router()

router.use(protect)

router.post('/generate', generateFlashcards)
router.post('/', createFlashcard)
router.get('/due', getDueFlashcards)
router.get('/decks', getDecks)
router.post('/:id/review', reviewFlashcard)
router.delete('/:id', deleteFlashcard)

export default router
