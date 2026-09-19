import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  name: { type: String }, // For group chats
  type: { 
    type: String, 
    enum: ['direct', 'group', 'course'],
    required: true 
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }, // For course-based conversations
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

// Index for faster queries
conversationSchema.index({ participants: 1 })
conversationSchema.index({ course: 1 })

export default mongoose.model('Conversation', conversationSchema)
