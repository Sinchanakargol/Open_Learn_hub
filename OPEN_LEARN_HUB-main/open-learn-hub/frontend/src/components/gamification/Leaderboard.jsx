import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/leaderboard')
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-500 to-orange-500'
    if (rank === 2) return 'from-slate-400 to-slate-500'
    if (rank === 3) return 'from-amber-600 to-amber-700'
    return 'from-slate-300 to-slate-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
          🏆 Leaderboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Top learners this month</p>
      </motion.div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
          <h2 className="text-2xl font-bold">Top Performers</h2>
          <p className="text-yellow-100">Compete with fellow learners and earn badges!</p>
        </div>

        <div className="p-6 space-y-4">
          {leaderboard.map((entry, idx) => (
            <motion.div
              key={entry._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-xl ${
                idx < 3 ? 'bg-gradient-to-r ' + getRankColor(idx + 1) + ' text-white' : 'bg-slate-50 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold w-12 text-center">
                  {getRankIcon(idx + 1)}
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg`}>
                  {entry.user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className={`font-bold ${idx < 3 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {entry.user?.name}
                  </h3>
                  <p className={`text-sm ${idx < 3 ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>
                    {entry.badges?.length || 0} badges earned
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${idx < 3 ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {entry.points || 0}
                </div>
                <p className={`text-sm ${idx < 3 ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>points</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
