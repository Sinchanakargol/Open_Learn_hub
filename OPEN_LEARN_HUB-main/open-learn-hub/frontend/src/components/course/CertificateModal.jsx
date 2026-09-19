import { motion } from 'framer-motion'
import { X, Download, Share2, Award, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function CertificateModal({ certificate, onClose }) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    const url = `${window.location.origin}/certificates/${certificate.certificateId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${certificate.course?.title}</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .certificate {
              background: white;
              padding: 60px;
              max-width: 800px;
              border: 20px solid #f0f0f0;
              box-shadow: 0 0 50px rgba(0,0,0,0.3);
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              font-size: 48px;
              color: #667eea;
              font-weight: bold;
            }
            h1 {
              color: #333;
              font-size: 36px;
              margin: 20px 0;
              border-bottom: 3px solid #667eea;
              padding-bottom: 10px;
            }
            .content {
              text-align: center;
              line-height: 1.8;
            }
            .name {
              font-size: 32px;
              color: #667eea;
              font-weight: bold;
              margin: 20px 0;
            }
            .course-title {
              font-size: 24px;
              color: #555;
              font-style: italic;
              margin: 20px 0;
            }
            .details {
              margin-top: 40px;
              display: flex;
              justify-content: space-around;
            }
            .detail-item {
              text-align: center;
            }
            .detail-label {
              color: #888;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .detail-value {
              color: #333;
              font-size: 16px;
              font-weight: bold;
              margin-top: 5px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #888;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="logo">🎓 Open Learn Hub</div>
              <h1>Certificate of Completion</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; color: #666;">This is to certify that</p>
              <div class="name">${certificate.student?.name}</div>
              <p style="font-size: 18px; color: #666;">has successfully completed</p>
              <div class="course-title">${certificate.course?.title}</div>
              <div class="details">
                <div class="detail-item">
                  <div class="detail-label">Certificate ID</div>
                  <div class="detail-value">${certificate.certificateId}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Completion Date</div>
                  <div class="detail-value">${new Date(certificate.completionDate).toLocaleDateString()}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Grade</div>
                  <div class="detail-value">${certificate.grade}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Score</div>
                  <div class="detail-value">${certificate.averageScore}%</div>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>Verify this certificate at: ${window.location.origin}/certificates/${certificate.certificateId}</p>
              <p>© ${new Date().getFullYear()} Open Learn Hub. All rights reserved.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Your Certificate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Certificate Preview */}
        <div className="p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-12 border-8 border-white dark:border-slate-600 shadow-xl"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Certificate of Completion
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-6"></div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-2">This is to certify that</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent my-4">
                {certificate.student?.name}
              </p>
              <p className="text-slate-600 dark:text-slate-400 mb-2">has successfully completed</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white my-4">
                {certificate.course?.title}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Certificate ID</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{certificate.certificateId}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completion Date</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {new Date(certificate.completionDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grade</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{certificate.grade}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Score</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{certificate.averageScore}%</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Verified by Open Learn Hub</span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center space-x-2 px-6 py-3 rounded-lg border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>{copied ? 'Link Copied!' : 'Share Certificate'}</span>
            </button>
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
            Anyone can verify this certificate at: <br />
            <span className="font-mono">{window.location.origin}/certificates/{certificate.certificateId}</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
