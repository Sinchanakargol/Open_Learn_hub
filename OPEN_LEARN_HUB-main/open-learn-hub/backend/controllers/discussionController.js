import Discussion from '../models/Discussion.js'

export async function list(req, res) {
  try {
    const discussions = await Discussion.find()
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json(discussions)
  } catch (error) {
    console.error('List discussions error:', error)
    res.status(500).json({ message: 'Failed to fetch discussions', error: error.message })
  }
}

export async function create(req, res) {
  try {
    const { content, course } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' })
    }
    
    const discussion = await Discussion.create({
      content,
      course,
      author: req.user.id
    })
    
    const populated = await Discussion.findById(discussion._id)
      .populate('author', 'name email')
    
    res.json(populated)
  } catch (error) {
    console.error('Create discussion error:', error)
    res.status(500).json({ message: 'Failed to create discussion', error: error.message })
  }
}

export async function addReply(req, res) {
  try {
    const { id } = req.params
    const { content } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' })
    }
    
    const discussion = await Discussion.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: {
            content,
            author: req.user.id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('author', 'name email')
     .populate('replies.author', 'name email')
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' })
    }
    
    res.json(discussion)
  } catch (error) {
    console.error('Add reply error:', error)
    res.status(500).json({ message: 'Failed to add reply', error: error.message })
  }
}
