import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'

export default function StudyPlanManager() {
  const [plans, setPlans] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    goal: '',
    availableHours: 10,
    targetDate: '',
    courseIds: []
  })

  useEffect(() => {
    loadPlans()
    loadCourses()
  }, [])

  const loadPlans = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/study-plans')
      // Ensure data is an array
      setPlans(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load plans')
      setPlans([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const { data } = await api.get('/courses')
      // Ensure data is an array
      setCourses(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load courses')
      setCourses([]) // Set empty array on error
    }
  }

  const generatePlan = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      await api.post('/study-plans/generate', formData)
      setFormData({ goal: '', availableHours: 10, targetDate: '', courseIds: [] })
      setShowForm(false)
      loadPlans()
    } catch (err) {
      alert('Failed to generate study plan')
    } finally {
      setGenerating(false)
    }
  }

  const completeMilestone = async (planId, milestoneId) => {
    try {
      await api.post(`/study-plans/${planId}/milestones/${milestoneId}/complete`)
      loadPlans()
    } catch (err) {
      alert('Failed to complete milestone')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          📅 Study Plans ({plans.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          {showForm ? 'Cancel' : '✨ Generate Plan'}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={generatePlan}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg space-y-4"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            ✨ AI Study Plan Generator
          </h3>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              What's your goal?
            </label>
            <input
              type="text"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="e.g., Master Python Programming, Complete React Course"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Available hours per week
            </label>
            <input
              type="number"
              value={formData.availableHours}
              onChange={(e) => setFormData({ ...formData, availableHours: parseInt(e.target.value) })}
              min="1"
              max="168"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Target completion date
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select courses to include
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg p-3 space-y-2">
              {courses.map((course) => (
                <label key={course._id} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.courseIds.includes(course._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, courseIds: [...formData.courseIds, course._id] })
                      } else {
                        setFormData({ ...formData, courseIds: formData.courseIds.filter(id => id !== course._id) })
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-slate-900 dark:text-white">{course.title}</span>
                </label>
              ))}
            </div>
            {courses.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                No courses available. Enroll in courses first.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={generating || formData.courseIds.length === 0}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? '⏳ Generating with AI...' : '✨ Generate Study Plan'}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="text-center py-12">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
          <span className="text-6xl">📅</span>
          <p className="text-slate-500 dark:text-slate-400 mt-4">
            No study plans yet. Generate one with AI!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
            >
              {/* Header */}
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {plan.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-3">{plan.goal}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                    📅 {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-semibold">
                    ⏱️ {plan.courses.reduce((sum, c) => sum + (c.hoursPerWeek || 0), 0)} hrs/week
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-semibold">
                    📊 {Math.round(plan.progress || 0)}% Complete
                  </span>
                </div>
              </div>

              {/* Weekly Schedule */}
              {plan.schedule && plan.schedule.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                    📆 Weekly Schedule
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {plan.schedule.map((day, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                          <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 text-sm">
                            {day.day?.substring(0, 1)}
                          </span>
                          {day.day}
                        </div>
                        <div className="space-y-2">
                          {day.timeSlots?.map((slot, sIdx) => (
                            <div key={sIdx} className="text-sm">
                              <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                                🕐 {slot.startTime} - {slot.endTime}
                              </div>
                              <div className="text-slate-700 dark:text-slate-300">{slot.activity}</div>
                              {slot.description && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {slot.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones Timeline */}
              {plan.milestones && plan.milestones.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                    🎯 Milestones Roadmap
                  </h4>
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>
                    
                    {/* Milestones */}
                    <div className="space-y-4">
                      {plan.milestones.map((milestone, idx) => (
                        <motion.div
                          key={milestone._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative pl-12"
                        >
                          {/* Timeline Node */}
                          <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            milestone.completed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white dark:bg-slate-700 border-4 border-blue-500 text-blue-600'
                          }`}>
                            {milestone.completed ? '✓' : idx + 1}
                          </div>
                          
                          {/* Milestone Card */}
                          <div className={`bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border-2 transition-all ${
                            milestone.completed 
                              ? 'border-green-300 dark:border-green-700 opacity-75' 
                              : 'border-blue-300 dark:border-blue-700 hover:shadow-md'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className={`font-bold text-lg ${
                                    milestone.completed 
                                      ? 'line-through text-slate-400' 
                                      : 'text-slate-900 dark:text-white'
                                  }`}>
                                    {milestone.title}
                                  </h5>
                                  <input
                                    type="checkbox"
                                    checked={milestone.completed}
                                    onChange={() => completeMilestone(plan._id, milestone._id)}
                                    className="w-5 h-5 rounded cursor-pointer"
                                  />
                                </div>
                                {milestone.description && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    {milestone.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-semibold">
                                    📅 Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                  </span>
                                  {milestone.completed && milestone.completedAt && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-semibold">
                                      ✅ Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Study Tips */}
              {plan.tips && plan.tips.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                    💡 AI Study Tips
                  </h4>
                  <ul className="space-y-2">
                    {plan.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-yellow-600 dark:text-yellow-400 mr-2">▸</span>
                        <span className="text-slate-700 dark:text-slate-300 text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Courses */}
              {plan.courses && plan.courses.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    📚 Included Courses
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {plan.courses.map((courseItem, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold text-sm"
                      >
                        {courseItem.course?.title || 'Course'} • {courseItem.hoursPerWeek || 0}h/week
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
