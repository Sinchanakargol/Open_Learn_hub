import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { Award, Star } from 'lucide-react'
import api from '../../services/api'
import VideoPlayer from './VideoPlayer'
import Quiz from './Quiz'
import CourseReviews from './CourseReviews'
import CertificateModal from './CertificateModal'
import VoiceTutor from '../voice/VoiceTutor'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const [course, setCourse] = useState(null)
  const [enrolled, setEnrolled] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState(null)
  const [currentLesson, setCurrentLesson] = useState(0)
  const [completedLessons, setCompletedLessons] = useState([])
  const [quizScores, setQuizScores] = useState([])
  const [showQuiz, setShowQuiz] = useState(false)
  const [loading, setLoading] = useState(true)
  const [certificate, setCertificate] = useState(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [generatingCert, setGeneratingCert] = useState(false)
  const [showVoiceTutor, setShowVoiceTutor] = useState(false)

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const { data } = await api.get(`/courses/${id}`)
      setCourse(data)
      
      // Check if enrolled
      const enrollRes = await api.get('/enrollments/my-enrollments')
      const enrollment = enrollRes.data.find(e => e.course?._id === id)
      if (enrollment) {
        setEnrolled(true)
        setEnrollmentId(enrollment._id)
        setCompletedLessons(enrollment.completedLessons || [])
        setQuizScores(enrollment.quizScores || [])
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    try {
      const { data } = await api.post('/enrollments', { courseId: id })
      setEnrolled(true)
      setEnrollmentId(data._id)
      setCompletedLessons([])
    } catch (error) {
      alert('Failed to enroll in course')
    }
  }

  const handleLessonComplete = async () => {
    // Refresh enrollment data
    try {
      const enrollRes = await api.get('/enrollments/my-enrollments')
      const enrollment = enrollRes.data.find(e => e.course?._id === id)
      if (enrollment) {
        setCompletedLessons(enrollment.completedLessons || [])
        setQuizScores(enrollment.quizScores || [])
      }
      
      // Check if current lesson has a quiz
      const currentLessonData = course?.lessons?.[currentLesson]
      if (currentLessonData?.hasQuiz) {
        setShowQuiz(true)
      }
    } catch (error) {
      console.error('Failed to refresh enrollment:', error)
    }
  }

  const handleQuizComplete = () => {
    fetchCourse()
    setShowQuiz(false)
  }

  const getCurrentLessonQuiz = () => {
    const currentLessonData = course?.lessons?.[currentLesson]
    if (!currentLessonData) return null
    return course?.quizzes?.find(q => q.lessonId === currentLessonData._id)
  }

  const isQuizPassed = (lessonId) => {
    const quiz = course?.quizzes?.find(q => q.lessonId === lessonId)
    if (!quiz) return false
    const quizScore = quizScores.find(qs => qs.quizId === quiz._id)
    return quizScore?.passed || false
  }

  const handleGenerateCertificate = async () => {
    setGeneratingCert(true)
    try {
      const { data } = await api.post('/certificates/generate', { courseId: id })
      setCertificate(data)
      setShowCertificate(true)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate certificate')
    } finally {
      setGeneratingCert(false)
    }
  }

  const checkForCertificate = async () => {
    try {
      const { data } = await api.get('/certificates/my-certificates')
      const existingCert = data.find(c => c.course?._id === id)
      if (existingCert) {
        setCertificate(existingCert)
      }
    } catch (error) {
      console.error('Failed to check certificates:', error)
    }
  }

  useEffect(() => {
    if (enrolled) {
      checkForCertificate()
    }
  }, [enrolled, id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Course not found</h2>
        <button onClick={() => navigate('/courses')} className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Back to courses
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm`}>
                {course.level}
              </span>
              <span className="text-indigo-100">{course.category}</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-indigo-100 text-lg mb-6">{course.description}</p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span>👨‍🏫</span>
                <span>{course.instructor?.name || 'Instructor'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📚</span>
                <span>{course.lessons?.length || 0} lessons</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⏱️</span>
                <span>{course.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0)} min</span>
              </div>
            </div>
          </div>
          {!enrolled && (
            <button
              onClick={handleEnroll}
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all"
            >
              Enroll Now
            </button>
          )}
        </div>
      </motion.div>

      {/* Course Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lessons Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Course Content</h2>
          <div className="space-y-2">
            {course.lessons?.map((lesson, idx) => {
              const isCompleted = completedLessons.includes(lesson._id)
              const hasQuiz = lesson.hasQuiz
              const quizPassed = isQuizPassed(lesson._id)
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentLesson(idx)
                    setShowQuiz(false)
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    currentLesson === idx
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isCompleted && <span className="text-green-500">✓</span>}
                      <span className="font-medium text-sm">{lesson.title}</span>
                      {hasQuiz && <span className="text-xs">{quizPassed ? '✅' : '📝'}</span>}
                    </div>
                    <span className="text-xs opacity-75">{lesson.duration} min</span>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Lesson Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700"
        >
          {enrolled ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {course.lessons?.[currentLesson]?.title}
              </h2>
              
              {/* Video Player */}
              {course.lessons?.[currentLesson]?.videoUrl && (
                <div className="mb-6">
                  <VideoPlayer
                    lesson={course.lessons[currentLesson]}
                    courseId={id}
                    enrollmentId={enrollmentId}
                    onComplete={handleLessonComplete}
                  />
                </div>
              )}
              
              {/* Toggle Voice Tutor Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowVoiceTutor(!showVoiceTutor)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                    showVoiceTutor
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="text-xl">🎙️</span>
                  <span>{showVoiceTutor ? 'Hide Voice Tutor' : 'Listen with AI Voice Tutor'}</span>
                </button>
              </div>

              {/* Voice Tutor */}
              {showVoiceTutor && course.lessons?.[currentLesson]?.content && (
                <div className="mb-6">
                  <VoiceTutor
                    content={course.lessons[currentLesson].content}
                    lessonTitle={course.lessons[currentLesson].title}
                    onComplete={() => handleLessonComplete(course.lessons[currentLesson]._id)}
                  />
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {course.lessons?.[currentLesson]?.content}
                </p>
              </div>

              {/* Quiz Section */}
              {showQuiz && getCurrentLessonQuiz() && (
                <div className="mb-6">
                  <Quiz
                    quiz={getCurrentLessonQuiz()}
                    courseId={id}
                    lessonId={course.lessons[currentLesson]._id}
                    onComplete={handleQuizComplete}
                    alreadyPassed={isQuizPassed(course.lessons[currentLesson]._id)}
                  />
                </div>
              )}

              {/* Show Quiz Button if lesson has quiz and is completed */}
              {!showQuiz && course.lessons?.[currentLesson]?.hasQuiz && completedLessons.includes(course.lessons[currentLesson]._id) && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <span>📝</span>
                    <span>{isQuizPassed(course.lessons[currentLesson]._id) ? 'Review Quiz' : 'Take Quiz'}</span>
                  </button>
                </div>
              )}
              
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setCurrentLesson(Math.max(0, currentLesson - 1))
                    setShowQuiz(false)
                  }}
                  disabled={currentLesson === 0}
                  className="px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous Lesson
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Lesson {currentLesson + 1} of {course.lessons?.length || 0}
                </span>
                <button
                  onClick={() => {
                    const nextLesson = currentLesson + 1
                    if (nextLesson < (course.lessons?.length || 0)) {
                      setCurrentLesson(nextLesson)
                      setShowQuiz(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  disabled={currentLesson === (course.lessons?.length || 1) - 1}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Next Lesson</span>
                  <span>→</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Enroll to Access Content</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Join this course to access all lessons and learning materials
              </p>
              <button
                onClick={handleEnroll}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-xl hover:scale-105 transition-all"
              >
                Enroll Now
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Certificate Section - Show if course is complete */}
      {enrolled && completedLessons.length === course.lessons?.length && course.lessons?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl">
                🎉
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  Congratulations! Course Completed
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {certificate ? 'View your certificate' : 'Generate your certificate of completion'}
                </p>
              </div>
            </div>
            {certificate ? (
              <button
                onClick={() => setShowCertificate(true)}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                <Award className="w-5 h-5" />
                <span>View Certificate</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateCertificate}
                disabled={generatingCert}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Award className="w-5 h-5" />
                <span>{generatingCert ? 'Generating...' : 'Generate Certificate'}</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Reviews Section */}
      <CourseReviews courseId={id} isEnrolled={enrolled} />

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && certificate && (
          <CertificateModal
            certificate={certificate}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
