import mongoose from 'mongoose'

const lessonSchema = new mongoose.Schema({
  title: String,
  content: String,
  duration: Number,
  videoUrl: String,
  videoType: { type: String, enum: ['youtube', 'vimeo', 'upload', 'url'], default: 'url' },
  hasQuiz: { type: Boolean, default: false }
}, { _id: true })

const quizSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number, // Index of correct option
    points: { type: Number, default: 1 }
  }],
  passingPercentage: { type: Number, default: 70 },
  totalPoints: { type: Number, default: 0 }
}, { _id: true })

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  level: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lessons: [lessonSchema],
  quizzes: [quizSchema],
  completionPoints: { type: Number, default: 100 }, // Points awarded on course completion
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true })

export default mongoose.model('Course', courseSchema)
