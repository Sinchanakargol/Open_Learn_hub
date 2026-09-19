import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function EarningsDashboard() {
  const navigate = useNavigate()
  const [earnings, setEarnings] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarnings()
    fetchConsultations()
  }, [])

  const fetchEarnings = async () => {
    try {
      const { data } = await api.get('/consultations/instructor/earnings')
      setEarnings(data)
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConsultations = async () => {
    try {
      const { data } = await api.get('/consultations/instructor/consultations')
      setConsultations(data)
    } catch (error) {
      console.error('Failed to fetch consultations:', error)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/consultations/${id}/status`, { status })
      fetchConsultations()
      fetchEarnings()
    } catch (error) {
      console.error('Failed to update status:', error)
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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Consultation Earnings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track your consultation sessions and earnings
        </p>
      </div>

      {/* Earnings Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white"
        >
          <div className="text-4xl mb-2">💰</div>
          <div className="text-3xl font-bold mb-1">
            ₹{earnings?.totalEarnings || 0}
          </div>
          <div className="text-green-100">Total Earnings</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white"
        >
          <div className="text-4xl mb-2">👥</div>
          <div className="text-3xl font-bold mb-1">
            {earnings?.totalStudents || 0}
          </div>
          <div className="text-blue-100">Total Students</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white"
        >
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-3xl font-bold mb-1">
            {earnings?.rating ? earnings.rating.toFixed(1) : '0.0'}
          </div>
          <div className="text-yellow-100">
            Rating ({earnings?.totalRatings || 0} reviews)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white"
        >
          <div className="text-4xl mb-2">✅</div>
          <div className="text-3xl font-bold mb-1">
            {earnings?.completedCount || 0}
          </div>
          <div className="text-purple-100">Completed Sessions</div>
        </motion.div>
      </div>

      {/* Consultations List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          All Consultations
        </h2>

        {consultations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-slate-600 dark:text-slate-400">
              No consultations yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation, idx) => (
              <motion.div
                key={consultation._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {consultation.student?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {consultation.student?.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {consultation.student?.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {new Date(consultation.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {consultation.duration} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Amount</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          ₹{consultation.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          consultation.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          consultation.status === 'paid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          consultation.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {consultation.status}
                        </span>
                      </div>
                    </div>

                    {consultation.notes && (
                      <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notes:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {consultation.notes}
                        </p>
                      </div>
                    )}

                    {consultation.status === 'paid' && consultation.conversation && (
                      <div className="mt-3">
                        <button
                          onClick={() => navigate('/messages', { state: { conversationId: consultation.conversation } })}
                          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                        >
                          <span>💬</span>
                          <span>Open Chat</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {consultation.status === 'paid' && (
                    <button
                      onClick={() => handleStatusUpdate(consultation._id, 'completed')}
                      className="ml-4 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
