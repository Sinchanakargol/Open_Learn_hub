import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import api from '../services/api'

export default function PerformanceAnalytics() {
  const { user } = useSelector(state => state.auth)
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState(null)
  const [enrollments, setEnrollments] = useState([])

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    setLoading(true)
    try {
      // Get enrollment data
      const { data: enrollData } = await api.get('/enrollments/my-enrollments')
      const enrollments = Array.isArray(enrollData) ? enrollData : []
      setEnrollments(enrollments)

      // Calculate student metrics
      const metrics = calculateMetrics(enrollments)
      
      // Get AI predictions
      const { data: aiAnalysis } = await api.post('/ai/predict-performance', metrics)
      setAnalysis(aiAnalysis)
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
      setEnrollments([])
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (enrollments) => {
    const total = enrollments.length
    const completed = enrollments.filter(e => e.progress === 100).length
    const avgProgress = total > 0 
      ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / total 
      : 0

    const quizScores = enrollments.flatMap(e => e.quizScores || []).map(q => q.score)
    const avgQuizScore = quizScores.length > 0
      ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
      : 0

    const totalLessons = enrollments.reduce((sum, e) => sum + (e.course?.lessons?.length || 0), 0)
    const completedLessons = enrollments.reduce((sum, e) => sum + (e.completedLessons?.length || 0), 0)

    const daysEnrolled = enrollments.length > 0
      ? Math.max(...enrollments.map(e => Math.floor((Date.now() - new Date(e.createdAt)) / (1000 * 60 * 60 * 24))))
      : 1

    const lastAccessed = enrollments.length > 0
      ? new Date(Math.max(...enrollments.map(e => new Date(e.lastAccessed || e.createdAt))))
      : new Date()
    
    const daysInactive = Math.floor((Date.now() - lastAccessed) / (1000 * 60 * 60 * 24))

    return {
      progress: avgProgress,
      quiz_average: avgQuizScore,
      completed_lessons: completedLessons,
      total_lessons: totalLessons || 1,
      days_enrolled: daysEnrolled,
      watch_time_hours: completedLessons * 0.5, // Estimate
      quizzes_taken: quizScores.length,
      avg_quiz_score: avgQuizScore,
      days_inactive: daysInactive,
      courses_enrolled: total,
      leaderboard_points: 0, // Would get from actual leaderboard
      badges_earned: 0, // Would get from actual badges
      courses_completed: completed
    }
  }

  const getRiskColor = (riskLevel) => {
    const colors = {
      'Low': 'from-green-500 to-emerald-500',
      'Medium': 'from-yellow-500 to-orange-500',
      'High': 'from-red-500 to-rose-500'
    }
    return colors[riskLevel] || 'from-gray-500 to-slate-500'
  }

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'from-green-500 to-emerald-500'
    if (grade >= 80) return 'from-blue-500 to-cyan-500'
    if (grade >= 70) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-rose-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-slate-600 dark:text-slate-400">Analyzing your performance...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">📊</span>
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No data yet</h3>
        <p className="text-slate-500 dark:text-slate-400">Enroll in courses to see your performance analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            🤖 AI Performance Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Powered by Random Forest Machine Learning
          </p>
        </div>
        <button
          onClick={fetchPerformanceData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Dropout Risk Prediction */}
      {analysis.dropout_risk && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                Dropout Risk Analysis
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Random Forest Classifier Prediction
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getRiskColor(analysis.dropout_risk.risk_level)} text-white font-bold text-lg`}>
              {analysis.dropout_risk.risk_level} Risk
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Dropout Probability</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {(analysis.dropout_risk.dropout_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className={`bg-gradient-to-r ${getRiskColor(analysis.dropout_risk.risk_level)} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${analysis.dropout_risk.dropout_probability * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">🎯 Recommendation</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {analysis.dropout_risk.risk_level === 'High' && "Focus on consistent engagement. Set daily study goals and join study groups for support."}
                  {analysis.dropout_risk.risk_level === 'Medium' && "You're doing well! Maintain your current pace and stay connected with your courses."}
                  {analysis.dropout_risk.risk_level === 'Low' && "Excellent progress! Keep up the great work and help motivate other students."}
                </p>
              </div>
            </div>

            {/* Feature Importance */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Top Influencing Factors</h3>
              <div className="space-y-2">
                {Object.entries(analysis.dropout_risk.feature_importance || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([feature, importance]) => (
                    <div key={feature} className="flex items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400 w-32">{feature}</span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 ml-3">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
                          style={{ width: `${importance * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 ml-2 w-12 text-right">
                        {(importance * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Grade Prediction */}
      {analysis.grade_prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Expected Performance
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getGradeColor(analysis.grade_prediction.predicted_grade)} text-white mb-3`}>
                <div>
                  <div className="text-4xl font-bold">{analysis.grade_prediction.predicted_grade.toFixed(0)}</div>
                  <div className="text-sm opacity-90">Points</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                Grade: {analysis.grade_prediction.letter_grade}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Predicted Final Grade
              </p>
            </div>

            <div className="col-span-2 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📈 Confidence Interval</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {analysis.grade_prediction.confidence_interval && analysis.grade_prediction.confidence_interval.length >= 2 ? (
                    <>Expected grade range: {analysis.grade_prediction.confidence_interval[0].toFixed(0)} - {analysis.grade_prediction.confidence_interval[1].toFixed(0)}</>
                  ) : (
                    <>Predicted grade: {analysis.grade_prediction.predicted_grade.toFixed(0)}</>
                  )}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 ML Insight</h3>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  This prediction is based on Random Forest Regression analyzing 15 performance factors including progress, quiz scores, engagement, and study patterns.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Study Recommendations */}
      {analysis.study_recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            ⏰ Personalized Study Plan
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                {analysis.study_recommendations.recommended_hours_per_week} hours
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-400">Per week</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                {analysis.study_recommendations.estimated_weeks_to_completion} weeks
              </div>
              <div className="text-sm text-green-700 dark:text-green-400">To completion</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                {analysis.study_recommendations.total_hours_needed}h
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-400">Total needed</div>
            </div>
          </div>

          {analysis.study_recommendations.focus_areas && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Focus Areas</h3>
              <div className="space-y-2">
                {analysis.study_recommendations.focus_areas.map((area, idx) => (
                  <div key={idx} className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    <span className="text-xl">{idx === 0 ? '🎯' : '📌'}</span>
                    <span className="text-slate-700 dark:text-slate-300">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Next Course Recommendation */}
      {analysis.next_course_difficulty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">🚀 Ready for Your Next Challenge?</h2>
              <p className="text-indigo-100 mb-4">{analysis.next_course_difficulty.reason}</p>
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <div className="text-sm opacity-90">Recommended Level</div>
                  <div className="text-xl font-bold">{analysis.next_course_difficulty.recommended_difficulty}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl opacity-20">🧠</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ML Info */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">🌲</div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">Random Forest ML Model</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This analysis uses Random Forest algorithms trained on 1000+ student patterns to predict outcomes with high accuracy.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {analysis.analysis_date && new Date(analysis.analysis_date).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
