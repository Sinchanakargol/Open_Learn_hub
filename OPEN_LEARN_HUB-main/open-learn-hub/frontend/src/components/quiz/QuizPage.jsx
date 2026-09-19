import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [score, setScore] = useState(null)
  const [adaptiveLevel, setAdaptiveLevel] = useState(3)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get('/quizzes')
      setQuizzes(data)
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const startQuiz = async (quiz) => {
    setActiveQuiz(quiz)
    setCurrentQuestion(0)
    setAnswers({})
    setScore(null)
    
    // Get adaptive first question
    try {
      const { data } = await api.post('/ai/adaptive-quiz/next', {
        quiz_id: quiz._id,
        last_answer: null
      })
      setAdaptiveLevel(data.level)
    } catch (error) {
      console.error('Failed to get adaptive question:', error)
    }
  }

  const handleAnswer = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)

    // Get next adaptive question
    try {
      const isCorrect = answer === activeQuiz.questions[currentQuestion].correctAnswer
      const { data } = await api.post('/ai/adaptive-quiz/next', {
        quiz_id: activeQuiz._id,
        last_answer: { correct: isCorrect }
      })
      setAdaptiveLevel(data.level)
    } catch (error) {
      console.error('Failed to get next question:', error)
    }

    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateScore(newAnswers)
    }
  }

  const calculateScore = (finalAnswers) => {
    let correct = 0
    activeQuiz.questions.forEach((q, idx) => {
      if (finalAnswers[q._id] === q.correctAnswer) correct++
    })
    const percentage = Math.round((correct / activeQuiz.questions.length) * 100)
    setScore(percentage)
  }

  const resetQuiz = () => {
    setActiveQuiz(null)
    setCurrentQuestion(0)
    setAnswers({})
    setScore(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading quizzes...</p>
        </div>
      </div>
    )
  }

  if (score !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-6xl mb-4">
            {score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Quiz Complete!
          </h2>
          <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {score}%
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            {score >= 80 ? 'Excellent work! You mastered this topic!' :
             score >= 60 ? 'Good job! Keep practicing to improve.' :
             'Keep learning! Review the material and try again.'}
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={resetQuiz}
              className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => startQuiz(activeQuiz)}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (activeQuiz) {
    const question = activeQuiz.questions[currentQuestion]
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Question {currentQuestion + 1} of {activeQuiz.questions.length}
            </span>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Difficulty Level: {adaptiveLevel}/5
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / activeQuiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {question.question}
            </h2>
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(question._id, option)}
                  className="w-full p-4 rounded-xl text-left bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-2 border-transparent hover:border-indigo-600 transition-all"
                >
                  <span className="font-medium text-slate-900 dark:text-white">{option}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Adaptive Quizzes
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Test your knowledge with AI-powered adaptive difficulty</p>
      </motion.div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No quizzes available</h3>
          <p className="text-slate-500 dark:text-slate-400">Check back later for new quizzes!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz, idx) => (
            <motion.div
              key={quiz._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 cursor-pointer"
              onClick={() => startQuiz(quiz)}
            >
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{quiz.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{quiz.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{quiz.questions?.length || 0} questions</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Start Quiz →</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
