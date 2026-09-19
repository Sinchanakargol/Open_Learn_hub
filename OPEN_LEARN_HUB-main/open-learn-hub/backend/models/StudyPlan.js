import mongoose from 'mongoose'

const studyPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  goal: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  courses: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    targetCompletionDate: { type: Date },
    hoursPerWeek: { type: Number, default: 5 }
  }],
  
  schedule: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    timeSlots: [{
      startTime: { type: String }, // HH:MM format
      endTime: { type: String },
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      activity: { type: String } // 'study', 'quiz', 'review', 'practice'
    }]
  }],
  
  milestones: [{
    title: { type: String },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  
  isAiGenerated: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'completed', 'paused', 'archived'], default: 'active' },
  progress: { type: Number, default: 0 } // Percentage
}, { timestamps: true })

studyPlanSchema.index({ user: 1, status: 1 })

export default mongoose.model('StudyPlan', studyPlanSchema)
