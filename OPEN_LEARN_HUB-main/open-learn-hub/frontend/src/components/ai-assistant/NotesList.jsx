import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'

export default function NotesList() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  })
  const [generating, setGenerating] = useState(null)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notes')
      // Ensure data is an array
      setNotes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load notes:', err)
      setNotes([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const createNote = async (e) => {
    e.preventDefault()
    try {
      await api.post('/notes', {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      })
      setFormData({ title: '', content: '', tags: '' })
      setShowForm(false)
      loadNotes()
    } catch (err) {
      alert('Failed to create note')
    }
  }

  const generateSummary = async (noteId) => {
    setGenerating(noteId)
    try {
      const { data } = await api.post(`/notes/${noteId}/summary`)
      // Summary will be displayed inline automatically after reload
      loadNotes()
    } catch (err) {
      alert('Failed to generate summary')
    } finally {
      setGenerating(null)
    }
  }

  const deleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return
    try {
      await api.delete(`/notes/${noteId}`)
      loadNotes()
    } catch (err) {
      alert('Failed to delete note')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          📝 My Notes ({notes.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
        >
          {showForm ? 'Cancel' : '+ New Note'}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={createNote}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg space-y-4"
        >
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Note Title"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            required
          />
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Note Content"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            rows="6"
            required
          />
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Tags (comma separated)"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            Create Note
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="text-center py-12">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
          <span className="text-6xl">📝</span>
          <p className="text-slate-500 dark:text-slate-400 mt-4">
            No notes yet. Create your first note!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <motion.div
              key={note._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {note.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => generateSummary(note._id)}
                    disabled={generating === note._id}
                    className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50"
                  >
                    {generating === note._id ? '⏳' : '✨'} AI Summary
                  </button>
                  <button
                    onClick={() => deleteNote(note._id)}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="text-slate-700 dark:text-slate-300 mb-3 line-clamp-3">
                {note.content}
              </p>

              {note.aiSummary && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">
                    ✨ AI Summary:
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    {note.aiSummary}
                  </p>
                </div>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
