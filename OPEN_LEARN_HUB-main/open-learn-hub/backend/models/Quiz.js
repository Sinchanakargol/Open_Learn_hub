import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  prompt: String,
  options: [String],
  answerIndex: Number,
  difficulty: { type: Number, default: 1 }
}, { _id: false })

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  questions: [questionSchema]
}, { timestamps: true })

export default mongoose.model('Quiz', quizSchema)
