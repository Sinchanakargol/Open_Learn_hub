import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

export default function BadgeDisplay() {
  const [badges, setBadges] = useState([])
  const [availableBadges, setAvailableBadges] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const [earned, available] = await Promise.all([
        api.get('/badges/my-badges'),
        api.get('/badges/available')
      ])
      setBadges(earned.data)
      setAvailableBadges(available.data)
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    } finally {
      setLoading(false)
    }
  }

  const earnedBadges = availableBadges.filter(b => b.earned)
  const lockedBadges = availableBadges.filter(b => !b.earned)
  const displayBadges = showAll ? availableBadges : earnedBadges.slice(0, 6)

  if (loading) {
    return <div className="animate-pulse h-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            🏆 Achievements
          </h2>
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-semibold">
            {earnedBadges.length} / {availableBadges.length}
          </span>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          {showAll ? 'Show Less' : 'View All'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {displayBadges.map((badge, idx) => (
            <motion.div
              key={badge.criteria}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  badge.earned
                    ? `bg-gradient-to-br ${badge.color} border-transparent shadow-lg`
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 opacity-50 grayscale'
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className={`text-xs font-semibold text-center ${
                  badge.earned ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {badge.name}
                </p>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                  {badge.description}
                  {!badge.earned && (
                    <div className="text-yellow-300 mt-1">🔒 Not earned yet</div>
                  )}
                </div>
              </div>

              {/* Shine effect for earned badges */}
              {badge.earned && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {showAll && lockedBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            💡 How to earn more badges:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            {lockedBadges.slice(0, 3).map(badge => (
              <li key={badge.criteria} className="flex items-start space-x-2">
                <span>{badge.icon}</span>
                <span>
                  <strong>{badge.name}:</strong> {badge.description}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
