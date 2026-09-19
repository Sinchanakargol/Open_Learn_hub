import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function TalkToTeacherButton() {
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const [showMenu, setShowMenu] = useState(false)

  // Only show for students
  if (user?.role !== 'student') {
    return null
  }

  return (
    <>
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Consultations"
      >
        <span className="text-2xl">👨‍🏫</span>
        
        {/* Tooltip */}
        {!showMenu && (
          <div className="absolute bottom-16 right-0 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Consultations
            <div className="absolute -bottom-1 right-6 w-2 h-2 bg-slate-900 transform rotate-45"></div>
          </div>
        )}
      </motion.button>

      {/* Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 right-24 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
          >
            <button
              onClick={() => {
                navigate('/talk-to-teacher')
                setShowMenu(false)
              }}
              className="w-full px-6 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center space-x-3"
            >
              <span className="text-xl">📅</span>
              <span className="font-semibold text-slate-900 dark:text-white">Book Session</span>
            </button>
            <button
              onClick={() => {
                navigate('/my-consultations')
                setShowMenu(false)
              }}
              className="w-full px-6 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center space-x-3 border-t border-slate-200 dark:border-slate-700"
            >
              <span className="text-xl">📋</span>
              <span className="font-semibold text-slate-900 dark:text-white">My Consultations</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
