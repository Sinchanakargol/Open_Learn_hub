import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'

export default function TalkToTeacher() {
  const [instructors, setInstructors] = useState([])
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState(null)

  useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
    try {
      const { data } = await api.get('/consultations/instructors')
      console.log('Fetched instructors:', data.length)
      setInstructors(data)
    } catch (error) {
      console.error('Failed to fetch instructors:', error)
      alert('Failed to load instructors. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async (instructorId) => {
    setLoadingSlots(true)
    try {
      console.log('Fetching slots for instructor:', instructorId)
      const { data } = await api.get(`/timeslots/instructor/${instructorId}`)
      console.log('Received slots:', data.length, data)
      setAvailableSlots(data)
      
      if (data.length === 0) {
        console.warn('No available time slots found for this instructor')
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error.response?.data || error.message)
      alert('Failed to load time slots. Please try again.')
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleInstructorSelect = (instructor) => {
    setSelectedInstructor(instructor)
    setSelectedSlot(null)
    setAvailableSlots([])
    fetchAvailableSlots(instructor._id)
  }

  const handleBooking = async () => {
    if (!selectedSlot) {
      alert('Please select a time slot')
      return
    }

    setBooking(true)
    try {
      const { data } = await api.post('/consultations', {
        timeSlotId: selectedSlot._id,
        notes
      })

      setPaymentOrder({ ...data.paymentOrder, timeSlotId: selectedSlot._id })
      setShowPayment(true)
    } catch (error) {
      console.error('Booking failed:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  const handlePayment = async () => {
    // In production, integrate with Juspay SDK
    // For now, simulate payment success
    try {
      const { data } = await api.post('/consultations/payment-callback', {
        orderId: paymentOrder.orderId,
        status: 'success',
        consultationId: paymentOrder.consultationId,
        paymentId: `PAY_${Date.now()}`,
        timeSlotId: paymentOrder.timeSlotId
      })

      alert('Payment successful! Check your consultations.')
      setShowPayment(false)
      setSelectedInstructor(null)
      setSelectedSlot(null)
      setAvailableSlots([])
      setNotes('')
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment processing failed. Please try again.')
    }
  }

  const groupSlotsByDate = () => {
    const grouped = {}
    availableSlots.forEach(slot => {
      const date = new Date(slot.date).toDateString()
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(slot)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Talk to Teacher
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Book one-on-one consultation sessions with expert instructors
        </p>
      </div>

      {/* Payment Modal */}
      {showPayment && paymentOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Complete Payment
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ₹{paymentOrder.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedSlot?.duration || 60} minutes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Order ID:</span>
                <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                  {paymentOrder.orderId}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold">🔒 Secure Payment</span><br/>
                Powered by Juspay - Your payment is safe and encrypted
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePayment}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Pay ₹{paymentOrder.amount}
              </button>
              <button
                onClick={() => setShowPayment(false)}
                className="px-6 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Instructors List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Available Instructors
          </h2>
          
          {instructors.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl">
              <p className="text-slate-600 dark:text-slate-400">
                No instructors available for consultation at the moment.
              </p>
            </div>
          ) : (
            instructors.map((instructor, idx) => (
              <motion.div
                key={instructor._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleInstructorSelect(instructor)}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 cursor-pointer transition-all ${
                  selectedInstructor?._id === instructor._id
                    ? 'border-indigo-600 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                    {instructor.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {instructor.name}
                        </h3>
                        {instructor.rating > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {instructor.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              ({instructor.totalRatings} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{instructor.consultationRate}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {instructor.email}
                    </p>
                    {instructor.bio && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                        {instructor.bio}
                      </p>
                    )}
                    {instructor.expertise && instructor.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {instructor.expertise.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Book Session
            </h2>

            {!selectedInstructor ? (
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Select an instructor to see available time slots
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Selected Instructor
                  </label>
                  <div className="px-4 py-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedInstructor.name}
                    </p>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                      ₹{selectedInstructor.consultationRate} per session
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Available Time Slots *
                  </label>
                  
                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No available slots
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {Object.entries(groupSlotsByDate()).map(([date, dateSlots]) => (
                        <div key={date}>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                            {date}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {dateSlots.map((slot) => (
                              <button
                                key={slot._id}
                                onClick={() => setSelectedSlot(slot)}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  selectedSlot?._id === slot._id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                                }`}
                              >
                                {slot.startTime} - {slot.endTime}
                                <br/>
                                <span className="text-xs opacity-75">{slot.duration} min</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What would you like to discuss?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleBooking}
                  disabled={booking || !selectedSlot}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? 'Processing...' : `Pay ₹${selectedInstructor.consultationRate}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
