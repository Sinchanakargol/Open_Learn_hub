import Course from '../models/Course.js'

export async function list(req,res){
  try {
    const items = await Course.find().populate('instructor', 'name email').limit(50)
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses' })
  }
}

export async function getById(req,res){
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email')
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course' })
  }
}

export async function getMyCourses(req,res){
  try {
    const courses = await Course.find({ instructor: req.user.id })
    res.json(courses)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your courses' })
  }
}

export async function create(req,res){
  try {
    const course = await Course.create({ ...req.body, instructor: req.user.id })
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course' })
  }
}

export async function update(req,res){
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user.id },
      req.body,
      { new: true }
    )
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' })
    }
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course' })
  }
}

export async function remove(req,res){
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, instructor: req.user.id })
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' })
    }
    res.json({ message: 'Course deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course' })
  }
}

// Quiz Management
export async function createQuiz(req, res) {
  try {
    const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id })
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' })
    }

    course.quizzes.push(req.body)
    await course.save()
    
    res.json(course)
  } catch (error) {
    console.error('Failed to create quiz:', error)
    res.status(500).json({ message: 'Failed to create quiz' })
  }
}

export async function updateQuiz(req, res) {
  try {
    const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id })
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' })
    }

    const quizIndex = course.quizzes.findIndex(q => q._id.toString() === req.params.quizId)
    if (quizIndex === -1) {
      return res.status(404).json({ message: 'Quiz not found' })
    }

    course.quizzes[quizIndex] = { ...course.quizzes[quizIndex].toObject(), ...req.body }
    await course.save()
    
    res.json(course)
  } catch (error) {
    console.error('Failed to update quiz:', error)
    res.status(500).json({ message: 'Failed to update quiz' })
  }
}

export async function deleteQuiz(req, res) {
  try {
    const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id })
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' })
    }

    course.quizzes = course.quizzes.filter(q => q._id.toString() !== req.params.quizId)
    await course.save()
    
    res.json(course)
  } catch (error) {
    console.error('Failed to delete quiz:', error)
    res.status(500).json({ message: 'Failed to delete quiz' })
  }
}
