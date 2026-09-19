import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  aiSummary: { type: String }, // AI-generated summary
  tags: [{ type: String }],
  isAiGenerated: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  linkedNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }]
}, { timestamps: true })

noteSchema.index({ user: 1, course: 1 })
noteSchema.index({ tags: 1 })

export default mongoose.model('Note', noteSchema)
