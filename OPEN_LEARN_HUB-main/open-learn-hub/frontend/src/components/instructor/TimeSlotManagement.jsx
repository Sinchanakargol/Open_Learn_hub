import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'

export default function TimeSlotManagement() {
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([{ startTime: '', endTime: '', duration: 60 }])
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchTimeSlots()
  }, [])

  const fetchTimeSlots = async () => {
    try {
      const { data } = await api.get('/timeslots/my-slots')
      setTimeSlots(data)
    } catch (error) {
      console.error('Failed to fetch time slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = () => {
    setSlots([...slots, { startTime: '', endTime: '', duration: 60 }])
  }

  const handleRemoveSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index))
  }

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots]
    newSlots[index][field] = value
    setSlots(newSlots)
  }

  const handleSaveSlots = async () => {
    if (!selectedDate) {
      alert('Please select a date')
      return
    }

    const validSlots = slots.filter(s => s.startTime && s.endTime)
    if (validSlots.length === 0) {
      alert('Please add at least one valid time slot')
      return
    }

    setAdding(true)
    try {
      await api.post('/timeslots', {
        date: selectedDate,
        slots: validSlots
      })
      
      alert('Time slots added successfully!')
      setSelectedDate('')
      setSlots([{ startTime: '', endTime: '', duration: 60 }])
      fetchTimeSlots()
    } catch (error) {
      console.error('Failed to add time slots:', error)
      alert('Failed to add time slots. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteSlot = async (id) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return

    try {
      await api.delete(`/timeslots/${id}`)
      fetchTimeSlots()
    } catch (error) {
      console.error('Failed to delete time slot:', error)
      alert('Failed to delete time slot.')
    }
  }

  const groupSlotsByDate = () => {
    const grouped = {}
    timeSlots.forEach(slot => {
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

  const groupedSlots = groupSlotsByDate()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Manage Time Slots
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Add available time slots for students to book consultations
        </p>
      </div>

      {/* Add New Time Slots */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Add New Time Slots
        </h2>

        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Time Slots
            </label>
            {slots.map((slot, index) => (
              <div key={index} className="flex items-center space-x-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Duration</label>
                  <select
                    value={slot.duration}
                    onChange={(e) => handleSlotChange(index, 'duration', Number(e.target.value))}
                    className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
                {slots.length > 1 && (
                  <button
                    onClick={() => handleRemoveSlot(index)}
                    className="px-3 py-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors mt-5"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddSlot}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              + Add Another Slot
            </button>
          </div>

          <button
            onClick={handleSaveSlots}
            disabled={adding}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : 'Add Time Slots'}
          </button>
        </div>
      </div>

      {/* Existing Time Slots */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Your Time Slots
        </h2>

        {Object.keys(groupedSlots).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-slate-600 dark:text-slate-400">
              No time slots added yet
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <div key={date}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {date}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dateSlots.map((slot) => (
                    <motion.div
                      key={slot._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-xl border-2 ${
                        slot.isBooked
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          slot.isBooked
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {slot.isBooked ? 'Booked' : 'Available'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {slot.duration} minutes
                      </p>
                      {slot.isBooked && slot.bookedBy && (
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                          Student: {slot.bookedBy.name}
                        </p>
                      )}
                      {!slot.isBooked && (
                        <button
                          onClick={() => handleDeleteSlot(slot._id)}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
