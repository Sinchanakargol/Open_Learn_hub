import { useState } from 'react'
import { motion } from 'framer-motion'
import NotesList from '../components/ai-assistant/NotesList'
import FlashcardManager from '../components/ai-assistant/FlashcardManager'
import StudyPlanManager from '../components/ai-assistant/StudyPlanManager'

export default function AIAssistantHub() {
  const [activeTab, setActiveTab] = useState('notes')

  const tabs = [
    { id: 'notes', label: 'Smart Notes', icon: '📝' },
    { id: 'flashcards', label: 'Flashcards', icon: '🎴' },
    { id: 'plans', label: 'Study Plans', icon: '📅' }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-6">
        <h1 className="text-4xl font-bold mb-2">🧠 AI Study Assistant</h1>
        <p className="text-indigo-100">Supercharge your learning with AI-powered tools</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-white dark:bg-slate-800 p-2 rounded-lg shadow">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'notes' && <NotesList />}
        {activeTab === 'flashcards' && <FlashcardManager />}
        {activeTab === 'plans' && <StudyPlanManager />}
      </motion.div>
    </div>
  )
}
