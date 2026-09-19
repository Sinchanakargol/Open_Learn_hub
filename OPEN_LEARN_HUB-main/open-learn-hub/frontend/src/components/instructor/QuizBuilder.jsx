import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

export default function QuizBuilder({ course, lesson, existingQuiz, onClose, onSave }) {
  const [quiz, setQuiz] = useState(existingQuiz || {
    lessonId: lesson._id,
    passingPercentage: 70,
    questions: [],
    totalPoints: 0
  })
  const [generating, setGenerating] = useState(false)

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          points: 10
        }
      ]
    })
  }

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...quiz.questions]
    newQuestions[index][field] = value
    setQuiz({ ...quiz, questions: newQuestions })
  }

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...quiz.questions]
    newQuestions[questionIndex].options[optionIndex] = value
    setQuiz({ ...quiz, questions: newQuestions })
  }

  const removeQuestion = (index) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== index)
    })
  }

  const calculateTotalPoints = () => {
    return quiz.questions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0)
  }

  const handleGenerateWithAI = async () => {
    setGenerating(true)
    try {
      const { data } = await api.post('/ai/generate-quiz', {
        courseTitle: course.title,
        lessonTitle: lesson.title,
        lessonContent: lesson.content,
        numberOfQuestions: 5
      })

      setQuiz({
        ...quiz,
        questions: data.questions.map(q => ({
          ...q,
          points: 10
        }))
      })
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      alert('Failed to generate quiz with AI. Please try again or create manually.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    // Validate
    if (quiz.questions.length === 0) {
      alert('Please add at least one question')
      return
    }

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i]
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is empty`)
        return
      }
      if (q.options.some(opt => !opt.trim())) {
        alert(`Question ${i + 1} has empty options`)
        return
      }
    }

    const totalPoints = calculateTotalPoints()
    const quizData = { ...quiz, totalPoints }

    try {
      if (existingQuiz) {
        await api.put(`/courses/${course._id}/quizzes/${existingQuiz._id}`, quizData)
      } else {
        await api.post(`/courses/${course._id}/quizzes`, quizData)
      }
      onSave()
    } catch (error) {
      console.error('Failed to save quiz:', error)
      alert('Failed to save quiz')
    }
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
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {existingQuiz ? 'Edit Quiz' : 'Create Quiz'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  For lesson: {lesson.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* AI Generate Button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerateWithAI}
                disabled={generating}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                <span>✨</span>
                <span>{generating ? 'Generating...' : 'Generate with AI'}</span>
              </button>
              <button
                onClick={addQuestion}
                className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors font-medium"
              >
                + Add Question Manually
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Quiz Settings */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Passing Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quiz.passingPercentage}
                  onChange={(e) => setQuiz({ ...quiz, passingPercentage: parseInt(e.target.value) || 70 })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Total Points
                </label>
                <div className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-semibold">
                  {calculateTotalPoints()} points
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {quiz.questions.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">No questions yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Generate questions with AI or add them manually
                  </p>
                </div>
              ) : (
                quiz.questions.map((question, qIndex) => (
                  <motion.div
                    key={qIndex}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-3"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Question {qIndex + 1}
                      </span>
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Question Text */}
                    <textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      placeholder="Enter your question"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                    />

                    {/* Options */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Options (select correct answer)
                      </label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Points */}
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Points:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 10)}
                        className="w-20 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={quiz.questions.length === 0}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Quiz
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
