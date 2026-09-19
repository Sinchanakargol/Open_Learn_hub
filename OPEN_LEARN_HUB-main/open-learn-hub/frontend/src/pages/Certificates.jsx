import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, Download, Share2, Calendar, GraduationCap } from 'lucide-react'
import api from '../services/api'
import CertificateModal from '../components/course/CertificateModal'

export default function Certificates() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState(null)

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      const { data } = await api.get('/certificates/my-certificates')
      setCertificates(data)
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading certificates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white mb-4">
          <GraduationCap className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          My Certificates
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your achievements and completed courses
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {certificates.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Certificates</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white">
              ⭐
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {certificates.filter(c => ['A+', 'A'].includes(c.grade)).length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Top Grades</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              📊
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {certificates.length > 0
                  ? Math.round(certificates.reduce((sum, c) => sum + c.averageScore, 0) / certificates.length)
                  : 0}%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Average Score</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
        >
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No certificates yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Complete a course to earn your first certificate!
          </p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.map((cert, idx) => (
            <motion.div
              key={cert._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border-4 border-white dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedCertificate(cert)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl">
                    🎓
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {cert.course?.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Certificate #{cert.certificateId}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  cert.grade === 'A+' ? 'bg-yellow-400 text-yellow-900' :
                  cert.grade === 'A' ? 'bg-green-400 text-green-900' :
                  cert.grade === 'B+' ? 'bg-blue-400 text-blue-900' :
                  'bg-slate-400 text-slate-900'
                }`}>
                  Grade {cert.grade}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(cert.completionDate).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Score</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {cert.averageScore}%
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedCertificate(cert)
                }}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>View Certificate</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  )
}
