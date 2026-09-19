import axios from 'axios'

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

// Generate AI learning path
export async function generateLearningPath(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  const Course = (await import('../models/Course.js')).default
  try {
    const { goal, targetRole, currentLevel, availableCourses } = req.body
    
    // Get courses
    const courses = await Course.find({ _id: { $in: availableCourses } })
    
    // Call AI to generate learning path
    const prompt = `Create a personalized learning path for:
- Goal: ${goal}
- Target Role: ${targetRole}
- Current Level: ${currentLevel}
- Available Courses: ${courses.map(c => `${c.title} (${c.category})`).join(', ')}

Generate an optimal learning sequence with milestones. Return as JSON:
{
  "title": "Path Name",
  "description": "Path description",
  "steps": [{"order": 1, "title": "Step title", "type": "course", "estimatedHours": 20}],
  "skills": [{"name": "Skill name", "currentProficiency": 20, "targetProficiency": 80}],
  "milestones": [{"title": "Milestone", "requiredSteps": [1,2]}]
}`
    
    const { data } = await axios.post(`${AI_URL}/chat`, { message: prompt })
    
    // Parse AI response
    let pathData = {
      title: `${targetRole} Learning Path`,
      description: `Personalized path to become ${targetRole}`,
      goal,
      targetRole,
      currentLevel,
      targetLevel: 'advanced',
      isAiGenerated: true,
      startedAt: new Date()
    }
    
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        pathData = { ...pathData, ...parsed }
      }
    } catch (parseError) {
      // Use default if parsing fails
      pathData.steps = courses.map((c, i) => ({
        order: i + 1,
        title: `Complete ${c.title}`,
        type: 'course',
        course: c._id,
        estimatedHours: 20
      }))
    }
    
    const learningPath = await LearningPath.create({
      user: req.user.id,
      ...pathData
    })
    
    await learningPath.populate('steps.course', 'title category')
    
    res.status(201).json(learningPath)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Create learning path manually
export async function createLearningPath(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  try {
    const learningPath = await LearningPath.create({
      user: req.user.id,
      ...req.body
    })
    
    await learningPath.populate('steps.course', 'title category')
    
    res.status(201).json(learningPath)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get my learning paths
export async function getMyLearningPaths(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  try {
    const paths = await LearningPath.find({ user: req.user.id })
      .populate('steps.course', 'title category instructor')
      .sort({ createdAt: -1 })
    
    res.json(paths)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get public learning paths
export async function getPublicLearningPaths(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  try {
    const { goal, search } = req.query
    const query = { isPublic: true }
    
    if (goal) query.goal = goal
    if (search) query.title = { $regex: search, $options: 'i' }
    
    const paths = await LearningPath.find(query)
      .populate('user', 'name')
      .populate('steps.course', 'title category')
      .select('-steps.completed -steps.completedAt')
      .sort({ createdAt: -1 })
    
    res.json(paths)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get learning path by ID
export async function getLearningPath(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  try {
    const path = await LearningPath.findById(req.params.id)
      .populate('steps.course', 'title category instructor duration')
      .populate('user', 'name')
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' })
    }
    
    // Check access for private paths
    if (!path.isPublic && path.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }
    
    res.json(path)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Enroll in learning path
export async function enrollInLearningPath(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  try {
    const path = await LearningPath.findById(req.params.id)
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' })
    }
    
    if (!path.enrolledUsers.includes(req.user.id)) {
      path.enrolledUsers.push(req.user.id)
      await path.save()
    }
    
    // Create a copy for the user
    const userPath = await LearningPath.create({
      user: req.user.id,
      title: path.title,
      description: path.description,
      goal: path.goal,
      targetRole: path.targetRole,
      currentLevel: req.body.currentLevel || 'beginner',
      targetLevel: path.targetLevel,
      steps: path.steps.map(step => ({ ...step.toObject(), completed: false })),
      skills: path.skills,
      milestones: path.milestones.map(m => ({ ...m.toObject(), completed: false })),
      startedAt: new Date()
    })
    
    res.json(userPath)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Complete step in learning path
export async function completeStep(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  try {
    const path = await LearningPath.findOne({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' })
    }
    
    const step = path.steps.find(s => s._id.toString() === req.params.stepId)
    if (!step) {
      return res.status(404).json({ message: 'Step not found' })
    }
    
    step.completed = true
    step.completedAt = new Date()
    
    // Update progress
    const completedSteps = path.steps.filter(s => s.completed).length
    path.progress = (completedSteps / path.steps.length) * 100
    
    // Check if path is complete
    if (path.progress === 100) {
      path.completedAt = new Date()
    }
    
    await path.save()
    
    res.json(path)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Update learning path
export async function updateLearningPath(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  try {
    const path = await LearningPath.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('steps.course', 'title category')
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' })
    }
    
    res.json(path)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete learning path
export async function deleteLearningPath(req, res) {
  const LearningPath = (await import('../models/LearningPath.js')).default
  try {
    const path = await LearningPath.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' })
    }
    
    res.json({ message: 'Learning path deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
