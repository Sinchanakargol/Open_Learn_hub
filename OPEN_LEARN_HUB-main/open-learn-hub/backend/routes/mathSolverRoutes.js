import express from 'express';
import { mathSolverController } from '../controllers/mathSolverController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Math solver routes
router.post('/solve', auth, mathSolverController.solveEquation);
router.get('/model-info', auth, mathSolverController.getModelInfo);

export default router;