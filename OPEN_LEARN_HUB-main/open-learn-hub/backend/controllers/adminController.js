import User from '../models/User.js'
import Course from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'

export async function getStats(req, res) {
  try {
    const [totalUsers, totalCourses, totalEnrollments] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments()
    ])
    
    // Mock active users for now
    const activeUsers = Math.floor(totalUsers * 0.3)
    
    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeUsers
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}

export async function getUsers(req, res) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' })
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params
    await User.findByIdAndDelete(id)
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' })
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params
    const { role } = req.body
    
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password')
    
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role' })
  }
}
