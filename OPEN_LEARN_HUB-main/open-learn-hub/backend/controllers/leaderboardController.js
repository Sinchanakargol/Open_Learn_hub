import User from '../models/User.js'
import Enrollment from '../models/Enrollment.js'

export async function getLeaderboard(req, res) {
  try {
    // Get all students with their points
    const users = await User.find({ role: 'student' })
      .select('name email points')
      .sort({ points: -1 })
      .limit(20)
      .lean()
    
    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const enrollments = await Enrollment.find({ student: user._id })
        const completed = enrollments.filter(e => e.completed).length
        const inProgress = enrollments.filter(e => !e.completed && e.progress > 0).length
        
        // Calculate total completed lessons
        const totalCompletedLessons = enrollments.reduce((sum, e) => sum + (e.completedLessons?.length || 0), 0)
        
        // Calculate quiz performance
        const passedQuizzes = enrollments.reduce((sum, e) => {
          return sum + (e.quizScores?.filter(qs => qs.passed)?.length || 0)
        }, 0)
        
        const totalQuizzes = enrollments.reduce((sum, e) => sum + (e.quizScores?.length || 0), 0)
        
        const avgQuizScore = enrollments.reduce((sum, e) => {
          const scores = e.quizScores || []
          return sum + scores.reduce((s, qs) => s + (qs.score || 0), 0)
        }, 0) / (totalQuizzes || 1)
        
        // Badges based on achievements
        const badges = []
        if (completed >= 5) badges.push('🏆 Master Learner')
        else if (completed >= 3) badges.push('🎓 Course Completer')
        if (user.points >= 1000) badges.push('⭐ Top Performer')
        if (totalCompletedLessons >= 50) badges.push('📚 Video Master')
        else if (totalCompletedLessons >= 20) badges.push('📺 Video Enthusiast')
        if (avgQuizScore >= 90) badges.push('🧠 Quiz Master')
        if (passedQuizzes >= 10) badges.push('✅ Quiz Champion')
        
        return {
          _id: user._id,
          user: { name: user.name, email: user.email },
          points: user.points || 0,
          badges,
          completed,
          inProgress,
          completedLessons: totalCompletedLessons,
          passedQuizzes,
          totalQuizzes,
          avgQuizScore: Math.round(avgQuizScore)
        }
      })
    )
    
    res.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ message: 'Failed to fetch leaderboard' })
  }
}
