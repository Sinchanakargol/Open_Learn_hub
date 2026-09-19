import mongoose from 'mongoose'

const consultationSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  duration: { 
    type: Number, 
    default: 30 // minutes
  },
  scheduledAt: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentId: String,
  paymentStatus: String,
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  notes: String,
  rating: Number,
  feedback: String
}, { timestamps: true })

export default mongoose.model('Consultation', consultationSchema)
