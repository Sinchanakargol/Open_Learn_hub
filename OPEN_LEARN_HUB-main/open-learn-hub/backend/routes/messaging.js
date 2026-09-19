import express from 'express'
import { auth } from '../middleware/auth.js'
import {
  getConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  getMessages,
  searchUsers,
  getConversation,
  addParticipant,
  getInstructors,
  getStudents
} from '../controllers/messagingController.js'

const router = express.Router()

// All routes require authentication
router.use(auth)

// Get all conversations
router.get('/conversations', getConversations)

// Get single conversation
router.get('/conversations/:conversationId', getConversation)

// Get or create direct conversation
router.get('/direct/:recipientId', getOrCreateDirectConversation)

// Create group conversation
router.post('/group', createGroupConversation)

// Add participant to group
router.post('/group/:conversationId/add', addParticipant)

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', getMessages)

// Search users
router.get('/users/search', searchUsers)

// Get instructors
router.get('/instructors', getInstructors)

// Get students
router.get('/students', getStudents)

export default router
