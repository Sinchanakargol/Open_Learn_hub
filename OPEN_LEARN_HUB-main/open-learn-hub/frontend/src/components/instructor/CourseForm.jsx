import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

export default function CourseForm({ course, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    completionPoints: 100,
    lessons: [],
    quizzes: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        level: course.level || 'beginner',
        completionPoints: course.completionPoints || 100,
        lessons: (course.lessons || []).map(lesson => ({
          ...lesson,
          duration: typeof lesson.duration === 'number' && !isNaN(lesson.duration) ? lesson.duration : 30,
          videoType: lesson.videoType || 'youtube',
          videoUrl: lesson.videoUrl || '',
          hasQuiz: lesson.hasQuiz || false
        })),
        quizzes: course.quizzes || []
      })
    }
  }, [course])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (course) {
        await api.put(`/courses/${course._id}`, formData)
      } else {
        await api.post('/courses', formData)
      }
      onClose()
    } catch (error) {
      alert('Failed to save course')
    } finally {
      setLoading(false)
    }
  }

  const addLesson = () => {
    setFormData({
      ...formData,
      lessons: [...formData.lessons, { title: '', content: '', duration: 30, videoUrl: '', videoType: 'youtube', hasQuiz: false }]
    })
  }

  const updateLesson = (index, field, value) => {
    const newLessons = [...formData.lessons]
    // Handle duration field to prevent NaN
    if (field === 'duration') {
      newLessons[index][field] = value === '' ? 30 : parseInt(value) || 30
    } else {
      newLessons[index][field] = value
    }
    setFormData({ ...formData, lessons: newLessons })
  }

  const removeLesson = (index) => {
    setFormData({
      ...formData,
      lessons: formData.lessons.filter((_, i) => i !== index)
    })
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
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {course ? 'Edit Course' : 'Create New Course'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="e.g., Introduction to React"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Describe what students will learn..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="e.g., Web Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Level *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Completion Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.completionPoints}
                  onChange={(e) => setFormData({ ...formData, completionPoints: parseInt(e.target.value) || 100 })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Points awarded on course completion"
                />
              </div>
            </div>

            {/* Lessons */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Lessons
                </label>
                <button
                  type="button"
                  onClick={addLesson}
                  className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors font-medium text-sm"
                >
                  + Add Lesson
                </button>
              </div>

              <div className="space-y-4">
                {formData.lessons.map((lesson, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Lesson {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLesson(idx)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(idx, 'title', e.target.value)}
                        placeholder="Lesson title"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                      <textarea
                        value={lesson.content}
                        onChange={(e) => updateLesson(idx, 'content', e.target.value)}
                        placeholder="Lesson content"
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Video Type</label>
                          <select
                            value={lesson.videoType || 'youtube'}
                            onChange={(e) => updateLesson(idx, 'videoType', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            <option value="youtube">YouTube</option>
                            <option value="vimeo">Vimeo</option>
                            <option value="url">Direct URL</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Duration (min)</label>
                          <input
                            type="number"
                            value={typeof lesson.duration === 'number' && !isNaN(lesson.duration) ? lesson.duration : 30}
                            onChange={(e) => updateLesson(idx, 'duration', e.target.value)}
                            min="1"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={lesson.videoUrl || ''}
                        onChange={(e) => updateLesson(idx, 'videoUrl', e.target.value)}
                        placeholder="Video URL (YouTube, Vimeo, or direct link)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                      <label className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={lesson.hasQuiz || false}
                          onChange={(e) => updateLesson(idx, 'hasQuiz', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Has Quiz (Configure quiz questions after creating course)</span>
                      </label>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
