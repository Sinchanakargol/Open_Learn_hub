import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  createJobPosting,
  getJobPostings,
  getJobPosting,
  applyForJob,
  getMyApplications,
  updateApplicationStatus,
  getJobApplicants,
  updateJobPosting,
  deleteJobPosting,
  getRecommendedJobs
} from '../controllers/jobPostingController.js'

const router = express.Router()

router.use(protect)

router.post('/', createJobPosting)
router.get('/', getJobPostings)
router.get('/recommended', getRecommendedJobs)
router.get('/my-applications', getMyApplications)
router.get('/:id', getJobPosting)
router.post('/:id/apply', applyForJob)
router.get('/:id/applicants', getJobApplicants)
router.put('/:id/applicants', updateApplicationStatus)
router.put('/:id', updateJobPosting)
router.delete('/:id', deleteJobPosting)

export default router
