import { Router } from 'express'
import { auth, permit } from '../middleware/auth.js'
import { 
  createTimeSlots, 
  getInstructorTimeSlots,
  getAvailableSlots,
  deleteTimeSlot
} from '../controllers/timeSlotController.js'

const r = Router()

r.use(auth)

// Instructor routes
r.post('/', permit('instructor', 'admin'), createTimeSlots)
r.get('/my-slots', permit('instructor', 'admin'), getInstructorTimeSlots)
r.delete('/:id', permit('instructor', 'admin'), deleteTimeSlot)

// Student routes
r.get('/instructor/:instructorId', getAvailableSlots)

export default r
