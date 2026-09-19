import Quiz from '../models/Quiz.js'

export async function list(req, res) {
  try {
    const quizzes = await Quiz.find().populate('course', 'title')
    res.json(quizzes)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes' })
  }
}

export async function create(req, res) {
  try {
    const quiz = await Quiz.create(req.body)
    res.json(quiz)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz' })
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params
    const quiz = await Quiz.findByIdAndUpdate(id, req.body, { new: true })
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' })
    }
    res.json(quiz)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quiz' })
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params
    await Quiz.findByIdAndDelete(id)
    res.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete quiz' })
  }
}

export async function submit(req, res) {
  try {
    const { id } = req.params
    const { answers } = req.body
    
    const quiz = await Quiz.findById(id)
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' })
    }
    
    let correct = 0
    quiz.questions.forEach((q, idx) => {
      if (answers[q._id] === q.correctAnswer) {
        correct++
      }
    })
    
    const score = Math.round((correct / quiz.questions.length) * 100)
    
    res.json({ score, correct, total: quiz.questions.length })
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit quiz' })
  }
}
