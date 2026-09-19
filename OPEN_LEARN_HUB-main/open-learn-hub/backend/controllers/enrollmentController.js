import Enrollment from '../models/Enrollment.js'
import Course from '../models/Course.js'
import User from '../models/User.js'
import Badge from '../models/Badge.js'
import axios from 'axios'

export async function enroll(req, res) {
  try {
    const { courseId } = req.body
    const userId = req.user?.id
    
    // Validate inputs
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' })
    }
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' })
    }
    
    // Check if already enrolled
    const existing = await Enrollment.findOne({ student: userId, course: courseId })
    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this course' })
    }
    
    const enrollment = await Enrollment.create({
      student: userId,
      course: courseId,
      progress: 0
    })
    
    res.json(enrollment)
  } catch (error) {
    console.error('Error enrolling in course:', error)
    
    // Handle duplicate key error more gracefully
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already enrolled in this course' })
    }
    
    res.status(500).json({ message: 'Failed to enroll', error: error.message })
  }
}

export async function getMyEnrollments(req, res) {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate('course')
      .sort({ createdAt: -1 })
    
    // Filter out enrollments with null courses (deleted courses)
    const validEnrollments = enrollments.filter(e => e.course != null)
    
    res.json(validEnrollments)
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    res.status(500).json({ message: 'Failed to fetch enrollments', error: error.message })
  }
}

export async function updateProgress(req, res) {
  try {
    const { id } = req.params
    const { progress } = req.body
    
    const enrollment = await Enrollment.findByIdAndUpdate(
      id,
      { progress, lastAccessed: new Date() },
      { new: true }
    )
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' })
    }
    
    // Check for badges if course completed
    let newBadges = []
    if (progress === 100) {
      try {
        // Trigger badge check via internal API call
        const token = req.headers.authorization
        const badgeResponse = await axios.post(
          `http://localhost:${process.env.PORT || 5000}/api/badges/check`,
          {},
          { headers: { Authorization: token } }
        )
        newBadges = badgeResponse.data.newBadges || []
      } catch (badgeError) {
        console.error('Badge check error:', badgeError.message)
        // Don't fail the request if badge check fails
      }
    }
    
    res.json({
      enrollment,
      newBadges: newBadges.length > 0 ? newBadges : undefined
    })
  } catch (error) {
    console.error('Error updating progress:', error)
    res.status(500).json({ message: 'Failed to update progress', error: error.message })
  }
}

export async function completeLesson(req, res) {
  try {
    const { courseId, lessonId } = req.body
    const userId = req.user.id
    
    const enrollment = await Enrollment.findOne({ student: userId, course: courseId })
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' })
    }
    
    // Add lesson to completed if not already there
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId)
      
      // Calculate progress based on completed lessons
      const course = await Course.findById(courseId)
      if (course && course.lessons.length > 0) {
        const totalLessons = course.lessons.length
        const completedCount = enrollment.completedLessons.length
        enrollment.progress = Math.round((completedCount / totalLessons) * 100)
      }
      
      enrollment.lastAccessed = new Date()
      await enrollment.save()
    }
    
    res.json(enrollment)
  } catch (error) {
    console.error('Error completing lesson:', error)
    res.status(500).json({ message: 'Failed to complete lesson', error: error.message })
  }
}

export async function submitQuizScore(req, res) {
  try {
    const { courseId, quizId, lessonId, answers } = req.body
    const userId = req.user.id
    
    const enrollment = await Enrollment.findOne({ student: userId, course: courseId })
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' })
    }
    
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    
    // Find the quiz
    const quiz = course.quizzes.find(q => q._id.toString() === quizId)
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' })
    }
    
    // Calculate score
    let correctAnswers = 0
    let totalPoints = 0
    
    quiz.questions.forEach((question, index) => {
      totalPoints += question.points
      if (answers[index] === question.correctAnswer) {
        correctAnswers += question.points
      }
    })
    
    const scorePercentage = (correctAnswers / totalPoints) * 100
    const passed = scorePercentage >= quiz.passingPercentage
    
    // Update or add quiz score
    const existingIndex = enrollment.quizScores.findIndex(qs => qs.quizId?.toString() === quizId)
    if (existingIndex >= 0) {
      enrollment.quizScores[existingIndex].score = scorePercentage
      enrollment.quizScores[existingIndex].totalPoints = correctAnswers
      enrollment.quizScores[existingIndex].passed = passed
      enrollment.quizScores[existingIndex].completedAt = new Date()
    } else {
      enrollment.quizScores.push({
        quizId,
        lessonId,
        score: scorePercentage,
        totalPoints: correctAnswers,
        passed,
        completedAt: new Date()
      })
    }
    
    // Award points if passed
    if (passed) {
      const pointsToAward = correctAnswers
      enrollment.pointsEarned += pointsToAward
      
      // Update user's total points
      await User.findByIdAndUpdate(userId, {
        $inc: { points: pointsToAward }
      })
    }
    
    // Check if all quizzes are passed and course is complete
    const allQuizzesPassed = course.quizzes.every(q => {
      const quizScore = enrollment.quizScores.find(qs => qs.quizId?.toString() === q._id.toString())
      return quizScore && quizScore.passed
    })
    
    if (allQuizzesPassed && !enrollment.completed) {
      enrollment.completed = true
      enrollment.completedAt = new Date()
      enrollment.pointsEarned += course.completionPoints
      
      // Award completion points
      await User.findByIdAndUpdate(userId, {
        $inc: { points: course.completionPoints }
      })
    }
    
    await enrollment.save()
    res.json({ 
      enrollment, 
      quizResult: {
        score: scorePercentage,
        passed,
        correctAnswers,
        totalPoints
      }
    })
  } catch (error) {
    console.error('Error submitting quiz score:', error)
    res.status(500).json({ message: 'Failed to submit quiz score', error: error.message })
  }
}
