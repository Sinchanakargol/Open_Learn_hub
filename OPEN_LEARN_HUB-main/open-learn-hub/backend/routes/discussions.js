import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { list, create, addReply } from '../controllers/discussionController.js'

const r = Router()

r.use(auth)

r.get('/', list)
r.post('/', create)
r.post('/:id/reply', addReply)

export default r
