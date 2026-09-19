import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'
import MoodAnalyzer from './MoodAnalyzer'
import BadgeDisplay from './BadgeDisplay'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [badges, setBadges] = useState([])
  const [upcomingSlots, setUpcomingSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [moodData, setMoodData] = useState(null)
  const [uiConfig, setUiConfig] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [enrollRes, recsRes, consultRes] = await Promise.all([
        api.get('/enrollments/my-enrollments'),
        api.get('/ai/recommendations'),
        api.get('/consultations/my-consultations').catch(() => ({ data: [] }))
      ])
      setEnrollments(enrollRes.data)
      setRecommendations(recsRes.data.recommendations || [])
      
      // Get upcoming consultations
      const upcoming = consultRes.data
        .filter(c => c.status === 'paid' && new Date(c.scheduledAt) > new Date())
        .slice(0, 3)
      setUpcomingSlots(upcoming)
      
      // Mock badges based on progress
      const earnedBadges = []
      if (enrollRes.data.length >= 5) earnedBadges.push({ name: 'Fast Learner', icon: '🚀', color: 'from-blue-500 to-cyan-500' })
      if (enrollRes.data.filter(e => e.progress === 100).length >= 3) earnedBadges.push({ name: 'Course Completer', icon: '🏆', color: 'from-yellow-500 to-orange-500' })
      if (enrollRes.data.some(e => e.quizScore >= 90)) earnedBadges.push({ name: 'Quiz Master', icon: '⭐', color: 'from-purple-500 to-pink-500' })
      setBadges(earnedBadges)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const progressData = [
    { week: 'Week 1', hours: 5 },
    { week: 'Week 2', hours: 8 },
    { week: 'Week 3', hours: 12 },
    { week: 'Week 4', hours: 15 }
  ]

  const handleMoodAnalyzed = (data) => {
    setMoodData(data)
    setUiConfig(data.ui_config)
  }

  // Get colors from UI config or use defaults
  const getColor = (type) => {
    if (uiConfig?.colors) {
      return uiConfig.colors[type]
    }
    const defaults = {
      primary: 'from-indigo-600 to-purple-600',
      secondary: 'from-purple-500 to-pink-500',
      background: 'from-indigo-50 to-purple-50'
    }
    return defaults[type]
  }

  // Get animation class based on UI config
  const getAnimation = () => {
    if (!uiConfig) return ''
    switch (uiConfig.animation) {
      case 'bounce':
        return 'animate-bounce'
      case 'wiggle':
        return 'hover:animate-pulse'
      case 'smooth':
        return 'transition-all duration-500'
      default:
        return 'transition-all duration-300'
    }
  }

  // Get card styling based on mood
  const getCardStyle = () => {
    if (!uiConfig) return 'bg-white dark:bg-slate-800'
    if (uiConfig.theme === 'dark') {
      return 'bg-slate-800 dark:bg-slate-900'
    }
    return 'bg-white dark:bg-slate-800'
  }

  // Get border color based on mood
  const getBorderColor = () => {
    if (!uiConfig) return 'border-slate-200 dark:border-slate-700'
    if (moodData?.mood === 'motivated') return 'border-yellow-300 dark:border-yellow-700'
    if (moodData?.mood === 'positive') return 'border-green-300 dark:border-green-700'
    if (moodData?.mood === 'stressed') return 'border-red-300 dark:border-red-700'
    if (moodData?.mood === 'negative') return 'border-purple-300 dark:border-purple-700'
    return 'border-blue-300 dark:border-blue-700'
  }

  const stats = [
    { label: 'Enrolled Courses', value: enrollments.length, icon: '📚', color: uiConfig ? getColor('primary') : 'from-blue-500 to-cyan-500' },
    { label: 'Completed', value: enrollments.filter(e => e.progress === 100).length, icon: '✅', color: 'from-green-500 to-emerald-500' },
    { label: 'In Progress', value: enrollments.filter(e => e.progress > 0 && e.progress < 100).length, icon: '⏳', color: uiConfig ? getColor('secondary') : 'from-yellow-500 to-orange-500' },
    { label: 'Badges Earned', value: badges.length, icon: '🏆', color: uiConfig ? getColor('primary') : 'from-purple-500 to-pink-500' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      key={moodData?.mood || 'default'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Mood Analyzer */}
      <MoodAnalyzer onMoodAnalyzed={handleMoodAnalyzed} />

      {/* Mood-based Message */}
      {moodData && uiConfig && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-r ${getColor('background')} rounded-2xl p-6 border ${getBorderColor()} shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className={`text-lg font-bold mb-1 ${uiConfig?.theme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {uiConfig.message}
              </p>
              <p className={`text-sm ${uiConfig?.theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                Mood: <span className="font-semibold capitalize">{moodData.mood}</span> • 
                Sentiment: <span className="font-semibold capitalize">{moodData.sentiment.label}</span> ({(moodData.sentiment.polarity * 100).toFixed(0)}%)
              </p>
            </div>
            <div className="text-5xl">
              {moodData.mood === 'motivated' && '🚀'}
              {moodData.mood === 'positive' && '😊'}
              {moodData.mood === 'neutral' && '😐'}
              {moodData.mood === 'negative' && '😔'}
              {moodData.mood === 'stressed' && '😰'}
            </div>
          </div>
          
          {/* Motivational Quote */}
          {uiConfig.motivational_quote && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`mt-4 p-4 rounded-xl ${uiConfig?.theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/50'} border ${getBorderColor()}`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">💭</div>
                <div className="flex-1">
                  <p className={`text-sm font-medium italic ${uiConfig?.theme === 'dark' ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'}`}>
                    "{uiConfig.motivational_quote}"
                  </p>
                  <p className={`text-xs mt-2 ${uiConfig?.theme === 'dark' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    — Personalized by AI based on your mood
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4, scale: uiConfig?.animation === 'bounce' ? 1.05 : 1 }}
            className={`${getCardStyle()} rounded-2xl p-6 border ${getBorderColor()} shadow-sm hover:shadow-lg ${getAnimation()}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-md`}>
                {stat.icon}
              </div>
              <span className={`text-3xl font-bold ${uiConfig?.theme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {stat.value}
              </span>
            </div>
            <p className={`font-medium ${uiConfig?.theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Progress Chart & Badges */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`lg:col-span-2 ${getCardStyle()} rounded-2xl p-6 border ${getBorderColor()} ${getAnimation()}`}
        >
          <h2 className={`text-xl font-bold mb-4 ${uiConfig?.theme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            Learning Progress
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

      </div>

      {/* Badge Display */}
      <BadgeDisplay />

      {/* My Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${getCardStyle()} rounded-2xl p-6 border ${getBorderColor()} ${getAnimation()}`}
      >
        <h2 className={`text-2xl font-bold mb-6 ${uiConfig?.theme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          My Courses
        </h2>
        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No enrollments yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Start learning by enrolling in a course!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment, idx) => (
              <motion.div
                key={enrollment._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: uiConfig?.animation === 'wiggle' ? 1.02 : 1 }}
                className={`p-4 rounded-xl ${uiConfig?.theme === 'dark' ? 'bg-slate-900/70' : 'bg-slate-50 dark:bg-slate-900/50'} hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border ${getBorderColor()}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-bold ${uiConfig?.theme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {enrollment.course?.title || 'Course'}
                  </h3>
                  <span className={`text-sm font-semibold bg-gradient-to-r ${getColor('primary')} bg-clip-text text-transparent`}>
                    {enrollment.progress || 0}% Complete
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 mb-3 ${uiConfig?.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${enrollment.progress || 0}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className={`bg-gradient-to-r ${getColor('primary')} h-2 rounded-full`}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${uiConfig?.theme === 'dark' ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    Last accessed: {new Date(enrollment.lastAccessed || enrollment.createdAt).toLocaleDateString()}
                  </span>
                  <button className={`font-semibold hover:underline bg-gradient-to-r ${getColor('secondary')} bg-clip-text text-transparent`}>
                    Continue Learning →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* CodeLab Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: uiConfig?.animation === 'bounce' ? 1.02 : 1 }}
        className={`bg-gradient-to-r ${getColor('background')} rounded-2xl p-6 border ${getBorderColor()} ${getAnimation()}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${uiConfig?.theme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              💻 Practice Coding
            </h2>
            <p className={`mb-4 ${uiConfig?.theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
              Write and execute code in Python, Java, or JavaScript in our interactive CodeLab
            </p>
            <button
              onClick={() => navigate('/codelab')}
              className={`px-6 py-3 rounded-lg bg-gradient-to-r ${getColor('primary')} text-white font-semibold hover:shadow-lg transition-all`}
            >
              Open CodeLab →
            </button>
          </div>
          <div className="hidden md:block text-8xl">👨‍💻</div>
        </div>
      </motion.div>

    </motion.div>
  )
}
