import { Router } from 'express'
import { list, getById, getMyCourses, create, update, remove, createQuiz, updateQuiz, deleteQuiz } from '../controllers/courseController.js'
import { auth, permit } from '../middleware/auth.js'

const r = Router()

r.get('/', list)
r.get('/my-courses', auth, permit('instructor','admin'), getMyCourses)
r.get('/:id', getById)
r.post('/', auth, permit('instructor','admin'), create)
r.put('/:id', auth, permit('instructor','admin'), update)
r.delete('/:id', auth, permit('instructor','admin'), remove)

// Quiz routes
r.post('/:id/quizzes', auth, permit('instructor','admin'), createQuiz)
r.put('/:id/quizzes/:quizId', auth, permit('instructor','admin'), updateQuiz)
r.delete('/:id/quizzes/:quizId', auth, permit('instructor','admin'), deleteQuiz)

export default r
