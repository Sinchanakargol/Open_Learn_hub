import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'

export default function AIStudyMaterialGenerator() {
  const [formData, setFormData] = useState({
    prompt: '',
    pageCount: 5,
    title: '',
    tags: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [materials, setMaterials] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/study-materials/generate', {
        prompt: formData.prompt,
        pageCount: parseInt(formData.pageCount),
        title: formData.title || formData.prompt.substring(0, 50),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      })

      // Add to materials list
      setMaterials(prev => [data, ...prev])

      // Reset form
      setFormData({
        prompt: '',
        pageCount: 5,
        title: '',
        tags: ''
      })

      // Show success message
      alert('✅ Study material generated successfully! You can download it now.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate study material')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/study-materials')
      setMaterials(data)
      setShowHistory(true)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const downloadMaterial = async (id, title) => {
    try {
      const response = await api.get(`/study-materials/${id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${title}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download PDF')
    }
  }

  const deleteMaterial = async (id) => {
    if (!confirm('Are you sure you want to delete this study material?')) return
    
    try {
      await api.delete(`/study-materials/${id}`)
      setMaterials(prev => prev.filter(m => m._id !== id))
    } catch (err) {
      alert('Failed to delete material')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-4xl">🤖</span>
          <div>
            <h2 className="text-3xl font-bold">AI Study Material Generator</h2>
            <p className="text-purple-100 mt-1">Generate custom study notes as downloadable PDF</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{materials.length}</div>
            <div className="text-sm text-purple-100">Materials Generated</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">
              {materials.reduce((sum, m) => sum + m.downloads, 0)}
            </div>
            <div className="text-sm text-purple-100">Total Downloads</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">PDF</div>
            <div className="text-sm text-purple-100">Structured Format</div>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📝</span>
          Generate Study Material
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Topic / Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="E.g., Explain Machine Learning algorithms with examples and practice questions"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="4"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Be specific! The more detailed your prompt, the better the content.
            </p>
          </div>

          {/* Page Count */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Number of Pages <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="50"
                value={formData.pageCount}
                onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                className="flex-1"
              />
              <div className="w-20 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center font-bold">
                {formData.pageCount}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Approximate {formData.pageCount * 400} words • {Math.ceil(formData.pageCount / 5)} topics
            </p>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Title (Optional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Custom title for PDF"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="AI, Programming, Math"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.prompt || formData.pageCount < 1}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating... ({formData.pageCount} pages)</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate Study Material</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center mb-2">
            <span className="mr-2">💡</span> Pro Tips:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Be specific with your topic for better results</li>
            <li>• Request examples, diagrams, or practice questions in your prompt</li>
            <li>• Higher page count = more comprehensive coverage</li>
            <li>• Generated PDFs include: topics, explanations, key points, examples & questions</li>
          </ul>
        </div>
      </motion.div>

      {/* History Button */}
      {!showHistory && (
        <button
          onClick={loadHistory}
          className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
        >
          📚 View My Study Materials History
        </button>
      )}

      {/* Materials History */}
      {(showHistory || materials.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <span className="text-2xl mr-2">📚</span>
              My Study Materials
            </span>
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              {materials.length} materials
            </span>
          </h3>

          {materials.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl">📝</span>
              <p className="text-slate-500 dark:text-slate-400 mt-4">
                No study materials yet. Generate your first one!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((material) => (
                <motion.div
                  key={material._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {material.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                        {material.prompt}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>📄 {material.pageCount} pages</span>
                        <span>⏱️ {Math.round(material.generationTime / 1000)}s</span>
                        <span>📥 {material.downloads} downloads</span>
                        <span>
                          {material.status === 'completed' && '✅ Ready'}
                          {material.status === 'generating' && '⏳ Generating...'}
                          {material.status === 'failed' && '❌ Failed'}
                        </span>
                      </div>
                      {material.tags && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {material.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {material.status === 'completed' && (
                        <button
                          onClick={() => downloadMaterial(material._id, material.title)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <span>📥</span>
                          <span>Download</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteMaterial(material._id)}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
