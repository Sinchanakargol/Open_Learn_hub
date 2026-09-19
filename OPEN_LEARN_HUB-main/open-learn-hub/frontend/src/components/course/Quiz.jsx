import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

export default function Quiz({ quiz, courseId, lessonId, onComplete, alreadyPassed }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRetaking, setIsRetaking] = useState(false)

  const handleAnswer = (questionIndex, answerIndex) => {
    setAnswers({ ...answers, [questionIndex]: answerIndex })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const answerArray = quiz.questions.map((_, idx) => answers[idx] ?? -1)
      
      const { data } = await api.post('/enrollments/submit-quiz-score', {
        courseId,
        quizId: quiz._id,
        lessonId,
        answers: answerArray
      })

      // Store full result including enrollment data
      setResult({
        ...data.quizResult,
        enrollment: data.enrollment
      })
      setShowResult(true)
      
      if (data.quizResult.passed && onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      alert('Failed to submit quiz. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const allQuestionsAnswered = quiz.questions.every((_, idx) => answers[idx] !== undefined)

  if (alreadyPassed && !isRetaking) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
          Quiz Already Passed!
        </h3>
        <p className="text-green-600 dark:text-green-300 mb-6">
          You've successfully completed this quiz. Great job!
        </p>
        <button
          onClick={() => setIsRetaking(true)}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
        >
          🔄 Retake Quiz
        </button>
      </div>
    )
  }

  if (showResult) {
    const passed = result.passed
    const courseCompleted = result.enrollment?.completed
    const totalPointsEarned = result.enrollment?.pointsEarned || 0
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-8 text-center border-2 ${
          passed
            ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
            : 'bg-red-50 dark:bg-red-900/20 border-red-500'
        }`}
      >
        <div className="text-6xl mb-4">{passed ? '🎉' : '😔'}</div>
        <h3 className={`text-3xl font-bold mb-4 ${
          passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
        }`}>
          {passed ? 'Congratulations!' : 'Keep Trying!'}
        </h3>
        <div className="space-y-3 text-lg">
          <p className={passed ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
            Your Score: <span className="font-bold">{Math.round(result.score)}%</span>
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            You got <span className="font-bold">{result.correctAnswers}</span> out of{' '}
            <span className="font-bold">{result.totalPoints}</span> points
          </p>
          {passed && (
            <>
              <p className="text-green-600 dark:text-green-300 font-semibold">
                +{result.correctAnswers} points added to your leaderboard! 🏆
              </p>
              
              {/* Course Completion Message */}
              {courseCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border-2 border-amber-400 dark:border-amber-600"
                >
                  <div className="text-5xl mb-3">🏆</div>
                  <h4 className="text-2xl font-bold text-amber-700 dark:text-amber-400 mb-2">
                    Course Completed!
                  </h4>
                  <p className="text-amber-600 dark:text-amber-300 mb-3">
                    You've successfully completed all quizzes in this course!
                  </p>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 inline-block">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Total Points Earned
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      +{totalPointsEarned} Points
                    </p>
                  </div>
                </motion.div>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowResult(false)
                    setCurrentQuestion(0)
                    setAnswers({})
                    setResult(null)
                    setIsRetaking(true)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Retake Quiz</span>
                </button>
                <button
                  onClick={() => {
                    if (onComplete) onComplete()
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <span>{courseCompleted ? 'View Course Details' : 'Continue Learning'}</span>
                  <span>→</span>
                </button>
              </div>
            </>
          )}
          {!passed && (
            <p className="text-slate-600 dark:text-slate-400 mt-4">
              Passing score: {quiz.passingPercentage}%
            </p>
          )}
        </div>
        {!passed && (
          <button
            onClick={() => {
              setShowResult(false)
              setCurrentQuestion(0)
              setAnswers({})
              setResult(null)
            }}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        )}
      </motion.div>
    )
  }

  const question = quiz.questions[currentQuestion]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
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
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {question.question}
          </h3>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQuestion, idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[currentQuestion] === idx
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion] === idx
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {answers[currentQuestion] === idx && (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          {Object.keys(answers).length} / {quiz.questions.length} answered
        </div>

        {currentQuestion === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered || isSubmitting}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={currentQuestion === quiz.questions.length - 1}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
