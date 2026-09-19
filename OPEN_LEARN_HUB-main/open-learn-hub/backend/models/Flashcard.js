import mongoose from 'mongoose'

const flashcardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  deck: { type: String, required: true }, // Deck name
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  
  // Spaced Repetition System (SRS)
  easeFactor: { type: Number, default: 2.5 },
  interval: { type: Number, default: 0 }, // Days until next review
  repetitions: { type: Number, default: 0 },
  nextReviewDate: { type: Date, default: Date.now },
  lastReviewedAt: { type: Date },
  
  // Stats
  totalReviews: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  
  isAiGenerated: { type: Boolean, default: false },
  tags: [{ type: String }]
}, { timestamps: true })

flashcardSchema.index({ user: 1, deck: 1 })
flashcardSchema.index({ nextReviewDate: 1 })

export default mongoose.model('Flashcard', flashcardSchema)
