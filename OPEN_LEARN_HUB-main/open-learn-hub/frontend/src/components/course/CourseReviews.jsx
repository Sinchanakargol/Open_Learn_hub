import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, ThumbsUp, Trash2, Edit2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../../services/api'

export default function CourseReviews({ courseId, isEnrolled }) {
  const { user } = useSelector(s => s.auth)
  const [reviews, setReviews] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [editingReview, setEditingReview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [courseId])

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/course/${courseId}`)
      setReviews(data)
      
      // Check if user has already reviewed
      const userReview = data.find(r => r.student?._id === user?.id)
      if (userReview) {
        setEditingReview(userReview)
        setRating(userReview.rating)
        setComment(userReview.comment || '')
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isEnrolled) {
      alert('You must be enrolled to review this course')
      return
    }

    try {
      await api.post('/reviews', {
        courseId,
        rating,
        comment: comment.trim()
      })
      
      setShowForm(false)
      setComment('')
      setRating(5)
      fetchReviews()
    } catch (error) {
      alert('Failed to submit review')
    }
  }

  const handleHelpful = async (reviewId) => {
    try {
      const { data } = await api.post(`/reviews/${reviewId}/helpful`)
      setReviews(reviews.map(r => 
        r._id === reviewId 
          ? { ...r, helpful: data.helpfulCount > (r.helpful?.length || 0) 
              ? [...(r.helpful || []), user.id] 
              : r.helpful.filter(id => id !== user.id) 
            }
          : r
      ))
    } catch (error) {
      console.error('Failed to mark helpful:', error)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!confirm('Delete your review?')) return
    
    try {
      await api.delete(`/reviews/${reviewId}`)
      fetchReviews()
      setEditingReview(null)
    } catch (error) {
      alert('Failed to delete review')
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 
      ? Math.round((reviews.filter(r => r.rating === stars).length / reviews.length) * 100)
      : 0
  }))

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Student Reviews
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-6xl font-bold text-slate-900 dark:text-white mb-2">
              {averageRating}
            </div>
            <div className="flex items-center justify-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i <= Math.round(averageRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-12">
                  {stars} star
                </span>
                <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {isEnrolled && !editingReview && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}

        {/* Edit Review Button */}
        {editingReview && (
          <div className="mt-6 flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-400">
              You've already reviewed this course
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(editingReview._id)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Review Form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        i <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this course..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {comment.length}/500 characters
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              {editingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </motion.form>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Star className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No reviews yet. Be the first to review this course!
            </p>
          </div>
        ) : (
          reviews.map((review, idx) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {review.student?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {review.student?.name || 'Anonymous'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {review.comment && (
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  {review.comment}
                </p>
              )}

              <button
                onClick={() => handleHelpful(review._id)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                  review.helpful?.includes(user?.id)
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>
                  Helpful ({review.helpful?.length || 0})
                </span>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
