import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import io from 'socket.io-client'
import api from '../services/api'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
}

export default function VideoCall() {
  const { consultationId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  
  const [socket, setSocket] = useState(null)
  const [consultation, setConsultation] = useState(null)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [participantName, setParticipantName] = useState('')
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const userRole = useRef(null)
  const remotePeerUserId = useRef(null) // Track which user we're connected to

  useEffect(() => {
    initializeCall()
    return () => cleanup()
  }, [consultationId])

  const initializeCall = async () => {
    try {
      // Fetch consultation details
      const { data } = await api.get(`/consultations/${consultationId}`)
      setConsultation(data)
      
      // Determine user role
      if (!user) {
        throw new Error('User not authenticated')
      }
      userRole.current = user.role
      
      // Connect to signaling server
      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
      const newSocket = io(socketUrl, {
        auth: { token: localStorage.getItem('token') }
      })
      
      setSocket(newSocket)
      
      // Setup socket listeners
      setupSocketListeners(newSocket)
      
      // Join room
      newSocket.emit('join-room', { consultationId, role: userRole.current })
      
      // Initialize media
      await initializeMedia()
      
    } catch (error) {
      console.error('Failed to initialize call:', error)
      setError('Failed to initialize video call. Please check your permissions.')
    }
  }

  const initializeMedia = async () => {
    try {
      // Try to get video + audio first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      setConnectionStatus('Waiting for other participant...')
    } catch (error) {
      console.error('Media access error:', error)
      
      // If camera is in use, try audio-only mode
      if (error.name === 'NotReadableError' || error.message.includes('in use')) {
        console.log('Camera in use, trying audio-only mode...')
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          })
          
          setLocalStream(audioStream)
          setIsVideoEnabled(false)
          setConnectionStatus('Waiting for other participant... (Audio only)')
          console.log('Joined in audio-only mode')
          return
        } catch (audioError) {
          console.error('Audio-only mode also failed:', audioError)
          setError('Could not access microphone. Please check your permissions.')
          return
        }
      }
      
      // Handle other error types
      if (error.name === 'NotAllowedError') {
        setError('Camera/microphone access denied. Please allow permissions in your browser settings and refresh.')
      } else if (error.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a camera/microphone and refresh.')
      } else {
        setError('Could not access camera/microphone. Please check your device and browser permissions.')
      }
    }
  }

  const setupSocketListeners = (socket) => {
    socket.on('user-joined', async ({ socketId, userId, role, name }) => {
      console.log('User joined:', role, name, 'userId:', userId)
      
      // Ignore if it's the same user (different tab)
      if (userId === user.id) {
        console.log('Ignoring same user connection from different tab')
        return
      }
      
      // If we don't have a peer connection yet, or connecting to a different user
      if (!remotePeerUserId.current || remotePeerUserId.current !== userId) {
        remotePeerUserId.current = userId
        setParticipantName(name)
        setConnectionStatus('Connecting to peer...')
        
        // Initiator creates offer
        if (userRole.current === 'instructor') {
          await createPeerConnection(socket)
          await createOffer(socket)
        }
      }
    })

    socket.on('offer', async ({ offer, from, fromUserId }) => {
      console.log('Received offer from:', from, 'userId:', fromUserId)
      
      // Ignore offers from same user (different tab)
      if (fromUserId === user.id) {
        console.log('Ignoring offer from same user (different tab)')
        return
      }
      
      // Track the remote peer
      remotePeerUserId.current = fromUserId
      setConnectionStatus('Establishing connection...')
      await createPeerConnection(socket)
      await handleOffer(offer, socket)
    })

    socket.on('answer', async ({ answer, fromUserId }) => {
      console.log('Received answer from userId:', fromUserId)
      
      // Ignore answers from same user (different tab)
      if (fromUserId === user.id) {
        console.log('Ignoring answer from same user (different tab)')
        return
      }
      
      // Only process if from the peer we're connected to
      if (fromUserId === remotePeerUserId.current) {
        await handleAnswer(answer)
      }
    })

    socket.on('ice-candidate', async ({ candidate, fromUserId }) => {
      console.log('Received ICE candidate from userId:', fromUserId)
      
      // Ignore ICE candidates from same user (different tab)
      if (fromUserId === user.id) {
        console.log('Ignoring ICE candidate from same user (different tab)')
        return
      }
      
      // Only process if from the peer we're connected to
      if (fromUserId === remotePeerUserId.current) {
        await handleIceCandidate(candidate)
      }
    })

    socket.on('chat-message', ({ message, from, timestamp }) => {
      setMessages(prev => [...prev, { message, from, timestamp, isOwn: false }])
    })

    socket.on('user-left', ({ userId }) => {
      // Only handle if the user who left is our connected peer
      if (userId === remotePeerUserId.current) {
        setConnectionStatus('Participant left the call')
        setRemoteStream(null)
        remotePeerUserId.current = null
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close()
          peerConnectionRef.current = null
        }
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setError('Connection failed. Please refresh and try again.')
    })
  }

  const createPeerConnection = async (socket) => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnectionRef.current = pc

      // Add local stream tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream)
        })
      }

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log('Received remote track')
        setRemoteStream(event.streams[0])
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
        setConnectionStatus('Connected')
        setIsCallStarted(true)
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            consultationId,
            candidate: event.candidate
          })
        }
      }

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          setConnectionStatus('Connected')
        } else if (pc.connectionState === 'failed') {
          setConnectionStatus('Connection failed')
        }
      }

    } catch (error) {
      console.error('Error creating peer connection:', error)
      setError('Failed to establish peer connection')
    }
  }

  const createOffer = async (socket) => {
    try {
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)
      
      socket.emit('offer', {
        consultationId,
        offer
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  const handleOffer = async (offer, socket) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      
      socket.emit('answer', {
        consultationId,
        answer
      })
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const handleIceCandidate = async (candidate) => {
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error('Error adding ICE candidate:', error)
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      const message = {
        message: newMessage,
        from: 'You',
        timestamp: new Date().toISOString(),
        isOwn: true
      }
      
      setMessages(prev => [...prev, message])
      socket.emit('chat-message', {
        consultationId,
        message: newMessage
      })
      setNewMessage('')
    }
  }

  const endCall = () => {
    cleanup()
    navigate('/my-consultations')
  }

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (socket) {
      socket.disconnect()
    }
    remotePeerUserId.current = null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-red-500/20 border border-red-500 rounded-2xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => navigate('/my-consultations')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            Back to Consultations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {consultation?.instructor?.name || consultation?.student?.name || 'Video Consultation'}
            </h1>
            <p className="text-sm text-slate-400">{connectionStatus}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
              {consultation?.duration || 60} min session
            </span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Remote Video (Large) */}
        <div className="relative w-full h-full flex items-center justify-center">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain rounded-2xl bg-slate-800"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-5xl font-bold mb-4">
                {participantName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <p className="text-lg font-semibold">{connectionStatus}</p>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <motion.div
          drag
          dragConstraints={{ left: -400, right: 400, top: -200, bottom: 200 }}
          className="absolute bottom-4 right-4 w-64 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 cursor-move"
        >
          {isVideoEnabled && localStream?.getVideoTracks().length > 0 ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-slate-800 mirror"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mb-2 mx-auto">
                  {user?.name?.charAt(0)?.toUpperCase() || 'Y'}
                </div>
                <p className="text-white text-xs">Audio Only</p>
              </div>
            </div>
          )}
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-900/80 text-white text-xs font-semibold">
            You {!isVideoEnabled && '(Audio)'}
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all ${
              isAudioEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {isVideoEnabled ? '📹' : '🚫'}
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all relative"
            title="Chat"
          >
            💬
            {messages.filter(m => !m.isOwn).length > 0 && !isChatOpen && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            )}
          </button>

          <button
            onClick={endCall}
            className="px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-all"
          >
            End Call
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-slate-800 border-l border-slate-700 flex flex-col"
          >
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Chat</h2>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-slate-500 text-center text-sm">No messages yet</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-xl ${
                        msg.isOwn
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  )
}
