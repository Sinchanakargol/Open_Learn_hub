import jwt from 'jsonwebtoken'
import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'

export function setupMessagingSocket(io) {
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
    console.log('User connected to messaging:', socket.userId, socket.userName)

    // Join user's personal room (for direct messages)
    socket.join(`user:${socket.userId}`)

    // Join conversation room
    socket.on('join-conversation', async ({ conversationId }) => {
      try {
        // Verify user is part of the conversation
        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' })
          return
        }

        const isParticipant = conversation.participants.some(
          p => p.toString() === socket.userId
        )

        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to join this conversation' })
          return
        }

        socket.join(`conversation:${conversationId}`)
        console.log(`User ${socket.userName} joined conversation: ${conversationId}`)

        // Mark messages as read
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.userId },
            'readBy.user': { $ne: socket.userId }
          },
          {
            $push: {
              readBy: {
                user: socket.userId,
                readAt: new Date()
              }
            }
          }
        )

        // Notify others that user is online
        socket.to(`conversation:${conversationId}`).emit('user-online', {
          userId: socket.userId,
          userName: socket.userName
        })
      } catch (error) {
        console.error('Error joining conversation:', error)
        socket.emit('error', { message: 'Failed to join conversation' })
      }
    })

    // Leave conversation room
    socket.on('leave-conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`)
      socket.to(`conversation:${conversationId}`).emit('user-offline', {
        userId: socket.userId,
        userName: socket.userName
      })
    })

    // Send message
    socket.on('send-message', async ({ conversationId, content, type = 'text', replyTo }) => {
      try {
        // Verify user is part of the conversation
        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' })
          return
        }

        const isParticipant = conversation.participants.some(
          p => p.toString() === socket.userId
        )

        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to send messages' })
          return
        }

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          content,
          type,
          replyTo,
          readBy: [{
            user: socket.userId,
            readAt: new Date()
          }]
        })

        // Populate sender info
        await message.populate('sender', 'name email role avatar')
        if (replyTo) {
          await message.populate('replyTo', 'content sender')
        }

        // Update conversation's last message
        conversation.lastMessage = {
          content,
          sender: socket.userId,
          timestamp: new Date()
        }
        await conversation.save()

        // Broadcast message to conversation room
        io.to(`conversation:${conversationId}`).emit('new-message', {
          message: message.toObject()
        })

        // Send notification to offline participants
        const onlineUsers = await io.in(`conversation:${conversationId}`).fetchSockets()
        const onlineUserIds = onlineUsers.map(s => s.userId)
        
        conversation.participants.forEach(participantId => {
          const pid = participantId.toString()
          if (pid !== socket.userId && !onlineUserIds.includes(pid)) {
            // Send push notification to offline user (implement as needed)
            io.to(`user:${pid}`).emit('new-message-notification', {
              conversationId,
              message: {
                sender: socket.userName,
                content,
                timestamp: new Date()
              }
            })
          }
        })

      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Typing indicator
    socket.on('typing-start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName
      })
    })

    socket.on('typing-stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
        userId: socket.userId
      })
    })

    // Mark message as read
    socket.on('mark-read', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId)
        if (!message) return

        const alreadyRead = message.readBy.some(
          r => r.user.toString() === socket.userId
        )

        if (!alreadyRead) {
          message.readBy.push({
            user: socket.userId,
            readAt: new Date()
          })
          await message.save()

          // Notify sender
          io.to(`user:${message.sender}`).emit('message-read', {
            messageId,
            readBy: socket.userId,
            readAt: new Date()
          })
        }
      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    })

    // Edit message
    socket.on('edit-message', async ({ messageId, newContent }) => {
      try {
        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('error', { message: 'Message not found' })
          return
        }

        if (message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized to edit this message' })
          return
        }

        message.content = newContent
        message.isEdited = true
        message.editedAt = new Date()
        await message.save()

        // Broadcast edit to conversation
        io.to(`conversation:${message.conversation}`).emit('message-edited', {
          messageId,
          newContent,
          editedAt: message.editedAt
        })
      } catch (error) {
        console.error('Error editing message:', error)
        socket.emit('error', { message: 'Failed to edit message' })
      }
    })

    // Delete message
    socket.on('delete-message', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('error', { message: 'Message not found' })
          return
        }

        if (message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized to delete this message' })
          return
        }

        await message.deleteOne()

        // Broadcast deletion to conversation
        io.to(`conversation:${message.conversation}`).emit('message-deleted', {
          messageId
        })
      } catch (error) {
        console.error('Error deleting message:', error)
        socket.emit('error', { message: 'Failed to delete message' })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected from messaging:', socket.userId)
    })
  })
}
