import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../services/api'

export default function MyConsultations() {
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingModal, setRatingModal] = useState(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    fetchConsultations()
  }, [])

  const fetchConsultations = async () => {
    try {
      const { data } = await api.get('/consultations/my-consultations')
      setConsultations(data)
    } catch (error) {
      console.error('Failed to fetch consultations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRateTeacher = async (consultationId) => {
    if (selectedRating === 0) {
      alert('Please select a rating')
      return
    }

    try {
      await api.patch(`/consultations/${consultationId}/status`, {
        rating: selectedRating,
        feedback
      })
      
      setRatingModal(null)
      setSelectedRating(0)
      setFeedback('')
      fetchConsultations()
      alert('Thank you for your feedback!')
    } catch (error) {
      console.error('Failed to submit rating:', error)
      alert('Failed to submit rating. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          My Consultations
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          View your consultation history and rate your teachers
        </p>
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Rate Your Teacher
            </h2>
            
            <div className="mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                How was your session with {ratingModal.instructor?.name}?
              </p>
              
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSelectedRating(star)}
                    className="text-4xl transition-all hover:scale-110"
                  >
                    {star <= selectedRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience (optional)"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleRateTeacher(ratingModal._id)}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Submit Rating
              </button>
              <button
                onClick={() => {
                  setRatingModal(null)
                  setSelectedRating(0)
                  setFeedback('')
                }}
                className="px-6 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {consultations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No consultations yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Book a session with a teacher to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation, idx) => (
            <motion.div
              key={consultation._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {user?.role === 'instructor' 
                      ? consultation.student?.name?.charAt(0)?.toUpperCase()
                      : consultation.instructor?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {user?.role === 'instructor' 
                        ? consultation.student?.name
                        : consultation.instructor?.name}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {new Date(consultation.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {user?.role === 'instructor' ? 'Earning' : 'Amount Paid'}
                        </p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          ₹{consultation.amount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        consultation.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        consultation.status === 'paid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {consultation.status}
                      </span>
                      
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {consultation.duration} minutes
                      </span>
                    </div>

                    {consultation.status === 'paid' && consultation.conversation && (
                      <button
                        onClick={() => navigate('/messages', { state: { conversationId: consultation.conversation } })}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        <span>💬</span>
                        <span>Open Chat</span>
                      </button>
                    )}

                    {consultation.rating && (
                      <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Your Rating: {consultation.rating}/5
                          </span>
                        </div>
                        {consultation.feedback && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                            "{consultation.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {consultation.status === 'completed' && !consultation.rating && (
                  <button
                    onClick={() => setRatingModal(consultation)}
                    className="ml-4 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Rate Teacher
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
