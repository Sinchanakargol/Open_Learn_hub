import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function MoodAnalyzer({ onMoodAnalyzed }) {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [showPrompt, setShowPrompt] = useState(true)
  const [error, setError] = useState(null)

  const prompts = [
    "How are you feeling about your learning today?",
    "What's on your mind right now?",
    "How's your study session going?",
    "Tell me about your learning experience today",
    "How motivated are you feeling?"
  ]

  const [currentPrompt] = useState(prompts[Math.floor(Math.random() * prompts.length)])

  const handleAnalyze = async () => {
    if (!input.trim()) return

    setAnalyzing(true)
    setError(null)
    
    try {
      const { data } = await api.post('/ai/analyze-mood', {
        text: input,
        engagementScore: null // Can be calculated based on user activity
      })
      
      onMoodAnalyzed(data)
      setShowPrompt(false)
      
      // Reset after 3 seconds
      setTimeout(() => {
        setInput('')
        setShowPrompt(true)
        setError(null)
      }, 3000)
    } catch (error) {
      console.error('Mood analysis error:', error)
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('Please log in to use the mood analyzer.')
        setTimeout(() => navigate('/login'), 2000)
      } else if (error.response?.status === 500) {
        setError('AI service is currently unavailable. Please try again later.')
      } else {
        setError('Failed to analyze mood. Please check your connection.')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAnalyze()
    }
  }

  return (
    <AnimatePresence mode="wait">
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-start space-x-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                AI Mood Analyzer
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                {currentPrompt}
              </p>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your thoughts here..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  rows="3"
                  disabled={analyzing}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || !input.trim()}
                  className="mt-3 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </span>
                  ) : (
                    'Analyze My Mood'
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                💡 Our AI will adapt your dashboard based on your mood using Q-learning
              </p>
              
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 dark:text-red-400">⚠️</span>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
