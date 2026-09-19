import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'

export default function FlashcardReview({ deck, onClose }) {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDueCards()
  }, [deck])

  const loadDueCards = async () => {
    try {
      const { data } = await api.get(`/flashcards/due${deck ? `?deck=${deck}` : ''}`)
      setCards(data)
    } catch (err) {
      console.error('Failed to load cards')
    } finally {
      setLoading(false)
    }
  }

  const reviewCard = async (quality) => {
    try {
      await api.post(`/flashcards/${cards[currentIndex]._id}/review`, { quality })
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setFlipped(false)
      } else {
        onClose()
      }
    } catch (err) {
      alert('Failed to review card')
    }
  }

  if (loading) return <div className="text-center py-12">Loading cards...</div>
  
  if (cards.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
        <span className="text-6xl">✅</span>
        <p className="text-slate-500 dark:text-slate-400 mt-4 mb-6">
          No cards due for review!
        </p>
        <button 
          onClick={onClose} 
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          Back to Decks
        </button>
      </div>
    )
  }

  const card = cards[currentIndex]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          📚 Review Session
        </h2>
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          ← Back
        </button>
      </div>

      <div className="text-center text-slate-600 dark:text-slate-400 mb-4">
        Card {currentIndex + 1} of {cards.length}
      </div>

      <motion.div
        key={currentIndex}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        onClick={() => setFlipped(!flipped)}
        className="relative cursor-pointer h-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12 flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={`absolute inset-0 flex items-center justify-center p-12 ${flipped ? 'hidden' : ''}`}>
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">Question</p>
            <p className="text-2xl text-slate-900 dark:text-white font-medium">{card.question}</p>
            <p className="text-sm text-slate-400 mt-8">Click to reveal answer</p>
          </div>
        </div>
        <div 
          className={`absolute inset-0 flex items-center justify-center p-12 ${flipped ? '' : 'hidden'}`}
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">Answer</p>
            <p className="text-2xl text-slate-900 dark:text-white font-medium">{card.answer}</p>
          </div>
        </div>
      </motion.div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-3"
        >
          <button 
            onClick={() => reviewCard(0)} 
            className="px-6 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
          >
            😔 Again
          </button>
          <button 
            onClick={() => reviewCard(3)} 
            className="px-6 py-4 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all"
          >
            😐 Hard
          </button>
          <button 
            onClick={() => reviewCard(4)} 
            className="px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
          >
            🙂 Good
          </button>
          <button 
            onClick={() => reviewCard(5)} 
            className="px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            😃 Easy
          </button>
        </motion.div>
      )}
    </div>
  )
}
