import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

export default function AIQuizGenerator({ courses, onClose }) {
  const [formData, setFormData] = useState({
    course: '',
    topic: '',
    difficulty: 'medium',
    numQuestions: 5
  })
  const [generating, setGenerating] = useState(false)
  const [generatedQuiz, setGeneratedQuiz] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      // Call Gemini AI to generate quiz
      const { data } = await api.post('/ai/generate-quiz', {
        topic: formData.topic,
        difficulty: formData.difficulty,
        numQuestions: formData.numQuestions
      })
      setGeneratedQuiz(data)
    } catch (error) {
      alert('Failed to generate quiz. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedQuiz) return
    setSaving(true)
    try {
      await api.post('/quizzes', {
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        course: formData.course,
        questions: generatedQuiz.questions
      })
      onClose()
    } catch (error) {
      alert('Failed to save quiz')
    } finally {
      setSaving(false)
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
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">✨</span>
                <h2 className="text-2xl font-bold text-white">
                  AI Quiz Generator
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-purple-100 mt-2">Powered by Google Gemini AI</p>
          </div>

          <div className="p-6">
            {!generatedQuiz ? (
              <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Course *
                  </label>
                  <select
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Choose a course</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Topic *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., React Hooks, JavaScript Closures, Python Lists"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="20"
                      value={formData.numQuestions}
                      onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <strong>💡 Tip:</strong> Be specific with your topic for better results. 
                    For example: "React useState and useEffect hooks" instead of just "React".
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Generate Quiz with AI</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                    <span className="text-2xl">✓</span>
                    <span className="font-semibold">Quiz Generated Successfully!</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {generatedQuiz.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">{generatedQuiz.description}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Preview Questions:</h4>
                  {generatedQuiz.questions.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                      <p className="font-medium text-slate-900 dark:text-white mb-2">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="space-y-1 ml-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`text-sm ${opt === q.correctAnswer ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                            {String.fromCharCode(65 + oIdx)}. {opt}
                            {opt === q.correctAnswer && ' ✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setGeneratedQuiz(null)}
                    className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Quiz'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
