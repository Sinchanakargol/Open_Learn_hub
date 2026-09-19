import axios from 'axios'

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

export async function recommend(req,res){
  try {
    // Import models dynamically
    const Enrollment = (await import('../models/Enrollment.js')).default
    const Course = (await import('../models/Course.js')).default
    
    // Get user's enrolled courses
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate('course')
      .lean()
    
    const enrolledCourses = enrollments
      .filter(e => e.course)
      .map(e => ({
        _id: e.course._id.toString(),
        title: e.course.title,
        description: e.course.description,
        category: e.course.category,
        progress: e.progress
      }))
    
    // Get all available courses
    const allCourses = await Course.find().lean()
    const availableCourses = allCourses.map(c => ({
      _id: c._id.toString(),
      title: c.title,
      description: c.description,
      category: c.category,
      instructor: c.instructor
    }))
    
    // Call AI service with proper data
    const { data } = await axios.post(`${AI_URL}/recommend`, { 
      user_id: req.user.id,
      enrolled_courses: enrolledCourses,
      available_courses: availableCourses
    })
    
    res.json(data)
  } catch (error) {
    console.error('AI recommendation error:', error.message)
    // Return empty recommendations if AI service is down
    res.json({ recommendations: [] })
  }
}

export async function nextQuestion(req,res){
  try {
    const { quizId, lastAnswer } = req.body
    const { data } = await axios.post(`${AI_URL}/adaptive-quiz/next`, { 
      quiz_id: quizId, 
      last_answer: lastAnswer 
    })
    res.json(data)
  } catch (error) {
    console.error('AI adaptive quiz error:', error.message)
    // Return default level if AI service is down
    res.json({ level: 3, question: null })
  }
}

export async function sentiment(req,res){
  const { text } = req.body
  const { data } = await axios.post(`${AI_URL}/sentiment`, { text })
  res.json(data)
}

export async function analyzeMood(req, res) {
  try {
    const { text, engagementScore } = req.body
    const { data } = await axios.post(`${AI_URL}/analyze-mood`, {
      text,
      engagement_score: engagementScore
    })
    res.json(data)
  } catch (error) {
    console.error('AI mood analysis error:', error.message)
    // Return default config if AI service is down
    res.json({
      sentiment: { polarity: 0, label: 'neutral' },
      mood: 'neutral',
      ui_config: {
        theme: 'light',
        colors: {
          primary: 'from-indigo-600 to-purple-600',
          secondary: 'from-purple-500 to-pink-500',
          background: 'from-indigo-50 to-purple-50'
        },
        message: '📚 Welcome back! Ready to learn?',
        animation: 'fade',
        motivation: 'medium'
      }
    })
  }
}

export async function chat(req, res) {
  try {
    const { message } = req.body
    const { data } = await axios.post(`${AI_URL}/chat`, {
      message
    })
    res.json(data)
  } catch (error) {
    console.error('AI chat error:', error.message)
    res.json({
      response: "I'm having trouble connecting right now. Please try again later!"
    })
  }
}

export async function generateQuiz(req, res) {
  // Extract variables outside try-catch so they're accessible in catch block
  const { courseTitle, lessonTitle, lessonContent, numberOfQuestions = 5 } = req.body
  
  try {
    // Call AI service to generate quiz
    const { data } = await axios.post(`${AI_URL}/generate-quiz`, {
      course_title: courseTitle,
      lesson_title: lessonTitle,
      lesson_content: lessonContent,
      num_questions: numberOfQuestions
    })
    
    res.json(data)
  } catch (error) {
    console.error('AI quiz generation error:', error.message)
    
    // Return sample questions if AI service fails
    const sampleQuestions = [
      {
        question: `What is the main concept covered in "${lessonTitle}"?`,
        options: [
          'Understanding the fundamentals',
          'Advanced techniques',
          'Practical applications',
          'All of the above'
        ],
        correctAnswer: 3
      },
      {
        question: `Which of the following best describes the key takeaway from this lesson?`,
        options: [
          'Learning new skills',
          'Building on existing knowledge',
          'Exploring advanced topics',
          'Reviewing basics'
        ],
        correctAnswer: 0
      },
      {
        question: `How can you apply what you learned in "${lessonTitle}"?`,
        options: [
          'In real-world projects',
          'In theoretical studies',
          'In personal development',
          'All of the above'
        ],
        correctAnswer: 3
      },
      {
        question: `What is the most important aspect of "${courseTitle}"?`,
        options: [
          'Understanding core concepts',
          'Memorizing facts',
          'Following instructions',
          'Completing assignments'
        ],
        correctAnswer: 0
      },
      {
        question: `Which skill is essential for mastering this topic?`,
        options: [
          'Critical thinking',
          'Memorization',
          'Speed',
          'Luck'
        ],
        correctAnswer: 0
      }
    ]
    
    res.json({
      questions: sampleQuestions.slice(0, numberOfQuestions)
    })
  }
}

export async function predictPerformance(req, res) {
  try {
    const performanceData = req.body
    const { data } = await axios.post(`${AI_URL}/predict-performance`, performanceData)
    res.json(data)
  } catch (error) {
    console.error('Performance prediction error:', error.message)
    // Return default predictions if AI service is down
    res.json({
      dropout_risk: {
        dropout_probability: 0.3,
        risk_level: "Medium",
        risk_color: "yellow",
        confidence: 0.7,
        feature_importance: {}
      },
      grade_prediction: {
        predicted_grade: 75,
        letter_grade: "C",
        confidence_interval: [70, 80]
      },
      study_recommendations: {
        recommended_hours_per_week: 10,
        estimated_weeks_to_completion: 8,
        total_hours_needed: 80,
        focus_areas: ["Maintain consistent study habits"]
      },
      next_course_difficulty: {
        recommended_difficulty: "Intermediate",
        performance_score: 65,
        reason: "Continue building your skills",
        ready_for_advanced: false
      },
      analysis_date: new Date().toISOString()
    })
  }
}
