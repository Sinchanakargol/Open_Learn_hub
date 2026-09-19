import Consultation from '../models/Consultation.js'
import User from '../models/User.js'
import TimeSlot from '../models/TimeSlot.js'
import Conversation from '../models/Conversation.js'
import crypto from 'crypto'

// Juspay configuration
const JUSPAY_API_KEY = process.env.JUSPAY_API_KEY || 'test_key'
const JUSPAY_MERCHANT_ID = process.env.JUSPAY_MERCHANT_ID || 'test_merchant'

// Get available instructors with their rates
export async function getInstructors(req, res) {
  try {
    const instructors = await User.find({ 
      role: 'instructor',
      consultationRate: { $exists: true, $gt: 0 }
    }).select('name email consultationRate bio expertise rating totalRatings')
    
    res.json(instructors)
  } catch (error) {
    console.error('Get instructors error:', error)
    res.status(500).json({ message: 'Failed to fetch instructors' })
  }
}

// Create consultation booking
export async function createConsultation(req, res) {
  try {
    const { timeSlotId, notes } = req.body
    
    // Get time slot
    const timeSlot = await TimeSlot.findById(timeSlotId).populate('instructor')
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' })
    }
    
    if (timeSlot.isBooked) {
      return res.status(400).json({ message: 'Time slot already booked' })
    }
    
    const instructor = timeSlot.instructor
    const amount = instructor.consultationRate || 500
    
    // Create scheduled date-time
    const scheduledAt = new Date(timeSlot.date)
    const [hours, minutes] = timeSlot.startTime.split(':')
    scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    // Create consultation
    const consultation = await Consultation.create({
      student: req.user.id,
      instructor: instructor._id,
      amount,
      duration: timeSlot.duration,
      scheduledAt,
      notes,
      status: 'pending'
    })
    
    // Generate payment order
    const paymentOrder = await createJuspayOrder(consultation)
    
    const populated = await Consultation.findById(consultation._id)
      .populate('student', 'name email')
      .populate('instructor', 'name email')
    
    res.json({
      consultation: populated,
      paymentOrder,
      timeSlotId
    })
  } catch (error) {
    console.error('Create consultation error:', error)
    res.status(500).json({ message: 'Failed to create consultation', error: error.message })
  }
}

