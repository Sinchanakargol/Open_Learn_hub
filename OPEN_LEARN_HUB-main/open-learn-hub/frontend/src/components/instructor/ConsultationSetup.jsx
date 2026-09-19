import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import api from '../../services/api'

export default function ConsultationSetup() {
  const { user } = useSelector(s => s.auth)
  const [consultationRate, setConsultationRate] = useState(0)
  const [bio, setBio] = useState('')
  const [expertise, setExpertise] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me')
      setConsultationRate(data.consultationRate || 0)
      setBio(data.bio || '')
      setExpertise(data.expertise || [])
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !expertise.includes(newSkill.trim())) {
      setExpertise([...expertise, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill) => {
    setExpertise(expertise.filter(s => s !== skill))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/auth/profile', {
        consultationRate,
        bio,
        expertise
      })
      alert('Consultation profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Consultation Setup
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Set up your consultation profile to start accepting bookings from students
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="space-y-6">
          {/* Consultation Rate */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Consultation Rate (₹ per session) *
            </label>
            <input
              type="number"
              value={consultationRate}
              onChange={(e) => setConsultationRate(Number(e.target.value))}
              min="0"
              placeholder="e.g., 500"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg font-semibold"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              💡 Set your rate per consultation session (30 or 60 minutes)
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Bio / About You
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about your teaching experience, qualifications, and what you can help them with..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              💡 A good bio helps students understand your expertise
            </p>
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Areas of Expertise
            </label>
            
            {/* Existing Skills */}
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {expertise.map((skill, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex items-center space-x-2"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-200"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Add New Skill */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="e.g., React, Python, Data Science"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                onClick={handleAddSkill}
                className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              💡 Add skills and topics you can teach (press Enter or click Add)
            </p>
          </div>

          {/* Preview */}
          {consultationRate > 0 && (
            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                📋 Preview (How students will see you)
              </h3>
              
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                        {user?.name}
                      </h4>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{consultationRate}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {user?.email}
                    </p>
                    {bio && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                        {bio}
                      </p>
                    )}
                    {expertise.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {expertise.map((skill, i) => (
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
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
            <div>
              {consultationRate === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Set a consultation rate to appear in student listings
                </p>
              ) : (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✅ Your profile will be visible to students
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
