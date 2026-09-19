import mongoose from 'mongoose'

const referralSchema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  code: { type: String, unique: true, required: true },
  status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
  
  reward: {
    type: { type: String, enum: ['premium-days', 'credits', 'discount', 'course-access'] },
    value: { type: Number },
    claimed: { type: Boolean, default: false },
    claimedAt: { type: Date }
  },
  
  refereeReward: {
    type: { type: String, enum: ['premium-days', 'credits', 'discount', 'course-access'] },
    value: { type: Number },
    claimed: { type: Boolean, default: false }
  },
  
  registeredAt: { type: Date },
  expiresAt: { type: Date },
  
  metadata: {
    source: { type: String }, // 'email', 'social', 'link'
    clicks: { type: Number, default: 0 },
    lastClickedAt: { type: Date }
  }
}, { timestamps: true })

referralSchema.index({ code: 1 })
referralSchema.index({ referrer: 1 })

// Generate unique referral code
referralSchema.pre('save', function(next) {
  if (!this.code) {
    this.code = 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase()
  }
  next()
})

export default mongoose.model('Referral', referralSchema)
