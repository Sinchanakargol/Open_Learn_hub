import Review from '../models/Review.js'
import Course from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'

export async function createReview(req, res) {
  try {
    const { courseId, rating, comment } = req.body
    const studentId = req.user.id

    // Check if student is enrolled
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    })

    if (!enrollment) {
      return res.status(400).json({ message: 'You must be enrolled to review this course' })
    }

    // Check if review already exists
    const existing = await Review.findOne({
      course: courseId,
      student: studentId
    })

    if (existing) {
      // Update existing review
      existing.rating = rating
      existing.comment = comment
      await existing.save()
      await existing.populate('student', 'name')
      return res.json(existing)
    }

    // Create new review
    const review = await Review.create({
      course: courseId,
      student: studentId,
      rating,
      comment
    })

    await review.populate('student', 'name')

    // Update course average rating
    await updateCourseRating(courseId)

    res.status(201).json(review)
  } catch (error) {
    console.error('Create review error:', error)
    res.status(500).json({ message: 'Failed to create review' })
  }
}

export async function getCourseReviews(req, res) {
  try {
    const { courseId } = req.params

    const reviews = await Review.find({ course: courseId })
      .populate('student', 'name')
      .sort({ createdAt: -1 })

    res.json(reviews)
  } catch (error) {
    console.error('Get reviews error:', error)
    res.status(500).json({ message: 'Failed to fetch reviews' })
  }
}

export async function markHelpful(req, res) {
  try {
    const { reviewId } = req.params
    const userId = req.user.id

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    const index = review.helpful.indexOf(userId)
    if (index > -1) {
      review.helpful.splice(index, 1) // Remove if already marked
    } else {
      review.helpful.push(userId) // Add if not marked
    }

    await review.save()
    res.json({ helpfulCount: review.helpful.length })
  } catch (error) {
    console.error('Mark helpful error:', error)
    res.status(500).json({ message: 'Failed to update review' })
  }
}

export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params
    const userId = req.user.id

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    // Check if user owns the review or is admin
    if (review.student.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const courseId = review.course
    await review.deleteOne()

    // Update course rating
    await updateCourseRating(courseId)

    res.json({ message: 'Review deleted' })
  } catch (error) {
    console.error('Delete review error:', error)
    res.status(500).json({ message: 'Failed to delete review' })
  }
}

// Helper function to update course average rating
async function updateCourseRating(courseId) {
  const reviews = await Review.find({ course: courseId })
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  await Course.findByIdAndUpdate(courseId, {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: reviews.length
  })
}
