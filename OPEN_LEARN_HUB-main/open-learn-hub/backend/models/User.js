import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student','instructor','admin'], default: 'student' },
  points: { type: Number, default: 0 }, // Leaderboard points
  consultationRate: { type: Number, default: 0 }, // Per session rate for instructors
  bio: String,
  expertise: [String],
  rating: { type: Number, default: 0 }, // Average rating
  totalRatings: { type: Number, default: 0 } // Number of ratings received
}, { timestamps: true })

userSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = function(pw){ return bcrypt.compare(pw, this.password) }

export default mongoose.model('User', userSchema)
