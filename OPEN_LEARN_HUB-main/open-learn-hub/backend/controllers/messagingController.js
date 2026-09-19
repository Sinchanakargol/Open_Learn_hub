import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'

// Get all conversations for logged-in user
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true
    })
      .populate('participants', 'name email role avatar')
      .populate('course', 'title')
      .populate('lastMessage.sender', 'name')
      .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })

    // Get unread message count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user.id },
          'readBy.user': { $ne: req.user.id }
        })

        return {
          ...conv.toObject(),
          unreadCount
        }
      })
    )

    res.json(conversationsWithUnread)
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get or create direct conversation
export const getOrCreateDirectConversation = async (req, res) => {
  try {
    const { recipientId } = req.params

    if (recipientId === req.user.id) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' })
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId)
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [req.user.id, recipientId], $size: 2 }
    })
      .populate('participants', 'name email role avatar')

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [req.user.id, recipientId]
      })

      await conversation.populate('participants', 'name email role avatar')
    }

    res.json(conversation)
  } catch (error) {
    console.error('Get/Create conversation error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Create group conversation
export const createGroupConversation = async (req, res) => {
  try {
    const { name, participantIds } = req.body

    if (!name || !participantIds || participantIds.length < 2) {
      return res.status(400).json({ 
        message: 'Group name and at least 2 participants required' 
      })
    }

    // Add creator to participants
    const allParticipants = [...new Set([req.user.id, ...participantIds])]

    const conversation = await Conversation.create({
      type: 'group',
      name,
      participants: allParticipants
    })

    await conversation.populate('participants', 'name email role avatar')

    res.status(201).json(conversation)
  } catch (error) {
    console.error('Create group error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 50 } = req.query

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    )

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email role avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Message.countDocuments({ conversation: conversationId })

    res.json({
      messages: messages.reverse(), // Oldest first
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Search users (for starting new conversations)
export const searchUsers = async (req, res) => {
  try {
    const { query, role } = req.query

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters' })
    }

    const searchFilter = {
      _id: { $ne: req.user.id }, // Exclude self
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }

    if (role) {
      searchFilter.role = role
    }

    const users = await User.find(searchFilter)
      .select('name email role avatar')
      .limit(20)

    res.json(users)
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get conversation by ID
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email role avatar')
      .populate('course', 'title')

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user.id
    )

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Get unread count
    const unreadCount = await Message.countDocuments({
      conversation: conversationId,
      sender: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id }
    })

    res.json({
      ...conversation.toObject(),
      unreadCount
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Add participant to group
export const addParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { userId } = req.body

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({ message: 'Can only add participants to groups' })
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    )

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Check if user already in group
    const alreadyInGroup = conversation.participants.some(
      p => p.toString() === userId
    )

    if (alreadyInGroup) {
      return res.status(400).json({ message: 'User already in group' })
    }

    conversation.participants.push(userId)
    await conversation.save()
    await conversation.populate('participants', 'name email role avatar')

    res.json(conversation)
  } catch (error) {
    console.error('Add participant error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get instructors (for students to message)
export const getInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .select('name email avatar')
      .sort({ name: 1 })

    res.json(instructors)
  } catch (error) {
    console.error('Get instructors error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get students (for instructors to message)
export const getStudents = async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const students = await User.find({ role: 'student' })
      .select('name email avatar')
      .sort({ name: 1 })

    res.json(students)
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