// Create Juspay payment order
async function createJuspayOrder(consultation) {
  // In production, this would call Juspay API
  // For now, return mock order
  const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    orderId,
    amount: consultation.amount,
    currency: 'INR',
    consultationId: consultation._id,
    // Juspay SDK initialization data
    sdkPayload: {
      merchantId: JUSPAY_MERCHANT_ID,
      orderId,
      amount: consultation.amount,
      customerId: consultation.student.toString(),
      customerEmail: '', // Would be populated from user
      customerPhone: '', // Would be populated from user
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/consultations/payment-callback`
    }
  }
}

// Handle payment callback
export async function handlePaymentCallback(req, res) {
  try {
    const { orderId, status, consultationId, paymentId, timeSlotId } = req.body
    
    const consultation = await Consultation.findById(consultationId)
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' })
    }
    
    // Verify payment with Juspay (in production)
    // For now, accept the status
    
    if (status === 'success' || status === 'CHARGED') {
      consultation.status = 'paid'
      consultation.paymentId = paymentId || orderId
      consultation.paymentStatus = 'success'
      
      // Create or get conversation for this consultation
      let conversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [consultation.student, consultation.instructor] }
      })
      
      if (!conversation) {
        conversation = await Conversation.create({
          type: 'direct',
          participants: [consultation.student, consultation.instructor],
          name: `Consultation Chat`
        })
      }
      
      consultation.conversation = conversation._id
      await consultation.save()
      
      // Mark time slot as booked
      if (timeSlotId) {
        await TimeSlot.findByIdAndUpdate(timeSlotId, {
          isBooked: true,
          bookedBy: consultation.student,
          consultation: consultation._id
        })
      }
      
      res.json({ 
        success: true, 
        message: 'Payment successful',
        consultation: await Consultation.findById(consultation._id)
          .populate('student', 'name email')
          .populate('instructor', 'name email')
      })
    } else {
      consultation.paymentStatus = 'failed'
      await consultation.save()
      
      res.status(400).json({ 
        success: false, 
        message: 'Payment failed' 
      })
    }
  } catch (error) {
    console.error('Payment callback error:', error)
    res.status(500).json({ message: 'Payment processing failed' })
  }
}

// Get single consultation
export async function getConsultation(req, res) {
  try {
    const { id } = req.params
    const consultation = await Consultation.findById(id)
      .populate('student', 'name email')
      .populate('instructor', 'name email')
      .populate('conversation')
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' })
    }
    
    // Check authorization
    if (consultation.instructor._id.toString() !== req.user.id && 
        consultation.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' })
    }
    
    res.json(consultation)
  } catch (error) {
    console.error('Get consultation error:', error)
    res.status(500).json({ message: 'Failed to fetch consultation' })
  }
}

// Get user's consultations (student or instructor)
export async function getMyConsultations(req, res) {
  try {
    let consultations
    
    // Determine query based on user role
    if (req.user.role === 'instructor' || req.user.role === 'admin') {
      consultations = await Consultation.find({ instructor: req.user.id })
        .populate('student', 'name email')
        .sort({ scheduledAt: -1 })
    } else {
      consultations = await Consultation.find({ student: req.user.id })
        .populate('instructor', 'name email expertise')
        .sort({ scheduledAt: -1 })
    }
    
    res.json(consultations)
  } catch (error) {
    console.error('Get consultations error:', error)
    res.status(500).json({ message: 'Failed to fetch consultations' })
  }
}

// Get instructor's consultations (for instructor dashboard)
export async function getInstructorConsultations(req, res) {
  try {
    const consultations = await Consultation.find({ instructor: req.user.id })
      .populate('student', 'name email')
      .sort({ scheduledAt: -1 })
    
    res.json(consultations)
  } catch (error) {
    console.error('Get instructor consultations error:', error)
    res.status(500).json({ message: 'Failed to fetch consultations' })
  }
}

// Get instructor earnings
export async function getInstructorEarnings(req, res) {
  try {
    const consultations = await Consultation.find({ 
      instructor: req.user.id,
      status: { $in: ['paid', 'completed'] }
    })
    
    const totalEarnings = consultations.reduce((sum, c) => sum + c.amount, 0)
    const completedCount = consultations.filter(c => c.status === 'completed').length
    const upcomingCount = consultations.filter(c => c.status === 'paid' && new Date(c.scheduledAt) > new Date()).length
    
    // Get unique students count
    const uniqueStudents = new Set(consultations.map(c => c.student.toString()))
    const totalStudents = uniqueStudents.size
    
    // Get instructor rating
    const instructor = await User.findById(req.user.id).select('rating totalRatings')
    
    res.json({
      totalEarnings,
      completedCount,
      upcomingCount,
      totalStudents,
      rating: instructor?.rating || 0,
      totalRatings: instructor?.totalRatings || 0,
      consultations: consultations.slice(0, 10) // Recent 10
    })
  } catch (error) {
    console.error('Get earnings error:', error)
    res.status(500).json({ message: 'Failed to fetch earnings' })
  }
}

// Update consultation status
export async function updateConsultationStatus(req, res) {
  try {
    const { id } = req.params
    const { status, rating, feedback } = req.body
    
    const consultation = await Consultation.findById(id)
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' })
    }
    
    // Check authorization
    if (consultation.instructor.toString() !== req.user.id && 
        consultation.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' })
    }
    
    if (status) consultation.status = status
    if (feedback) consultation.feedback = feedback
    
    // Handle rating update
    if (rating && consultation.student.toString() === req.user.id) {
      consultation.rating = rating
      
      // Update instructor's average rating
      const instructor = await User.findById(consultation.instructor)
      if (instructor) {
        const currentTotal = instructor.rating * instructor.totalRatings
        instructor.totalRatings += 1
        instructor.rating = (currentTotal + rating) / instructor.totalRatings
        await instructor.save()
      }
    }
    
    await consultation.save()
    
    const updated = await Consultation.findById(id)
      .populate('student', 'name email')
      .populate('instructor', 'name email rating totalRatings')
    
    res.json(updated)
  } catch (error) {
    console.error('Update consultation error:', error)
    res.status(500).json({ message: 'Failed to update consultation' })
  }
}
