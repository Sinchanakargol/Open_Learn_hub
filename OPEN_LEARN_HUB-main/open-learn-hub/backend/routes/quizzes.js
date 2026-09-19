import { Router } from 'express'
import { auth, permit } from '../middleware/auth.js'
import { list, create, update, remove as deleteQuiz, submit } from '../controllers/quizController.js'

const r = Router()

r.get('/', auth, list)
r.post('/', auth, permit('instructor', 'admin'), create)
r.put('/:id', auth, permit('instructor', 'admin'), update)
r.delete('/:id', auth, permit('instructor', 'admin'), deleteQuiz)
r.post('/:id/submit', auth, submit)

export default r
