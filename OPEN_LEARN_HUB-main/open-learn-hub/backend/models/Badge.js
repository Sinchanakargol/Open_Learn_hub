import mongoose from 'mongoose'

const badgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['course', 'quiz', 'engagement', 'achievement', 'special'],
    default: 'achievement'
  },
  color: {
    type: String,
    default: 'from-blue-500 to-cyan-500'
  },
  criteria: {
    type: String, // e.g., 'complete_5_courses', 'score_90_quiz'
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// Index for faster queries
badgeSchema.index({ user: 1, criteria: 1 })

export default mongoose.model('Badge', badgeSchema)
