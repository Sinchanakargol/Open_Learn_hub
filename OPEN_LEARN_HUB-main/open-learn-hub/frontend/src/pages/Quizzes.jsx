import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'

export default function Quizzes() {
  const [formData, setFormData] = useState({
    topic: '',
    numberOfQuestions: 5,
    difficulty: 'medium',
    timeLimit: 10
  })
  const [quiz, setQuiz] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerInterval, setTimerInterval] = useState(null)

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      alert('Please enter a topic')
      return
    }

    setGenerating(true)
    try {
      const { data } = await api.post('/ai/generate-quiz', {
        courseTitle: 'Custom Quiz',
        lessonTitle: formData.topic,
        lessonContent: `Generate questions about ${formData.topic} at ${formData.difficulty} level`,
        numberOfQuestions: formData.numberOfQuestions
      })

      setQuiz({
        title: `${formData.topic} Quiz`,
        difficulty: formData.difficulty,
        questions: data.questions,
        timeLimit: formData.timeLimit
      })
      setCurrentQuestion(0)
      setAnswers({})
      setShowResult(false)
      setResult(null)
      
      // Start timer if time limit is set
      if (formData.timeLimit > 0) {
        setTimeLeft(formData.timeLimit * 60) // Convert to seconds
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      alert('Failed to generate quiz. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = (answerIndex) => {
    setAnswers({ ...answers, [currentQuestion]: answerIndex })
  }

  const handleSubmit = () => {
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    // Calculate score
    let correct = 0
    quiz.questions.forEach((question, idx) => {
      if (answers[idx] === question.correctAnswer) {
        correct++
      }
    })

    const scorePercentage = (correct / quiz.questions.length) * 100
    setResult({
      correct,
      total: quiz.questions.length,
      percentage: scorePercentage
    })
    setShowResult(true)
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

  const handleReset = () => {
    setQuiz(null)
    setCurrentQuestion(0)
    setAnswers({})
    setShowResult(false)
    setResult(null)
    setTimeLeft(null)
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }

  // Timer effect
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !showResult) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      setTimerInterval(interval)
      return () => clearInterval(interval)
    }
  }, [timeLeft, showResult])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const allQuestionsAnswered = quiz?.questions.every((_, idx) => answers[idx] !== undefined)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Custom Quiz Generator
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Create personalized quizzes on any topic with AI
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
            <span className="text-2xl">✨</span>
            <div className="text-left">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Powered by</p>
              <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Google Gemini</p>
            </div>
          </div>
        </div>
      </motion.div>

      {!quiz ? (
        // Quiz Generator Form
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700"
        >
          <div className="space-y-6">
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., JavaScript Promises, World History, Biology"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Number of Questions: {formData.numberOfQuestions}
              </label>
              <input
                type="range"
                min="3"
                max="10"
                value={formData.numberOfQuestions}
                onChange={(e) => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>3</span>
                <span>10</span>
              </div>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, difficulty: level })}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      formData.difficulty === level
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Time Limit (minutes): {formData.timeLimit === 0 ? 'No Limit' : formData.timeLimit}
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>No Limit</span>
                <span>30 min</span>
              </div>
            </div>

            {/* AI Info Banner */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🤖</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    AI-Powered Quiz Generation
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Google Gemini AI will analyze your topic and create intelligent, context-aware questions tailored to your chosen difficulty level.
                  </p>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !formData.topic.trim()}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Gemini AI is generating your quiz...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Generate Quiz with AI</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : showResult ? (
        // Results
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center"
        >
          <div className="text-6xl mb-4">
            {result.percentage >= 80 ? '🎉' : result.percentage >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            {result.percentage >= 80 ? 'Excellent!' : result.percentage >= 60 ? 'Good Job!' : 'Keep Learning!'}
          </h2>
          <div className="space-y-3 text-lg mb-8">
            <p className="text-slate-600 dark:text-slate-400">
              You got <span className="font-bold text-purple-600 dark:text-purple-400">{result.correct}</span> out of{' '}
              <span className="font-bold">{result.total}</span> correct
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(result.percentage)}%
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Create New Quiz
            </button>
            <button
              onClick={() => {
                setShowResult(false)
                setCurrentQuestion(0)
                setAnswers({})
                if (quiz.timeLimit > 0) {
                  setTimeLeft(quiz.timeLimit * 60)
                }
              }}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              Retake Quiz
            </button>
          </div>
        </motion.div>
      ) : (
        // Quiz Questions
        <div className="space-y-6">
          {/* Timer and Progress */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  quiz.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {quiz.difficulty.toUpperCase()}
                </span>
              </div>
              {timeLeft !== null && (
                <div className={`text-lg font-bold ${
                  timeLeft < 60 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  ⏱️ {formatTime(timeLeft)}
                </div>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question */}
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {quiz.questions[currentQuestion].question}
            </h3>

            <div className="space-y-3">
              {quiz.questions[currentQuestion].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentQuestion] === idx
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestion] === idx
                          ? 'border-purple-600 bg-purple-600'
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

          {/* Navigation */}
          <div className="flex items-center justify-between">
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
                disabled={!allQuestionsAnswered}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg transition-all"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
