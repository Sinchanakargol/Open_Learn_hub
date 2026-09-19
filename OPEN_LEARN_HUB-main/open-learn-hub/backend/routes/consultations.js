import { Router } from 'express'
import { auth, permit } from '../middleware/auth.js'
import { 
  getInstructors, 
  createConsultation, 
  handlePaymentCallback,
  getMyConsultations,
  getConsultation,
  getInstructorConsultations,
  getInstructorEarnings,
  updateConsultationStatus
} from '../controllers/consultationController.js'

const r = Router()

// Public routes
r.get('/instructors', auth, getInstructors)

// Student routes
r.post('/', auth, permit('student'), createConsultation)
r.post('/payment-callback', auth, handlePaymentCallback)
r.get('/my-consultations', auth, getMyConsultations) // Allow both students and instructors
r.get('/:id', auth, getConsultation)
r.patch('/:id/status', auth, updateConsultationStatus)

// Instructor routes
r.get('/instructor/consultations', auth, permit('instructor', 'admin'), getInstructorConsultations)
r.get('/instructor/earnings', auth, permit('instructor', 'admin'), getInstructorEarnings)

export default r
