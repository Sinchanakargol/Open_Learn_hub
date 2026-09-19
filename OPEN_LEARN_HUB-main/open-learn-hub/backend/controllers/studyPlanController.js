import axios from 'axios'

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

// Generate AI study plan
export async function generateStudyPlan(req, res) {
  const StudyPlan = (await import('../models/StudyPlan.js')).default
  const Course = (await import('../models/Course.js')).default
  try {
    const { goal, availableHours, targetDate, courseIds } = req.body
    
    // Get enrolled courses
    const courses = await Course.find({ _id: { $in: courseIds } })
    
    // Call AI to generate optimized study plan using dedicated endpoint
    const { data } = await axios.post(`${AI_URL}/generate-study-plan`, {
      goal,
      available_hours: availableHours,
      target_date: targetDate,
      courses: courses.map(c => c.title)
    })
    
    console.log('✅ AI generated study plan')
    
    // Use AI response data
    let planData = {
      title: data.plan?.title || `${goal} Study Plan`,
      goal,
      startDate: new Date(),
      endDate: new Date(targetDate),
      courses: courseIds.map(id => ({ course: id, hoursPerWeek: availableHours / courseIds.length })),
      schedule: data.plan?.schedule || [],
      milestones: data.plan?.milestones || [],
      tips: data.plan?.tips || [],
      isAiGenerated: true
    }
    
    const studyPlan = await StudyPlan.create({
      user: req.user.id,
      ...planData
    })
    
    res.status(201).json(studyPlan)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Create study plan manually
export async function createStudyPlan(req, res) {
  const StudyPlan = (await import('../models/StudyPlan.js')).default
  try {
    const studyPlan = await StudyPlan.create({
      user: req.user.id,
      ...req.body
    })
    
    res.status(201).json(studyPlan)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get my study plans
export async function getMyStudyPlans(req, res) {
  const StudyPlan = (await import('../models/StudyPlan.js')).default
  try {
    const { status } = req.query
    const query = { user: req.user.id }
    
    if (status) query.status = status
    
    const plans = await StudyPlan.find(query)
      .populate('courses.course', 'title instructor')
      .sort({ createdAt: -1 })
    
    res.json(plans)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update study plan
export async function updateStudyPlan(req, res) {
  const StudyPlan = (await import('../models/StudyPlan.js')).default
  try {
    const plan = await StudyPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('courses.course', 'title')
    
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' })
    }
    
    res.json(plan)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Mark milestone complete
export async function completeMilestone(req, res) {
  const StudyPlan = (await import('../models/StudyPlan.js')).default
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' })
    }
    
    const milestone = plan.milestones.id(req.params.milestoneId)
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' })
    }
    
    milestone.completed = true
    milestone.completedAt = new Date()
    
    // Update overall progress
    const completedMilestones = plan.milestones.filter(m => m.completed).length
    plan.progress = (completedMilestones / plan.milestones.length) * 100
    
    await plan.save()
    
    res.json(plan)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete study plan
export async function deleteStudyPlan(req, res) {
  const StudyPlan = (await import('../models/StudyPlan.js')).default
  try {
    const plan = await StudyPlan.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' })
    }
    
    res.json({ message: 'Study plan deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
