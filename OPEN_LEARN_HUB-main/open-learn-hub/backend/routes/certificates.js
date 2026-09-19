import { Router } from 'express'
import { generateCertificate, getMyCertificates, getCertificateById } from '../controllers/certificateController.js'
import { auth } from '../middleware/auth.js'

const r = Router()

r.post('/generate', auth, generateCertificate)
r.get('/my-certificates', auth, getMyCertificates)
r.get('/:certificateId', getCertificateById) // Public route for certificate verification

export default r
