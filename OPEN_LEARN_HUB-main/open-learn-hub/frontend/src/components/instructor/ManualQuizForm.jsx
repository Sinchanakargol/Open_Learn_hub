import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

export default function ManualQuizForm({ quiz, courses, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    questions: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (quiz) {
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        course: quiz.course?._id || '',
        questions: quiz.questions || []
      })
    }
  }, [quiz])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (quiz) {
        await api.put(`/quizzes/${quiz._id}`, formData)
      } else {
        await api.post('/quizzes', formData)
      }
      onClose()
    } catch (error) {
      alert('Failed to save quiz')
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { 
        question: '', 
        options: ['', '', '', ''], 
        correctAnswer: '' 
      }]
    })
  }

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions]
    newQuestions[index][field] = value
    setFormData({ ...formData, questions: newQuestions })
  }

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions]
    newQuestions[qIndex].options[oIndex] = value
    setFormData({ ...formData, questions: newQuestions })
  }

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {quiz ? 'Edit Quiz' : 'Create Manual Quiz'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., React Fundamentals Quiz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Describe what this quiz covers..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Course *
              </label>
              <select
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Questions
                </label>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium text-sm"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-4">
                {formData.questions.map((question, qIdx) => (
                  <motion.div
                    key={qIdx}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Question {qIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                        placeholder="Enter question"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                      <div className="space-y-2">
                        <label className="text-xs text-slate-600 dark:text-slate-400">Options:</label>
                        {question.options.map((option, oIdx) => (
                          <input
                            key={oIdx}
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          />
                        ))}
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Correct Answer:</label>
                        <select
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        >
                          <option value="">Select correct answer</option>
                          {question.options.map((option, oIdx) => (
                            <option key={oIdx} value={option}>{option || `Option ${oIdx + 1}`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : quiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
