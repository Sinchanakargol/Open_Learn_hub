import jwt from 'jsonwebtoken'

const rooms = new Map() // Store room information

export function setupVideoCallSocket(io) {
  // Middleware for authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        socket.userId = decoded.id
        socket.userRole = decoded.role
        socket.userName = decoded.name || 'User'
        next()
      } else {
        next(new Error('Authentication error'))
      }
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId, socket.userName)

    // Join a consultation room
    socket.on('join-room', ({ consultationId, role }) => {
      socket.join(consultationId)
      socket.consultationId = consultationId
      console.log(`${socket.userName} (${role}) joined room: ${consultationId}`)

      // Initialize room if it doesn't exist
      if (!rooms.has(consultationId)) {
        rooms.set(consultationId, {
          participants: []
        })
      }

      const room = rooms.get(consultationId)
      room.participants.push({
        socketId: socket.id,
        userId: socket.userId,
        role: socket.userRole,
        name: socket.userName
      })

      // Notify others in the room (include socketId and userId)
      socket.to(consultationId).emit('user-joined', {
        socketId: socket.id,
        userId: socket.userId,
        role: socket.userRole,
        name: socket.userName
      })

      // Send current participants to the new user
      const otherParticipants = room.participants.filter(p => p.socketId !== socket.id)
      socket.emit('room-participants', otherParticipants)
    })

    // WebRTC Signaling: Offer
    socket.on('offer', ({ consultationId, offer }) => {
      console.log('Relaying offer to room:', consultationId)
      socket.to(consultationId).emit('offer', {
        offer,
        from: socket.userName,
        fromSocketId: socket.id,
        fromUserId: socket.userId
      })
    })

    // WebRTC Signaling: Answer
    socket.on('answer', ({ consultationId, answer }) => {
      console.log('Relaying answer to room:', consultationId)
      socket.to(consultationId).emit('answer', {
        answer,
        from: socket.userName,
        fromSocketId: socket.id,
        fromUserId: socket.userId
      })
    })

    // WebRTC Signaling: ICE Candidate
    socket.on('ice-candidate', ({ consultationId, candidate }) => {
      console.log('Relaying ICE candidate to room:', consultationId)
      socket.to(consultationId).emit('ice-candidate', {
        candidate,
        from: socket.userName,
        fromSocketId: socket.id,
        fromUserId: socket.userId
      })
    })

    // Chat messages
    socket.on('chat-message', ({ consultationId, message }) => {
      console.log('Chat message in room:', consultationId)
      socket.to(consultationId).emit('chat-message', {
        message,
        from: socket.userName,
        timestamp: new Date().toISOString()
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId)

      // Remove from all rooms
      rooms.forEach((room, consultationId) => {
        const index = room.participants.findIndex(p => p.socketId === socket.id)
        if (index !== -1) {
          room.participants.splice(index, 1)
          
          // Notify others
          socket.to(consultationId).emit('user-left', {
            userId: socket.userId,
            name: socket.userName
          })

          // Clean up empty rooms
          if (room.participants.length === 0) {
            rooms.delete(consultationId)
          }
        }
      })
    })
  })
}
