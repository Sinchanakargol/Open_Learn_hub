import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import connectMongo from './config/db.js'
import { redis } from './config/redis.js'
import authRoutes from './routes/auth.js'
import courseRoutes from './routes/courses.js'
import aiRoutes from './routes/ai.js'
import adminRoutes from './routes/admin.js'
import enrollmentRoutes from './routes/enrollments.js'
import quizRoutes from './routes/quizzes.js'
import discussionRoutes from './routes/discussions.js'
import leaderboardRoutes from './routes/leaderboard.js'
import codelabRoutes from './routes/codelab.js'
import consultationRoutes from './routes/consultations.js'
import timeSlotRoutes from './routes/timeSlots.js'
import messagingRoutes from './routes/messaging.js'
import badgeRoutes from './routes/badges.js'
import certificateRoutes from './routes/certificates.js'
import reviewRoutes from './routes/reviews.js'
import noteRoutes from './routes/notes.js'
import flashcardRoutes from './routes/flashcards.js'
import studyPlanRoutes from './routes/studyPlans.js'
import studyGroupRoutes from './routes/studyGroups.js'
import jobRoutes from './routes/jobs.js'
import learningPathRoutes from './routes/learningPaths.js'
import referralRoutes from './routes/referrals.js'
import studyMaterialRoutes from './routes/studyMaterials.js'
import mathSolverRoutes from './routes/mathSolverRoutes.js'
import { setupVideoCallSocket } from './sockets/videoCall.js'
import { setupMessagingSocket } from './sockets/messaging.js'
import { setupStudyGroupSocket } from './sockets/studyGroup.js'

dotenv.config()
const app = express()
const server = http.createServer(app)

// Configure allowed origins
const allowedOrigins = process.env.CLIENT_ORIGIN 
  ? process.env.CLIENT_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173']

const io = new SocketIOServer(server, {
  cors: { 
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true)
      
      // Check if origin is in allowed list or matches Vercel preview pattern
      if (allowedOrigins.includes(origin) || origin.match(/https:\/\/.*\.vercel\.app$/)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }, 
    credentials: true 
  }
})

// Middleware for socket authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (token) {
      // Decode token and attach user to socket
      const jwt = await import('jsonwebtoken')
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'dev_secret')
      socket.user = decoded
    }
    next()
  } catch (err) {
    next()
  }
})

// CodeLab socket handlers
io.on('connection', socket => {
  socket.on('joinRoom', (room)=> socket.join(room))
  socket.on('codeChange', ({room, code})=> socket.to(room).emit('codeChange', code))
})

// Video call socket handlers
setupVideoCallSocket(io)

// Messaging socket handlers
setupMessagingSocket(io)

// Study group socket handlers
setupStudyGroupSocket(io)

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list or matches Vercel preview pattern
    if (allowedOrigins.includes(origin) || origin.match(/https:\/\/.*\.vercel\.app$/)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }, 
  credentials: true 
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

app.get('/api/health', (req,res)=>res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/discussions', discussionRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/codelab', codelabRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/timeslots', timeSlotRoutes)
app.use('/api/messaging', messagingRoutes)
app.use('/api/badges', badgeRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/flashcards', flashcardRoutes)
app.use('/api/study-plans', studyPlanRoutes)
app.use('/api/study-groups', studyGroupRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/learning-paths', learningPathRoutes)
app.use('/api/referrals', referralRoutes)
app.use('/api/study-materials', studyMaterialRoutes)
app.use('/api/math-solver', mathSolverRoutes)

const PORT = process.env.PORT || 5000
connectMongo().then(()=>{
  server.listen(PORT, ()=> {
    console.log(`🚀 Backend server running on port ${PORT}`)
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`)
    console.log(`✅ CORS configured for all *.vercel.app domains`)
  })
}).catch(err=>{
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})
