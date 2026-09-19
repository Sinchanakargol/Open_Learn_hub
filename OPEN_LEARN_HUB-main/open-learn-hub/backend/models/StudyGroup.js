import mongoose from 'mongoose'

const studyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  
  maxMembers: { type: Number, default: 50 },
  isPrivate: { type: Boolean, default: false },
  inviteCode: { type: String, unique: true },
  
  resources: [{
    type: { type: String, enum: ['note', 'link', 'file', 'video'] },
    title: { type: String },
    content: { type: String },
    url: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  sessions: [{
    title: { type: String },
    scheduledAt: { type: Date },
    duration: { type: Number }, // minutes
    type: { type: String, enum: ['video', 'chat', 'quiz'] },
    meetingLink: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  achievements: [{
    title: { type: String },
    achievedAt: { type: Date, default: Date.now },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    avgSessionAttendance: { type: Number, default: 0 }
  }
}, { timestamps: true })

studyGroupSchema.index({ course: 1 })
studyGroupSchema.index({ inviteCode: 1 })

// Generate unique invite code
studyGroupSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  }
  next()
})

export default mongoose.model('StudyGroup', studyGroupSchema)
