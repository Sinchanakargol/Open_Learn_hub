import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import FlashcardReview from './FlashcardReview'

export default function FlashcardManager() {
  const [decks, setDecks] = useState([])
  const [showReview, setShowReview] = useState(false)
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [genForm, setGenForm] = useState({ content: '', deck: '', count: 10 })
  const [manualForm, setManualForm] = useState({ 
    question: '', 
    answer: '', 
    deck: 'Default',
    difficulty: 'medium' 
  })

  useEffect(() => {
    loadDecks()
  }, [])

  const loadDecks = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/flashcards/decks')
      // Ensure data is an array
      setDecks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load decks:', err)
      setDecks([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const generateFlashcards = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/flashcards/generate', genForm)
      setGenForm({ content: '', deck: '', count: 10 })
      setShowGenerator(false)
      loadDecks()
      alert('✅ Flashcards generated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate flashcards')
    } finally {
      setLoading(false)
    }
  }

  const createManualFlashcard = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/flashcards', manualForm)
      setManualForm({ question: '', answer: '', deck: 'Default', difficulty: 'medium' })
      setShowManualForm(false)
      loadDecks()
      alert('✅ Flashcard created successfully!')
    } catch (err) {
      alert('Failed to create flashcard')
    } finally {
      setLoading(false)
    }
  }

  const startReview = (deck) => {
    setSelectedDeck(deck)
    setShowReview(true)
  }

  if (showReview) {
    return (
      <FlashcardReview 
        deck={selectedDeck} 
        onClose={() => { setShowReview(false); loadDecks() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          🎴 Flashcard Decks
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setShowManualForm(!showManualForm)
              setShowGenerator(false)
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
          >
            {showManualForm ? 'Cancel' : '✍️ Create Manual'}
          </button>
          <button
            onClick={() => {
              setShowGenerator(!showGenerator)
              setShowManualForm(false)
            }}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
          >
            {showGenerator ? 'Cancel' : '✨ Generate with AI'}
          </button>
        </div>
      </div>

      {showManualForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={createManualFlashcard}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              📚 Deck Name
            </label>
            <input
              type="text"
              value={manualForm.deck}
              onChange={(e) => setManualForm({ ...manualForm, deck: e.target.value })}
              placeholder="e.g., JavaScript, Math, History"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              required
              list="existing-decks"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              💡 Type a new name to create a deck, or select existing: {decks.length > 0 ? decks.map(d => d.deck || d._id).join(', ') : 'None yet'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Question
            </label>
            <textarea
              value={manualForm.question}
              onChange={(e) => setManualForm({ ...manualForm, question: e.target.value })}
              placeholder="Enter your question here..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Answer
            </label>
            <textarea
              value={manualForm.answer}
              onChange={(e) => setManualForm({ ...manualForm, answer: e.target.value })}
              placeholder="Enter the answer here..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Difficulty
            </label>
            <select
              value={manualForm.difficulty}
              onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : '✍️ Create Flashcard'}
          </button>
        </motion.form>
      )}

      {showGenerator && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={generateFlashcards}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              📚 Deck Name
            </label>
            <input
              type="text"
              value={genForm.deck}
              onChange={(e) => setGenForm({ ...genForm, deck: e.target.value })}
              placeholder="e.g., JavaScript, Machine Learning, World History"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              required
              list="existing-decks"
            />
            <datalist id="existing-decks">
              {decks.map((deck) => (
                <option key={deck.deck || deck._id} value={deck.deck || deck._id} />
              ))}
            </datalist>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              💡 Each deck name creates a separate collection. Different topics should have different deck names.
              {decks.length > 0 && <span className="block mt-1">📋 Existing decks: {decks.map(d => d.deck || d._id).join(', ')}</span>}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              📝 Content to Generate From
            </label>
            <textarea
              value={genForm.content}
              onChange={(e) => setGenForm({ ...genForm, content: e.target.value })}
              placeholder="Paste lesson content, notes, or study material here to auto-generate flashcards..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              rows="6"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              🔢 Number of Flashcards
            </label>
            <input
              type="number"
              value={genForm.count}
              onChange={(e) => setGenForm({ ...genForm, count: parseInt(e.target.value) })}
              min="5"
              max="50"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : '✨ Generate Flashcards'}
          </button>
        </motion.form>
      )}

      {loading && !showGenerator ? (
        <div className="text-center py-12">Loading decks...</div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
          <span className="text-6xl">🎴</span>
          <p className="text-slate-500 dark:text-slate-400 mt-4">
            No flashcard decks yet. Generate some with AI!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <motion.div
              key={deck.deck || deck._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow hover:shadow-lg transition-all"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                📚 {deck.deck || deck._id}
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Total Cards:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{deck.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Due for Review:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{deck.due}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Avg Ease:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {deck.avgEase?.toFixed(1) || '2.5'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => startReview(deck.deck || deck._id)}
                disabled={deck.due === 0}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {deck.due > 0 ? `📚 Review ${deck.due} Cards` : '✅ All Done!'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
