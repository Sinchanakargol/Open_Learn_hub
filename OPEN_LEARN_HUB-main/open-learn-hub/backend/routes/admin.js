import { Router } from 'express'
import { auth, permit } from '../middleware/auth.js'
import { getStats, getUsers, deleteUser, updateUserRole } from '../controllers/adminController.js'

const r = Router()

r.use(auth, permit('admin'))

r.get('/stats', getStats)
r.get('/users', getUsers)
r.delete('/users/:id', deleteUser)
r.patch('/users/:id', updateUserRole)

export default r
