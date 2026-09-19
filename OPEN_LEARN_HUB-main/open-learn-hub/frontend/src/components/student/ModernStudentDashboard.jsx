import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../../services/api'
import MoodAnalyzer from './MoodAnalyzer'

export default function ModernStudentDashboard() {
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeOfDay, setTimeOfDay] = useState('morning')
  const [moodData, setMoodData] = useState(null)
  const [uiConfig, setUiConfig] = useState(null)

  useEffect(() => {
    fetchData()
    updateTimeOfDay()
  }, [])

  const updateTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('morning')
    else if (hour < 17) setTimeOfDay('afternoon')
    else setTimeOfDay('evening')
  }

  const fetchData = async () => {
    try {
      const [enrollRes] = await Promise.all([
        api.get('/enrollments/my-enrollments')
      ])
      setEnrollments(enrollRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMoodAnalyzed = (data) => {
    setMoodData(data)
    setUiConfig(data.ui_config)
  }

  // Calculate statistics
  const totalCourses = enrollments.length
  const completedCourses = enrollments.filter(e => e.progress === 100).length
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length
  const averageProgress = totalCourses > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalCourses)
    : 0

  // Mock data for charts
  const weeklyProgress = [
    { day: 'Mon', hours: 2.5, completed: 3 },
    { day: 'Tue', hours: 3.2, completed: 5 },
    { day: 'Wed', hours: 1.8, completed: 2 },
    { day: 'Thu', hours: 4.1, completed: 6 },
    { day: 'Fri', hours: 3.5, completed: 4 },
    { day: 'Sat', hours: 5.2, completed: 8 },
    { day: 'Sun', hours: 2.1, completed: 3 }
  ]

  const courseDistribution = [
    { name: 'Completed', value: completedCourses, color: '#10b981' },
    { name: 'In Progress', value: inProgressCourses, color: '#f59e0b' },
    { name: 'Not Started', value: totalCourses - completedCourses - inProgressCourses, color: '#6366f1' }
  ]

  const quickActions = [
    { title: 'AI Study Notes', icon: '🤖', path: '/study-materials', color: 'from-purple-500 to-pink-500', desc: 'Generate PDFs' },
    { title: 'AI Assistant', icon: '🧠', path: '/ai-assistant', color: 'from-blue-500 to-cyan-500', desc: 'Smart learning' },
    { title: 'Math Solver', icon: '✍️', path: '/math-solver', color: 'from-teal-500 to-emerald-500', desc: 'Draw & solve math' },
    { title: 'Study Groups', icon: '👥', path: '/study-groups', color: 'from-green-500 to-emerald-500', desc: 'Collaborate' },
    { title: 'CodeLab', icon: '💻', path: '/codelab', color: 'from-orange-500 to-red-500', desc: 'Practice coding' }
  ]

  const greetingEmoji = timeOfDay === 'morning' ? '🌅' : timeOfDay === 'afternoon' ? '☀️' : '🌙'
  const greetingText = `Good ${timeOfDay}, ${user?.name || 'Student'}!`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
                  <span>{greetingEmoji}</span>
                  <span>{greetingText}</span>
                </h1>
                <p className="text-indigo-100 text-lg">Ready to continue your learning journey?</p>
              </div>
              <div className="hidden md:block text-8xl opacity-20">🎓</div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>

        {/* Mood Analyzer with Q-Learning */}
        <MoodAnalyzer onMoodAnalyzed={handleMoodAnalyzed} />

        {/* AI-Powered Mood-based Message */}
        {moodData && uiConfig && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 p-6 shadow-xl border-2 border-purple-200 dark:border-purple-700"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-black/20"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-5xl">
                      {moodData.mood === 'motivated' && '🚀'}
                      {moodData.mood === 'positive' && '😊'}
                      {moodData.mood === 'neutral' && '😐'}
                      {moodData.mood === 'negative' && '😔'}
                      {moodData.mood === 'stressed' && '😰'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {uiConfig.message}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Mood: <span className="font-semibold capitalize text-purple-600 dark:text-purple-400">{moodData.mood}</span> • 
                        Sentiment: <span className="font-semibold capitalize text-indigo-600 dark:text-indigo-400">{moodData.sentiment.label}</span> 
                        <span className="text-slate-500"> ({(moodData.sentiment.polarity * 100).toFixed(0)}%)</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-semibold">
                  🤖 AI Q-Learning
                </div>
              </div>
              
              {/* Motivational Quote from Q-Learning */}
              {uiConfig.motivational_quote && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 p-5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-purple-200 dark:border-purple-700 shadow-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">💭</div>
                    <div className="flex-1">
                      <p className="text-base font-medium italic text-slate-800 dark:text-slate-200 leading-relaxed">
                        "{uiConfig.motivational_quote}"
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          — Personalized by AI Q-Learning based on your mood
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                          <span>🎯</span>
                          <span className="font-semibold">Action: {uiConfig.action.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Courses', value: totalCourses, icon: '📚', color: 'from-blue-500 to-cyan-500', change: '+2 this month' },
            { label: 'Completed', value: completedCourses, icon: '✅', color: 'from-green-500 to-emerald-500', change: `${completedCourses} finished` },
            { label: 'In Progress', value: inProgressCourses, icon: '⏳', color: 'from-orange-500 to-yellow-500', change: 'Keep going!' },
            { label: 'Avg Progress', value: `${averageProgress}%`, icon: '📊', color: 'from-purple-500 to-pink-500', change: `${averageProgress}% complete` }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {stat.icon}
                  </div>
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                </div>
                
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{stat.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-500">{stat.change}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <span>⚡</span>
            <span>Quick Actions</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">{action.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-white transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors mt-1">
                    {action.desc}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
              <span>📈</span>
              <span>Weekly Activity</span>
            </h3>
            
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyProgress}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff'
                  }} 
                />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Course Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
              <span>📊</span>
              <span>Course Overview</span>
            </h3>
            
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={courseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {courseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center space-x-4 mt-4">
              {courseDistribution.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.name}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">({item.value})</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* My Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>📚</span>
              <span>My Courses</span>
            </h2>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              View All
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-xl">
              <div className="text-7xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No courses yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Start your learning journey today!</p>
              <button
                onClick={() => navigate('/courses')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {enrollments.slice(0, 3).map((enrollment, idx) => (
                <motion.div
                  key={enrollment._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-5 hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {enrollment.course?.title || 'Course'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Last accessed: {new Date(enrollment.lastAccessed || enrollment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {enrollment.progress || 0}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Complete</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${enrollment.progress || 0}%` }}
                      transition={{ duration: 1, delay: 0.8 + idx * 0.1 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                    />
                  </div>
                  
                  <button
                    onClick={() => navigate(`/courses/${enrollment.course?._id}`)}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Continue Learning →
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}
