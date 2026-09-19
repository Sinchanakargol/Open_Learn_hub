import { Router } from 'express'
import { createReview, getCourseReviews, markHelpful, deleteReview } from '../controllers/reviewController.js'
import { auth } from '../middleware/auth.js'

const r = Router()

r.post('/', auth, createReview)
r.get('/course/:courseId', getCourseReviews)
r.post('/:reviewId/helpful', auth, markHelpful)
r.delete('/:reviewId', auth, deleteReview)

export default r
