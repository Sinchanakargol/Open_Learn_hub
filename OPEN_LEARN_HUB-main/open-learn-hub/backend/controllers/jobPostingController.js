// Create job posting
export async function createJobPosting(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const job = await JobPosting.create({
      ...req.body,
      postedBy: req.user.id
    })
    
    await job.populate('relatedCourses', 'title')
    
    res.status(201).json(job)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get all job postings
export async function getJobPostings(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const { jobType, location, isRemote, skills, search } = req.query
    const query = { isActive: true, expiresAt: { $gt: new Date() } }
    
    if (jobType) query.jobType = jobType
    if (location) query.location = { $regex: location, $options: 'i' }
    if (isRemote) query.isRemote = isRemote === 'true'
    if (skills) query.requiredSkills = { $in: skills.split(',') }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    const jobs = await JobPosting.find(query)
      .populate('relatedCourses', 'title')
      .populate('postedBy', 'name')
      .select('-applicants')
      .sort({ featured: -1, createdAt: -1 })
      .limit(50)
    
    res.json(jobs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get job by ID
export async function getJobPosting(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const job = await JobPosting.findById(req.params.id)
      .populate('relatedCourses', 'title instructor')
      .populate('postedBy', 'name email')
    
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' })
    }
    
    // Increment views
    job.views++
    await job.save()
    
    res.json(job)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Apply for job
export async function applyForJob(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const { resume, coverLetter } = req.body
    const job = await JobPosting.findById(req.params.id)
    
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' })
    }
    
    // Check if already applied
    const hasApplied = job.applicants.some(a => a.user.toString() === req.user.id.toString())
    if (hasApplied) {
      return res.status(400).json({ message: 'Already applied to this job' })
    }
    
    job.applicants.push({
      user: req.user.id,
      resume,
      coverLetter,
      appliedAt: new Date(),
      status: 'pending'
    })
    
    await job.save()
    
    res.json({ message: 'Application submitted successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get my applications
export async function getMyApplications(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const jobs = await JobPosting.find({
      'applicants.user': req.user.id
    })
      .populate('relatedCourses', 'title')
      .select('title company jobType location isRemote applicants salaryRange')
    
    const applications = jobs.map(job => {
      const application = job.applicants.find(a => a.user.toString() === req.user.id.toString())
      return {
        _id: job._id,
        title: job.title,
        company: job.company,
        jobType: job.jobType,
        location: job.location,
        isRemote: job.isRemote,
        salaryRange: job.salaryRange,
        applicationStatus: application.status,
        appliedAt: application.appliedAt
      }
    })
    
    res.json(applications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update application status (for job posters)
export async function updateApplicationStatus(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const { applicantId, status } = req.body
    const job = await JobPosting.findOne({
      _id: req.params.id,
      postedBy: req.user.id
    })
    
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found or access denied' })
    }
    
    const applicant = job.applicants.id(applicantId)
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' })
    }
    
    applicant.status = status
    await job.save()
    
    res.json({ message: 'Application status updated' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get applicants for my job postings
export async function getJobApplicants(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const job = await JobPosting.findOne({
      _id: req.params.id,
      postedBy: req.user.id
    }).populate('applicants.user', 'name email')
    
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found or access denied' })
    }
    
    res.json(job.applicants)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update job posting
export async function updateJobPosting(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const job = await JobPosting.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('relatedCourses', 'title')
    
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found or access denied' })
    }
    
    res.json(job)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete job posting
export async function deleteJobPosting(req, res) {
  const JobPosting = (await import('../models/JobPosting.js')).default
  try {
    const job = await JobPosting.findOneAndDelete({
      _id: req.params.id,
      postedBy: req.user.id
    })
    
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found or access denied' })
    }
    
    res.json({ message: 'Job posting deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get recommended jobs based on completed courses
export async function getRecommendedJobs(req, res) {
  try {
    const JobPosting = (await import('../models/JobPosting.js')).default
    const Enrollment = (await import('../models/Enrollment.js')).default
    
    // Get user's completed courses
    const enrollments = await Enrollment.find({
      student: req.user.id,
      progress: 100
    }).populate('course', 'category title')
    
    const completedCourseIds = enrollments.map(e => e.course._id)
    const skills = enrollments.map(e => e.course.title.split(' ')).flat()
    
    // Find jobs related to completed courses
    const jobs = await JobPosting.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
      $or: [
        { relatedCourses: { $in: completedCourseIds } },
        { requiredSkills: { $in: skills } }
      ]
    })
      .populate('relatedCourses', 'title')
      .select('-applicants')
      .limit(10)
      .sort({ featured: -1, createdAt: -1 })
    
    res.json(jobs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
