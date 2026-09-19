import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VoiceTutor({ content, lessonTitle, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [supportsTTS, setSupportsTTS] = useState(false)
  const [supportsSTT, setSupportsSTT] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)

  const utteranceRef = useRef(null)
  const recognitionRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    // Check browser support
    setSupportsTTS('speechSynthesis' in window)
    setSupportsSTT('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')

        setTranscript(transcript.toLowerCase())
        handleVoiceCommand(transcript.toLowerCase())
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start() // Restart if still in listening mode
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (utteranceRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleVoiceCommand = (command) => {
    if (command.includes('play') || command.includes('start') || command.includes('resume')) {
      speak()
    } else if (command.includes('pause') || command.includes('stop')) {
      pause()
    } else if (command.includes('next') || command.includes('skip')) {
      skipForward()
    } else if (command.includes('back') || command.includes('previous')) {
      skipBackward()
    } else if (command.includes('faster') || command.includes('speed up')) {
      setPlaybackRate(prev => Math.min(prev + 0.25, 2.0))
    } else if (command.includes('slower') || command.includes('slow down')) {
      setPlaybackRate(prev => Math.max(prev - 0.25, 0.5))
    } else if (command.includes('repeat')) {
      restart()
    } else if (command.includes('finish') || command.includes('complete')) {
      if (onComplete) onComplete()
    }
  }

  const speak = () => {
    if (!supportsTTS || !content) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Split content into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(' ')
    
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = playbackRate
    utterance.pitch = 1
    utterance.volume = 1

    // Get available voices
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0]
    if (englishVoice) {
      utterance.voice = englishVoice
    }

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentWordIndex(0)
      if (onComplete) onComplete()
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsPlaying(false)
    }

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCurrentWordIndex(event.charIndex)
        if (autoScroll && contentRef.current) {
          const element = contentRef.current
          const percentage = event.charIndex / content.length
          element.scrollTop = (element.scrollHeight - element.clientHeight) * percentage
        }
      }
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
      setIsPlaying(false)
    }
  }

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
    }
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentWordIndex(0)
  }

  const restart = () => {
    stop()
    setTimeout(speak, 100)
  }

  const skipForward = () => {
    // Skip 10 seconds worth of words
    const words = content.split(' ')
    const wordsPerSecond = 2.5 * playbackRate
    const skipWords = Math.floor(10 * wordsPerSecond)
    const newIndex = Math.min(currentWordIndex + skipWords * 5, content.length)
    
    stop()
    setTimeout(() => {
      const remainingContent = content.substring(newIndex)
      const utterance = new SpeechSynthesisUtterance(remainingContent)
      utterance.rate = playbackRate
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
    }, 100)
  }

  const skipBackward = () => {
    const words = content.split(' ')
    const wordsPerSecond = 2.5 * playbackRate
    const skipWords = Math.floor(10 * wordsPerSecond)
    const newIndex = Math.max(currentWordIndex - skipWords * 5, 0)
    
    stop()
    setTimeout(() => {
      const remainingContent = content.substring(newIndex)
      const utterance = new SpeechSynthesisUtterance(remainingContent)
      utterance.rate = playbackRate
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
    }, 100)
  }

  const toggleVoiceControl = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setTranscript('')
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const highlightText = (text) => {
    if (!isPlaying || currentWordIndex === 0) return text

    const before = text.substring(0, currentWordIndex)
    const current = text.substring(currentWordIndex, currentWordIndex + 50)
    const after = text.substring(currentWordIndex + 50)

    return (
      <>
        <span className="text-slate-600 dark:text-slate-400">{before}</span>
        <span className="bg-yellow-200 dark:bg-yellow-600 text-slate-900 font-semibold">{current}</span>
        <span className="text-slate-700 dark:text-slate-300">{after}</span>
      </>
    )
  }

  if (!supportsTTS) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-3">
          <span className="text-4xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-300">Browser Not Supported</h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              Your browser doesn't support text-to-speech. Try Chrome, Edge, or Safari.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">🎙️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Voice Tutor</h2>
              <p className="text-sm text-indigo-100">{lessonTitle || 'Learning Content'}</p>
            </div>
          </div>
          
          {isPlaying && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center"
            >
              🔊
            </motion.div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <button
            onClick={skipBackward}
            disabled={!isPlaying && !isPaused}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-3 transition-all backdrop-blur-sm"
          >
            <span className="text-2xl">⏪</span>
          </button>

          {!isPlaying && !isPaused ? (
            <button
              onClick={speak}
              className="col-span-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl py-3 font-bold text-lg shadow-lg transition-all"
            >
              ▶️ Play
            </button>
          ) : isPaused ? (
            <button
              onClick={resume}
              className="col-span-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl py-3 font-bold text-lg shadow-lg transition-all"
            >
              ▶️ Resume
            </button>
          ) : (
            <button
              onClick={pause}
              className="col-span-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl py-3 font-bold text-lg shadow-lg transition-all"
            >
              ⏸️ Pause
            </button>
          )}

          <button
            onClick={skipForward}
            disabled={!isPlaying && !isPaused}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-3 transition-all backdrop-blur-sm"
          >
            <span className="text-2xl">⏩</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={restart}
            className="bg-white/20 hover:bg-white/30 rounded-xl p-3 text-sm font-medium transition-all backdrop-blur-sm"
          >
            🔄 Restart
          </button>
          <button
            onClick={stop}
            className="bg-white/20 hover:bg-white/30 rounded-xl p-3 text-sm font-medium transition-all backdrop-blur-sm"
          >
            ⏹️ Stop
          </button>
        </div>

        {/* Speed Control */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-100">Playback Speed: {playbackRate.toFixed(2)}x</span>
            <button
              onClick={() => setPlaybackRate(1.0)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all"
            >
              Reset
            </button>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.25"
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, white 0%, white ${((playbackRate - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.2) ${((playbackRate - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-indigo-100 mt-1">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>1.5x</span>
            <span>2.0x</span>
          </div>
        </div>
      </motion.div>

      {/* Voice Commands Panel */}
      {supportsSTT && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎤</span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Voice Commands</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Control with your voice</p>
              </div>
            </div>
            <button
              onClick={toggleVoiceControl}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isListening
                  ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isListening ? '🔴 Listening...' : '🎤 Enable Voice Control'}
            </button>
          </div>

          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-slate-50 dark:bg-slate-900 rounded-xl p-4"
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">You said:</p>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {transcript || 'Listening...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Play', 'Pause', 'Next', 'Back', 'Faster', 'Slower', 'Repeat', 'Finish'].map((cmd) => (
              <div
                key={cmd}
                className="bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm text-center text-slate-700 dark:text-slate-300"
              >
                "{cmd}"
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Content Display with Highlighting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Lesson Content</h3>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Auto-scroll</span>
          </label>
        </div>

        <div
          ref={contentRef}
          className="max-h-96 overflow-y-auto prose dark:prose-invert prose-slate leading-relaxed"
        >
          {highlightText(content)}
        </div>
      </motion.div>

      {/* Progress Indicator */}
      {isPlaying && (
        <div className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 px-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Progress:</span>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentWordIndex / content.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {Math.round((currentWordIndex / content.length) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
