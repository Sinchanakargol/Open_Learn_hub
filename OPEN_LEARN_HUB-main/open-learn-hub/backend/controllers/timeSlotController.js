import TimeSlot from '../models/TimeSlot.js'
import User from '../models/User.js'

// Create time slots (for instructors)
export async function createTimeSlots(req, res) {
  try {
    const { date, slots } = req.body // slots: [{ startTime, endTime, duration }]
    
    const timeSlots = slots.map(slot => ({
      instructor: req.user.id,
      date: new Date(date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration || 60
    }))
    
    const created = await TimeSlot.insertMany(timeSlots)
    res.json(created)
  } catch (error) {
    console.error('Create time slots error:', error)
    res.status(500).json({ message: 'Failed to create time slots' })
  }
}

// Get instructor's time slots
export async function getInstructorTimeSlots(req, res) {
  try {
    const timeSlots = await TimeSlot.find({ instructor: req.user.id })
      .populate('bookedBy', 'name email')
      .sort({ date: 1, startTime: 1 })
    
    res.json(timeSlots)
  } catch (error) {
    console.error('Get time slots error:', error)
    res.status(500).json({ message: 'Failed to fetch time slots' })
  }
}

// Get available slots for an instructor (for students)
export async function getAvailableSlots(req, res) {
  try {
    const { instructorId } = req.params
    const { fromDate } = req.query
    
    // Get today's date at midnight for proper comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const query = {
      instructor: instructorId,
      isBooked: false
    }
    
    if (fromDate) {
      const startDate = new Date(fromDate)
      startDate.setHours(0, 0, 0, 0)
      query.date = { $gte: startDate }
    } else {
      query.date = { $gte: today }
    }
    
    const timeSlots = await TimeSlot.find(query)
      .sort({ date: 1, startTime: 1 })
      .limit(50)
    
    console.log(`Found ${timeSlots.length} available slots for instructor ${instructorId}`)
    res.json(timeSlots)
  } catch (error) {
    console.error('Get available slots error:', error)
    res.status(500).json({ message: 'Failed to fetch available slots' })
  }
}

// Delete time slot
export async function deleteTimeSlot(req, res) {
  try {
    const { id } = req.params
    
    const timeSlot = await TimeSlot.findOne({ _id: id, instructor: req.user.id })
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' })
    }
    
    if (timeSlot.isBooked) {
      return res.status(400).json({ message: 'Cannot delete booked time slot' })
    }
    
    await TimeSlot.findByIdAndDelete(id)
    res.json({ message: 'Time slot deleted' })
  } catch (error) {
    console.error('Delete time slot error:', error)
    res.status(500).json({ message: 'Failed to delete time slot' })
  }
}
