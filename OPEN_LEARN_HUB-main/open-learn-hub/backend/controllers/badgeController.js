import Badge from '../models/Badge.js'
import Enrollment from '../models/Enrollment.js'
import Quiz from '../models/Quiz.js'

// Badge criteria definitions
const BADGE_CRITERIA = {
  // Course completion badges
  first_course: {
    name: 'First Steps',
    description: 'Completed your first course',
    icon: '🎯',
    color: 'from-green-500 to-emerald-500',
    category: 'course'
  },
  complete_5_courses: {
    name: 'Learning Enthusiast',
    description: 'Completed 5 courses',
    icon: '📚',
    color: 'from-blue-500 to-cyan-500',
    category: 'course'
  },
  complete_10_courses: {
    name: 'Knowledge Seeker',
    description: 'Completed 10 courses',
    icon: '🌟',
    color: 'from-purple-500 to-pink-500',
    category: 'course'
  },
  complete_20_courses: {
    name: 'Master Learner',
    description: 'Completed 20 courses',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-500',
    category: 'course'
  },
  
  // Quiz achievement badges
  first_perfect_quiz: {
    name: 'Perfect Score',
    description: 'Scored 100% on a quiz',
    icon: '💯',
    color: 'from-yellow-500 to-orange-500',
    category: 'quiz'
  },
  quiz_master: {
    name: 'Quiz Master',
    description: 'Scored 90% or higher on 5 quizzes',
    icon: '⭐',
    color: 'from-purple-500 to-pink-500',
    category: 'quiz'
  },
  
  // Engagement badges
  early_bird: {
    name: 'Early Bird',
    description: 'Enrolled in your first course',
    icon: '🐦',
    color: 'from-cyan-500 to-blue-500',
    category: 'engagement'
  },
  consistent_learner: {
    name: 'Consistent Learner',
    description: 'Accessed platform for 7 consecutive days',
    icon: '🔥',
    color: 'from-orange-500 to-red-500',
    category: 'engagement'
  },
  
  // Special achievements
  speed_demon: {
    name: 'Speed Demon',
    description: 'Completed a course in under 3 days',
    icon: '⚡',
    color: 'from-yellow-500 to-red-500',
    category: 'special'
  },
  perfectionist: {
    name: 'Perfectionist',
    description: 'Completed 3 courses with 100% progress',
    icon: '💎',
    color: 'from-indigo-500 to-purple-500',
    category: 'special'
  }
}

// Check and award badge
async function awardBadgeIfEarned(userId, criteriaKey) {
  try {
    // Check if badge already awarded
    const existingBadge = await Badge.findOne({ user: userId, criteria: criteriaKey })
    if (existingBadge) {
      return null // Already has this badge
    }

    const badgeInfo = BADGE_CRITERIA[criteriaKey]
    if (!badgeInfo) {
      return null
    }

    // Create and award badge
    const badge = await Badge.create({
      user: userId,
      name: badgeInfo.name,
      description: badgeInfo.description,
      icon: badgeInfo.icon,
      color: badgeInfo.color,
      category: badgeInfo.category,
      criteria: criteriaKey
    })

    return badge
  } catch (error) {
    console.error('Error awarding badge:', error)
    return null
  }
}

// Check all badges for a user
export async function checkAndAwardBadges(req, res) {
  try {
    const userId = req.user.id
    const newBadges = []

    // Get user's enrollments
    const enrollments = await Enrollment.find({ student: userId }).populate('course')
    const completedCourses = enrollments.filter(e => e.progress === 100)

    // Check course completion badges
    if (completedCourses.length >= 1) {
      const badge = await awardBadgeIfEarned(userId, 'first_course')
      if (badge) newBadges.push(badge)
    }
    
    if (completedCourses.length >= 5) {
      const badge = await awardBadgeIfEarned(userId, 'complete_5_courses')
      if (badge) newBadges.push(badge)
    }
    
    if (completedCourses.length >= 10) {
      const badge = await awardBadgeIfEarned(userId, 'complete_10_courses')
      if (badge) newBadges.push(badge)
    }
    
    if (completedCourses.length >= 20) {
      const badge = await awardBadgeIfEarned(userId, 'complete_20_courses')
      if (badge) newBadges.push(badge)
    }

    // Check enrollment badge
    if (enrollments.length >= 1) {
      const badge = await awardBadgeIfEarned(userId, 'early_bird')
      if (badge) newBadges.push(badge)
    }

    // Check quiz badges
    const highScores = enrollments.filter(e => e.quizScore >= 90).length
    if (highScores >= 5) {
      const badge = await awardBadgeIfEarned(userId, 'quiz_master')
      if (badge) newBadges.push(badge)
    }

    const perfectScores = enrollments.filter(e => e.quizScore === 100)
    if (perfectScores.length >= 1) {
      const badge = await awardBadgeIfEarned(userId, 'first_perfect_quiz')
      if (badge) newBadges.push(badge)
    }

    // Check perfectionist badge (100% progress on 3 courses)
    if (completedCourses.length >= 3) {
      const badge = await awardBadgeIfEarned(userId, 'perfectionist')
      if (badge) newBadges.push(badge)
    }

    res.json({
      newBadges,
      message: newBadges.length > 0 ? `Earned ${newBadges.length} new badge(s)!` : 'No new badges'
    })
  } catch (error) {
    console.error('Check badges error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get user's badges
export async function getUserBadges(req, res) {
  try {
    const userId = req.params.userId || req.user.id
    
    const badges = await Badge.find({ user: userId })
      .sort({ earnedAt: -1 })

    res.json(badges)
  } catch (error) {
    console.error('Get badges error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get badge statistics
export async function getBadgeStats(req, res) {
  try {
    const userId = req.user.id
    
    const badges = await Badge.find({ user: userId })
    
    const stats = {
      total: badges.length,
      byCategory: {
        course: badges.filter(b => b.category === 'course').length,
        quiz: badges.filter(b => b.category === 'quiz').length,
        engagement: badges.filter(b => b.category === 'engagement').length,
        achievement: badges.filter(b => b.category === 'achievement').length,
        special: badges.filter(b => b.category === 'special').length
      },
      recent: badges.slice(0, 3)
    }

    res.json(stats)
  } catch (error) {
    console.error('Get badge stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get all available badges (for display purposes)
export async function getAvailableBadges(req, res) {
  try {
    const userId = req.user.id
    const earnedBadges = await Badge.find({ user: userId })
    const earnedCriteria = earnedBadges.map(b => b.criteria)

    const allBadges = Object.entries(BADGE_CRITERIA).map(([key, value]) => ({
      criteria: key,
      ...value,
      earned: earnedCriteria.includes(key)
    }))

    res.json(allBadges)
  } catch (error) {
    console.error('Get available badges error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
