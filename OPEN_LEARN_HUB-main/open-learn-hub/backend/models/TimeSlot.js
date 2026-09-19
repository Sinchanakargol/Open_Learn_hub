import mongoose from 'mongoose'

const timeSlotSchema = new mongoose.Schema({
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  }, // e.g., "10:00"
  endTime: { 
    type: String, 
    required: true 
  }, // e.g., "11:00"
  duration: { 
    type: Number, 
    default: 60 
  }, // minutes
  isBooked: { 
    type: Boolean, 
    default: false 
  },
  bookedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  consultation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Consultation' 
  }
}, { timestamps: true })

// Index for efficient queries
timeSlotSchema.index({ instructor: 1, date: 1, isBooked: 1 })

export default mongoose.model('TimeSlot', timeSlotSchema)
