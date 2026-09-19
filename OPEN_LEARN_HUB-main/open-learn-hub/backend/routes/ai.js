import { Router } from 'express'
import { auth, permit } from '../middleware/auth.js'
import { recommend, nextQuestion, sentiment, generateQuiz, analyzeMood, chat, predictPerformance } from '../controllers/aiController.js'

const r = Router()
r.use(auth)

r.get('/recommendations', recommend)
r.post('/recommend', recommend)
r.post('/adaptive-quiz/next', nextQuestion)
r.post('/sentiment', sentiment)
r.post('/analyze-mood', analyzeMood)
r.post('/chat', chat)
r.post('/generate-quiz', generateQuiz) // Allow all authenticated users to generate quizzes
r.post('/predict-performance', predictPerformance) // Random Forest ML predictions

export default r
