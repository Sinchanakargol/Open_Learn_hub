import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function BadgeNotification({ badges, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!badges || badges.length === 0) return

    // Auto-advance to next badge
    if (currentIndex < badges.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      // Close after showing last badge
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 500)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, badges, onClose])

  if (!badges || badges.length === 0 || !show) return null

  const currentBadge = badges[currentIndex]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShow(false)
            setTimeout(onClose, 500)
          }}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti background */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full"
                  initial={{ y: -20, x: Math.random() * 400, opacity: 1 }}
                  animate={{
                    y: 500,
                    rotate: 360,
                    opacity: 0
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-4"
              >
                <div className={`inline-block p-6 rounded-full bg-gradient-to-br ${currentBadge.color} shadow-2xl`}>
                  <span className="text-6xl">{currentBadge.icon}</span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-slate-900 dark:text-white mb-2"
              >
                🎉 Badge Unlocked!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2"
              >
                {currentBadge.name}
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-slate-600 dark:text-slate-400 mb-6"
              >
                {currentBadge.description}
              </motion.p>

              {badges.length > 1 && (
                <div className="flex justify-center space-x-2">
                  {badges.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex
                          ? 'bg-indigo-600 w-6'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setShow(false)
                  setTimeout(onClose, 500)
                }}
                className="mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Awesome!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
