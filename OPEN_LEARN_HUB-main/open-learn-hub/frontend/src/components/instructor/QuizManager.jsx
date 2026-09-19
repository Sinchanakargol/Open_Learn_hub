import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import ManualQuizForm from './ManualQuizForm'
import AIQuizGenerator from './AIQuizGenerator'

export default function QuizManager() {
  const [quizzes, setQuizzes] = useState([])
  const [courses, setCourses] = useState([])
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [quizzesRes, coursesRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/courses/my-courses')
      ])
      setQuizzes(quizzesRes.data)
      setCourses(coursesRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return
    try {
      await api.delete(`/quizzes/${quizId}`)
      setQuizzes(quizzes.filter(q => q._id !== quizId))
    } catch (error) {
      alert('Failed to delete quiz')
    }
  }

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz)
    setShowManualForm(true)
  }

  const handleFormClose = () => {
    setShowManualForm(false)
    setShowAIGenerator(false)
    setEditingQuiz(null)
    fetchData()
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Quiz Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Create and manage quizzes for your courses</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIGenerator(true)}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg flex items-center space-x-2"
          >
            <span>✨</span>
            <span>AI Generate Quiz</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowManualForm(true)}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-lg"
          >
            + Create Manual Quiz
          </motion.button>
        </div>
      </motion.div>

      {/* Quiz List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Your Quizzes</h2>
        
        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No quizzes yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first quiz to test your students!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz, idx) => (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl">
                    📝
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{quiz.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{quiz.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {quiz.questions?.length || 0} questions
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Course: {quiz.course?.title || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(quiz)}
                    className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(quiz._id)}
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

      {/* Manual Quiz Form Modal */}
      {showManualForm && (
        <ManualQuizForm
          quiz={editingQuiz}
          courses={courses}
          onClose={handleFormClose}
        />
      )}

      {/* AI Quiz Generator Modal */}
      {showAIGenerator && (
        <AIQuizGenerator
          courses={courses}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
