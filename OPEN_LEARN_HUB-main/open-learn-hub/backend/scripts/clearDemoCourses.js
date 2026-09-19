import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/open-learn-hub'

async function clearDemoCourses() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Import models
    const Course = (await import('../models/Course.js')).default
    const Enrollment = (await import('../models/Enrollment.js')).default
    const Quiz = (await import('../models/Quiz.js')).default
    const Discussion = (await import('../models/Discussion.js')).default

    console.log('\n🗑️  Clearing demo courses...\n')

    // Delete all courses
    const coursesDeleted = await Course.deleteMany({})
    console.log(`✅ Deleted ${coursesDeleted.deletedCount} courses`)

    // Delete all enrollments
    const enrollmentsDeleted = await Enrollment.deleteMany({})
    console.log(`✅ Deleted ${enrollmentsDeleted.deletedCount} enrollments`)

    // Delete all quizzes
    const quizzesDeleted = await Quiz.deleteMany({})
    console.log(`✅ Deleted ${quizzesDeleted.deletedCount} quizzes`)

    // Delete all discussions
    const discussionsDeleted = await Discussion.deleteMany({})
    console.log(`✅ Deleted ${discussionsDeleted.deletedCount} discussions`)

    console.log('\n🎉 Database cleaned successfully!')
    console.log('\n📝 Summary:')
    console.log(`   - Courses: ${coursesDeleted.deletedCount}`)
    console.log(`   - Enrollments: ${enrollmentsDeleted.deletedCount}`)
    console.log(`   - Quizzes: ${quizzesDeleted.deletedCount}`)
    console.log(`   - Discussions: ${discussionsDeleted.deletedCount}`)
    console.log('\nYour database is now clean! You can create new courses through the instructor dashboard.\n')

  } catch (error) {
    console.error('❌ Error clearing demo courses:', error.message)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

clearDemoCourses()
