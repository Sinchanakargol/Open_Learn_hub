import mongoose from 'mongoose'

const learningPathSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  goal: { type: String }, // 'career-switch', 'skill-upgrade', 'hobby', 'certification'
  targetRole: { type: String },
  
  currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  targetLevel: { type: String, enum: ['intermediate', 'advanced', 'expert'], default: 'advanced' },
  
  steps: [{
    order: { type: Number },
    title: { type: String },
    description: { type: String },
    type: { type: String, enum: ['course', 'quiz', 'project', 'reading', 'practice'] },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    estimatedHours: { type: Number },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    isOptional: { type: Boolean, default: false }
  }],
  
  skills: [{
    name: { type: String },
    currentProficiency: { type: Number, min: 0, max: 100 },
    targetProficiency: { type: Number, min: 0, max: 100 },
    relatedSteps: [{ type: Number }] // Step indexes
  }],
  
  milestones: [{
    title: { type: String },
    description: { type: String },
    requiredSteps: [{ type: Number }],
    reward: { type: String },
    completed: { type: Boolean, default: false }
  }],
  
  isAiGenerated: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  progress: { type: Number, default: 0 }, // Percentage
  startedAt: { type: Date },
  estimatedCompletionDate: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true })

learningPathSchema.index({ user: 1 })
learningPathSchema.index({ isPublic: 1 })

export default mongoose.model('LearningPath', learningPathSchema)
