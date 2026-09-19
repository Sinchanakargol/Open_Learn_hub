import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progress: { type: Number, default: 0 },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
  quizScores: [{
    quizId: { type: mongoose.Schema.Types.ObjectId },
    lessonId: { type: mongoose.Schema.Types.ObjectId },
    score: Number,
    totalPoints: Number,
    passed: Boolean,
    completedAt: Date
  }],
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  pointsEarned: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now }
}, { timestamps: true })

// Add unique compound index to prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true })

export default mongoose.model('Enrollment', enrollmentSchema)
