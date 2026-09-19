import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './components/course/CourseDetail'
import Quizzes from './pages/Quizzes'
import CodeLab from './pages/CodeLab'
import DiscussionForum from './components/discussion/DiscussionForum'
import Leaderboard from './components/gamification/Leaderboard'
import QuizManager from './components/instructor/QuizManager'
import GeminiChat from './components/support/GeminiChat'
import TalkToTeacherButton from './components/support/TalkToTeacherButton'
import TalkToTeacher from './pages/TalkToTeacher'
import MyConsultations from './pages/MyConsultations'
import Messages from './pages/Messages'
import EarningsDashboard from './components/instructor/EarningsDashboard'
import ConsultationSetup from './components/instructor/ConsultationSetup'
import TimeSlotManagement from './components/instructor/TimeSlotManagement'
import Certificates from './pages/Certificates'
import MathSolverPage from './pages/MathSolverPage'
import StudyMaterialsPage from './pages/StudyMaterialsPage'
import AIAssistantHub from './pages/AIAssistantHub'
import StudyGroupsPage from './pages/StudyGroupsPage'
import StudyGroupDetail from './pages/StudyGroupDetail'
import PerformanceAnalytics from './pages/PerformanceAnalytics'
import { useSelector, useDispatch } from 'react-redux'
import { logout, setCredentials } from './store'
import api from './services/api'

function ProtectedRoute({ children }) {
  const { token } = useSelector(s => s.auth)
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  const { user, token } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState('light')
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  
  // Restore authentication state from localStorage on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken && !token) {
        try {
          // Verify token and restore user data
          const { data } = await api.get('/auth/me')
          dispatch(setCredentials({ 
            user: data, 
            token: storedToken, 
            role: data.role 
          }))
        } catch (error) {
          // Token is invalid, clear it
          console.log('Invalid token, clearing...')
          localStorage.removeItem('token')
        }
      }
      setIsAuthLoading(false)
    }
    
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount
  
  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  const handleLogout = () => {
    dispatch(logout())
    localStorage.removeItem('token')
    navigate('/login')
  }

  const isAuthPage = ['/login', '/signup'].includes(location.pathname)

  // Show loading screen while restoring authentication
  if (isAuthLoading && !isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      {!isAuthPage && (
        <motion.nav 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Learnify</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                {token && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.name || 'User'}</span>
                  </div>
                )}
                <button 
                  onClick={() => setTheme(t => t==='light'?'dark':'light')} 
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                {token ? (
                  <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all">Logout</button>
                ) : (
                  <Link to="/login" className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all">Login</Link>
                )}
              </div>
            </div>
          </div>
        </motion.nav>
      )}
      
      {/* Oval Navigation - Show on all pages when logged in except auth pages */}
      {token && !isAuthPage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-16 z-40 bg-gradient-to-b from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 dark:to-transparent pb-4"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-3 py-4">
              {(user?.role === 'student' ? [
                { label: 'Dashboard', icon: '📊', path: '/dashboard' },
                { label: 'Courses', icon: '📚', path: '/courses' },
                { label: 'AI Study Notes', icon: '🤖', path: '/study-materials' },
                { label: 'AI Assistant', icon: '🧠', path: '/ai-assistant' },
                { label: 'Performance AI', icon: '🌲', path: '/performance' },
                { label: 'Study Groups', icon: '👥', path: '/study-groups' },
                { label: 'Certificates', icon: '🎓', path: '/certificates' },
                { label: 'Messages', icon: '💬', path: '/messages' },
                { label: 'Quizzes', icon: '📝', path: '/quizzes' },
                { label: 'Discussions', icon: '💭', path: '/discussions' },
                { label: 'CodeLab', icon: '💻', path: '/codelab' },
                { label: 'Leaderboard', icon: '🏆', path: '/leaderboard' },
                { label: 'Talk to Teacher', icon: '🎓', path: '/talk-to-teacher' }
              ] : user?.role === 'instructor' ? [
                { label: 'Dashboard', icon: '📊', path: '/dashboard' },
                { label: 'My Courses', icon: '📚', path: '/courses' },
                { label: 'Messages', icon: '💬', path: '/messages' },
                { label: 'Manage Quizzes', icon: '📝', path: '/quiz-manager' },
                { label: 'Time Slots', icon: '📅', path: '/time-slots' },
                { label: 'Earnings', icon: '💰', path: '/earnings' },
                { label: 'Profile Setup', icon: '⚙️', path: '/consultation-setup' },
                { label: 'Discussions', icon: '💭', path: '/discussions' }
              ] : []).map((item, idx) => {
                const isActive = location.pathname === item.path
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(item.path)}
                    className={`group relative px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </span>
                    {!isActive && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
      
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={isAuthPage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}
        >
          <Routes>
            <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
            <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
            <Route path="/codelab" element={<ProtectedRoute><CodeLab /></ProtectedRoute>} />
            <Route path="/quiz-manager" element={<ProtectedRoute><QuizManager /></ProtectedRoute>} />
            <Route path="/consultation-setup" element={<ProtectedRoute><ConsultationSetup /></ProtectedRoute>} />
            <Route path="/time-slots" element={<ProtectedRoute><TimeSlotManagement /></ProtectedRoute>} />
            <Route path="/talk-to-teacher" element={<ProtectedRoute><TalkToTeacher /></ProtectedRoute>} />
            <Route path="/my-consultations" element={<ProtectedRoute><MyConsultations /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute><EarningsDashboard /></ProtectedRoute>} />
            <Route path="/discussions" element={<ProtectedRoute><DiscussionForum /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/study-materials" element={<ProtectedRoute><StudyMaterialsPage /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistantHub /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><PerformanceAnalytics /></ProtectedRoute>} />
            <Route path="/study-groups" element={<ProtectedRoute><StudyGroupsPage /></ProtectedRoute>} />
            <Route path="/study-groups/:id" element={<ProtectedRoute><StudyGroupDetail /></ProtectedRoute>} />
            <Route path="/math-solver" element={<ProtectedRoute><MathSolverPage /></ProtectedRoute>} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      
      {/* Floating Support Buttons - Show only when logged in */}
      {token && !isAuthPage && (
        <>
          <TalkToTeacherButton />
          <GeminiChat />
        </>
      )}
    </div>
  )
}
