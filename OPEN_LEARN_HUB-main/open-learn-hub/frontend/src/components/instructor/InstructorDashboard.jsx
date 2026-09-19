import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import CourseForm from './CourseForm'
import QuizBuilder from './QuizBuilder'

export default function InstructorDashboard() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [showQuizBuilder, setShowQuizBuilder] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    try {
      const { data } = await api.get('/courses/my-courses')
      setCourses(data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    try {
      await api.delete(`/courses/${courseId}`)
      setCourses(courses.filter(c => c._id !== courseId))
    } catch (error) {
      alert('Failed to delete course')
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingCourse(null)
    fetchMyCourses()
  }

  const handleManageQuizzes = (course) => {
    setSelectedCourse(course)
    // Show lesson selection or quiz builder
    if (course.lessons && course.lessons.length > 0) {
      // For now, open quiz builder for first lesson with hasQuiz
      const lessonWithQuiz = course.lessons.find(l => l.hasQuiz)
      if (lessonWithQuiz) {
        setSelectedLesson(lessonWithQuiz)
        setShowQuizBuilder(true)
      } else {
        alert('No lessons with quiz enabled. Please edit the course and enable quiz for lessons first.')
      }
    } else {
      alert('Please add lessons to this course first.')
    }
  }

  const handleQuizBuilderClose = () => {
    setShowQuizBuilder(false)
    setSelectedCourse(null)
    setSelectedLesson(null)
    fetchMyCourses()
  }

  const stats = [
    { label: 'My Courses', value: courses.length, icon: '📚', color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Students', value: courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0), icon: '👥', color: 'from-green-500 to-emerald-500' },
    { label: 'Avg Rating', value: '4.8', icon: '⭐', color: 'from-yellow-500 to-orange-500' },
    { label: 'Total Lessons', value: courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0), icon: '📖', color: 'from-purple-500 to-pink-500' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            Instructor Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Create and manage your courses</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-lg"
        >
          + Create New Course
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Course List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Courses</h2>
        
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No courses yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first course to get started!</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course, idx) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${
                    course.level === 'beginner' ? 'from-green-500 to-emerald-500' :
                    course.level === 'intermediate' ? 'from-yellow-500 to-orange-500' :
                    'from-red-500 to-pink-500'
                  } flex items-center justify-center text-3xl`}>
                    {course.level === 'beginner' ? '🌱' : course.level === 'intermediate' ? '🚀' : '⚡'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{course.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{course.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {course.lessons?.length || 0} lessons
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {course.enrolledCount || 0} students
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        course.level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {course.level}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleManageQuizzes(course)}
                    className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium flex items-center space-x-1"
                  >
                    <span>📝</span>
                    <span>Quizzes</span>
                  </button>
                  <button
                    onClick={() => handleEdit(course)}
                    className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="px-4 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          course={editingCourse}
          onClose={handleFormClose}
        />
      )}

      {/* Quiz Builder Modal */}
      {showQuizBuilder && selectedCourse && selectedLesson && (
        <QuizBuilder
          course={selectedCourse}
          lesson={selectedLesson}
          existingQuiz={selectedCourse.quizzes?.find(q => q.lessonId === selectedLesson._id)}
          onClose={handleQuizBuilderClose}
          onSave={handleQuizBuilderClose}
        />
      )}
    </div>
  )
}
