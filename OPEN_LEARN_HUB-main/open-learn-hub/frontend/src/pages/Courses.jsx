import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Search, Filter, Star, Users, Clock, BookOpen } from 'lucide-react'
import api from '../services/api'

export default function Courses(){
  const navigate = useNavigate()
  const { user, role } = useSelector(s => s.auth)
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/enrollments/my-enrollments').catch(() => ({ data: [] }))
      ])
      setCourses(coursesRes.data)
      setEnrollments(enrollmentsRes.data)
    } catch(e) {
      console.error('Failed to fetch courses', e)
    } finally {
      setLoading(false)
    }
  }

  const levelColors = {
    beginner: 'from-green-500 to-emerald-500',
    intermediate: 'from-yellow-500 to-orange-500',
    advanced: 'from-red-500 to-pink-500'
  }

  const levelIcons = {
    beginner: '🌱',
    intermediate: '🚀',
    advanced: '⚡'
  }

  // Get enrollment for a course
  const getEnrollment = (courseId) => {
    return enrollments.find(e => e.course?._id === courseId)
  }

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel
    return matchesSearch && matchesCategory && matchesLevel
  })

  // Get unique categories and count
  const categories = ['all', ...new Set(courses.map(c => c.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Search */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Explore Courses
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Discover your next learning adventure • {filteredCourses.length} courses available
            </p>
          </div>
          {(role === 'instructor' || role === 'admin') && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-lg flex items-center space-x-2"
            >
              <span>+</span>
              <span>Create Course</span>
            </motion.button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all ${
              showFilters
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {(filterCategory !== 'all' || filterLevel !== 'all') && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {(filterCategory !== 'all' ? 1 : 0) + (filterLevel !== 'all' ? 1 : 0)}
              </span>
            )}
          </motion.button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        filterCategory === cat
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Difficulty Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
                    <button
                      key={level}
                      onClick={() => setFilterLevel(level)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        filterLevel === level
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(filterCategory !== 'all' || filterLevel !== 'all') && (
              <button
                onClick={() => {
                  setFilterCategory('all')
                  setFilterLevel('all')
                }}
                className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* No Results */}
      {courses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
        >
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No courses yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Be the first to create a course!</p>
        </motion.div>
      ) : filteredCourses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No courses found</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterCategory('all')
              setFilterLevel('all')
            }}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold"
          >
            Clear All
          </button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, idx) => {
            const enrollment = getEnrollment(course._id)
            const isEnrolled = !!enrollment
            const progress = enrollment?.progress || 0

            return (
              <motion.div
                key={course._id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer group relative"
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                {/* Enrollment Badge */}
                {isEnrolled && (
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-lg">
                    <span>✓</span>
                    <span>Enrolled</span>
                  </div>
                )}

                {/* Course Header */}
                <div className={`h-32 bg-gradient-to-br ${levelColors[course.level || 'beginner']} flex items-center justify-center text-6xl relative`}>
                  {levelIcons[course.level || 'beginner']}
                  {isEnrolled && progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${levelColors[course.level || 'beginner']} text-white`}>
                      {course.level || 'beginner'}
                    </span>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{course.lessons?.length || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0)}m</span>
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                    {course.description || 'No description available'}
                  </p>

                  {/* Progress Bar (for enrolled courses) */}
                  {isEnrolled && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-600 dark:text-slate-400">Your Progress</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {course.instructor?.name?.charAt(0)?.toUpperCase() || 'I'}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{course.instructor?.name || 'Instructor'}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/courses/${course._id}`)
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        isEnrolled
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                          : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                      }`}
                    >
                      {isEnrolled ? 'Continue →' : 'View →'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
