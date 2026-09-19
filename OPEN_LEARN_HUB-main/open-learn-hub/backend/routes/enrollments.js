import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { enroll, getMyEnrollments, updateProgress, completeLesson, submitQuizScore } from '../controllers/enrollmentController.js'

const r = Router()

r.use(auth)

r.post('/', enroll)
r.get('/my-enrollments', getMyEnrollments)
r.patch('/:id/progress', updateProgress)
r.post('/complete-lesson', completeLesson)
r.post('/submit-quiz-score', submitQuizScore)

export default r
