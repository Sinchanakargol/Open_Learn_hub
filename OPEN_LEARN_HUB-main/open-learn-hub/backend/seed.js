import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Course from './models/Course.js'
import Quiz from './models/Quiz.js'
import Enrollment from './models/Enrollment.js'
import Discussion from './models/Discussion.js'

dotenv.config()

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/open_learn_hub')
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Course.deleteMany({})
    await Quiz.deleteMany({})
    await Enrollment.deleteMany({})
    await Discussion.deleteMany({})
    console.log('Cleared existing data')

    // Create users
    const student = await User.create({
      name: 'John Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student'
    })

    const instructor = await User.create({
      name: 'Jane Instructor',
      email: 'instructor@test.com',
      password: 'password123',
      role: 'instructor'
    })

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    })

    console.log('Created users:', { student: student.email, instructor: instructor.email, admin: admin.email })

    // Create sample courses
    const courses = await Course.insertMany([
      {
        title: 'Introduction to React',
        description: 'Learn the fundamentals of React including components, props, state, and hooks.',
        category: 'Web Development',
        level: 'beginner',
        instructor: instructor._id,
        lessons: [
          { title: 'Getting Started with React', content: 'Introduction to React basics', duration: 30 },
          { title: 'Components and Props', content: 'Understanding React components', duration: 45 },
          { title: 'State and Lifecycle', content: 'Managing component state', duration: 60 }
        ]
      },
      {
        title: 'Advanced JavaScript Patterns',
        description: 'Master advanced JavaScript concepts including closures, prototypes, and async programming.',
        category: 'Programming',
        level: 'advanced',
        instructor: instructor._id,
        lessons: [
          { title: 'Closures and Scope', content: 'Deep dive into closures', duration: 50 },
          { title: 'Prototypal Inheritance', content: 'Understanding prototypes', duration: 55 },
          { title: 'Async/Await Patterns', content: 'Modern async JavaScript', duration: 40 }
        ]
      },
      {
        title: 'Python for Data Science',
        description: 'Learn Python programming with a focus on data analysis and visualization.',
        category: 'Data Science',
        level: 'intermediate',
        instructor: instructor._id,
        lessons: [
          { title: 'Python Basics', content: 'Introduction to Python', duration: 35 },
          { title: 'NumPy and Pandas', content: 'Data manipulation libraries', duration: 70 },
          { title: 'Data Visualization', content: 'Creating charts with Matplotlib', duration: 50 }
        ]
      },
      {
        title: 'UI/UX Design Fundamentals',
        description: 'Learn the principles of user interface and user experience design.',
        category: 'Design',
        level: 'beginner',
        instructor: instructor._id,
        lessons: [
          { title: 'Design Principles', content: 'Core design concepts', duration: 40 },
          { title: 'User Research', content: 'Understanding your users', duration: 45 },
          { title: 'Prototyping', content: 'Creating interactive prototypes', duration: 60 }
        ]
      }
    ])

    console.log(`Created ${courses.length} courses`)

    // Create sample quizzes
    const quizzes = await Quiz.insertMany([
      {
        title: 'React Fundamentals Quiz',
        description: 'Test your knowledge of React basics',
        course: courses[0]._id,
        questions: [
          {
            question: 'What is JSX?',
            options: ['JavaScript XML', 'Java Syntax Extension', 'JSON Extended', 'JavaScript Extension'],
            correctAnswer: 'JavaScript XML'
          },
          {
            question: 'Which hook is used for side effects?',
            options: ['useState', 'useEffect', 'useContext', 'useReducer'],
            correctAnswer: 'useEffect'
          },
          {
            question: 'What does props stand for?',
            options: ['Properties', 'Propositions', 'Protocols', 'Procedures'],
            correctAnswer: 'Properties'
          }
        ]
      },
      {
        title: 'JavaScript Advanced Quiz',
        description: 'Challenge yourself with advanced JavaScript concepts',
        course: courses[1]._id,
        questions: [
          {
            question: 'What is a closure?',
            options: [
              'A function with access to parent scope',
              'A closed loop',
              'A private variable',
              'A class method'
            ],
            correctAnswer: 'A function with access to parent scope'
          },
          {
            question: 'What does "this" refer to in arrow functions?',
            options: [
              'Lexical scope',
              'Global object',
              'Function itself',
              'Undefined'
            ],
            correctAnswer: 'Lexical scope'
          }
        ]
      },
      {
        title: 'Python Basics Quiz',
        description: 'Test your Python fundamentals',
        course: courses[2]._id,
        questions: [
          {
            question: 'Which data structure is mutable in Python?',
            options: ['Tuple', 'String', 'List', 'Integer'],
            correctAnswer: 'List'
          },
          {
            question: 'What is the output of: print(type([]))?',
            options: ['<class "array">', '<class "list">', '<class "tuple">', '<class "dict">'],
            correctAnswer: '<class "list">'
          }
        ]
      }
    ])

    console.log(`Created ${quizzes.length} quizzes`)

    // Create sample enrollments
    const enrollments = await Enrollment.insertMany([
      {
        student: student._id,
        course: courses[0]._id,
        progress: 60,
        lastAccessed: new Date()
      },
      {
        student: student._id,
        course: courses[2]._id,
        progress: 30,
        lastAccessed: new Date(Date.now() - 86400000) // 1 day ago
      }
    ])

    console.log(`Created ${enrollments.length} enrollments`)

    // Create sample discussions
    const discussions = await Discussion.insertMany([
      {
        content: 'What are the best practices for React hooks?',
        author: student._id,
        course: courses[0]._id
      },
      {
        content: 'How do I optimize Python code for large datasets?',
        author: student._id,
        course: courses[2]._id
      }
    ])

    console.log(`Created ${discussions.length} discussions`)

    console.log('\n✅ Seed completed successfully!')
    console.log('\nTest credentials:')
    console.log('Student: student@test.com / password123')
    console.log('Instructor: instructor@test.com / password123')
    console.log('Admin: admin@test.com / password123')

    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seed()
