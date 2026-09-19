import Certificate from '../models/Certificate.js'
import Enrollment from '../models/Enrollment.js'
import Course from '../models/Course.js'
import crypto from 'crypto'

export async function generateCertificate(req, res) {
  try {
    const { courseId } = req.body
    const studentId = req.user.id

    // Check if enrollment exists and is complete
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      progress: 100
    })

    if (!enrollment) {
      return res.status(400).json({ message: 'Course not completed yet' })
    }

    // Check if certificate already exists
    const existing = await Certificate.findOne({
      student: studentId,
      course: courseId
    })

    if (existing) {
      return res.json(existing)
    }

    // Calculate grade based on quiz scores
    const averageScore = enrollment.quizScores?.length > 0
      ? enrollment.quizScores.reduce((sum, qs) => sum + (qs.score || 0), 0) / enrollment.quizScores.length
      : 85

    const grade = averageScore >= 95 ? 'A+' :
                  averageScore >= 90 ? 'A' :
                  averageScore >= 85 ? 'B+' :
                  averageScore >= 80 ? 'B' :
                  averageScore >= 75 ? 'C+' :
                  averageScore >= 70 ? 'C' : 'Pass'

    // Generate unique certificate ID
    const certificateId = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    const certificate = await Certificate.create({
      student: studentId,
      course: courseId,
      certificateId,
      completionDate: new Date(),
      grade,
      averageScore: Math.round(averageScore)
    })

    await certificate.populate(['student', 'course'])
    res.json(certificate)
  } catch (error) {
    console.error('Certificate generation error:', error)
    res.status(500).json({ message: 'Failed to generate certificate' })
  }
}

export async function getMyCertificates(req, res) {
  try {
    const certificates = await Certificate.find({ student: req.user.id })
      .populate('course')
      .sort({ issuedAt: -1 })

    res.json(certificates)
  } catch (error) {
    console.error('Get certificates error:', error)
    res.status(500).json({ message: 'Failed to fetch certificates' })
  }
}

export async function getCertificateById(req, res) {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId
    })
      .populate(['student', 'course'])

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' })
    }

    res.json(certificate)
  } catch (error) {
    console.error('Get certificate error:', error)
    res.status(500).json({ message: 'Failed to fetch certificate' })
  }
}
