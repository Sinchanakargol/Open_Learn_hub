import express from 'express'
import { executeCode } from '../controllers/codelabController.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

// Execute code endpoint - protected route
router.post('/execute', auth, executeCode)

export default router
