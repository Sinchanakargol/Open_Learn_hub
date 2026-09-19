import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'

export default function VideoPlayer({ lesson, courseId, enrollmentId, onComplete }) {
  const videoRef = useRef(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [watchedPercentage, setWatchedPercentage] = useState(0)
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const percentage = (video.currentTime / video.duration) * 100
      setWatchedPercentage(percentage)

      // Mark as complete when 90% watched
      if (percentage >= 90 && !hasMarkedComplete) {
        markAsComplete()
      }
    }

    const handleEnded = () => {
      if (!hasMarkedComplete) {
        markAsComplete()
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [hasMarkedComplete])

  const markAsComplete = async () => {
    try {
      setHasMarkedComplete(true)
      setIsCompleted(true)
      
      await api.post('/enrollments/complete-lesson', {
        courseId,
        lessonId: lesson._id
      })

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Failed to mark lesson as complete:', error)
    }
  }

  const getVideoEmbedUrl = () => {
    if (!lesson.videoUrl) return null

    if (lesson.videoType === 'youtube') {
      // Extract video ID from various YouTube URL formats
      const videoId = lesson.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    } else if (lesson.videoType === 'vimeo') {
      const videoId = lesson.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
    
    return lesson.videoUrl
  }

  const embedUrl = getVideoEmbedUrl()

  if (!lesson.videoUrl) {
    return (
      <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">No video available for this lesson</p>
      </div>
    )
  }

  const isEmbeddedVideo = lesson.videoType === 'youtube' || lesson.videoType === 'vimeo'

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-xl overflow-hidden">
        {isEmbeddedVideo ? (
          <div className="relative pt-[56.25%]">
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full"
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          >
            <source src={lesson.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Progress Bar or Complete Button */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        {isEmbeddedVideo ? (
          // For embedded videos (YouTube/Vimeo), show manual complete button
          <>
            {!isCompleted ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                  After watching the video, click below to mark as complete
                </p>
                <button
                  onClick={markAsComplete}
                  disabled={hasMarkedComplete}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasMarkedComplete ? 'Marking Complete...' : '✓ Mark Lesson as Complete'}
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center space-y-2 text-green-600 dark:text-green-400"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✓</span>
                  <span className="font-semibold text-lg">Lesson Completed!</span>
                </div>
                {lesson.hasQuiz && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Scroll down to take the quiz 📝
                  </p>
                )}
              </motion.div>
            )}
          </>
        ) : (
          // For direct video files, show progress tracking
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Watch Progress
              </span>
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {Math.round(watchedPercentage)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${watchedPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex flex-col items-center space-y-2 text-green-600 dark:text-green-400"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">✓</span>
                  <span className="font-semibold">Lesson Completed!</span>
                </div>
                {lesson.hasQuiz && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Scroll down to take the quiz 📝
                  </p>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
