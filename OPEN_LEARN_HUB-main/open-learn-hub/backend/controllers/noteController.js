import axios from 'axios'
import { callAIService } from '../utils/aiServiceHelper.js'

// Create note
export async function createNote(req, res) {
  const Note = (await import('../models/Note.js')).default
  try {
    const { course, lesson, title, content, tags } = req.body
    
    const note = await Note.create({
      user: req.user.id,
      course,
      lesson,
      title,
      content,
      tags: tags || []
    })
    
    res.status(201).json(note)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get AI summary of note
export async function generateSummary(req, res) {
  try {
    const Note = (await import('../models/Note.js')).default
    const note = await Note.findById(req.params.id)
    
    if (!note || note.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Note not found' })
    }
    
    // Call AI service with fallback
    const { data, isAIGenerated } = await callAIService(
      '/generate-note-summary',
      { content: note.content },
      (payload) => {
        // Fallback: Generate a simple summary from the first 200 words
        const words = payload.content.split(/\s+/).slice(0, 200)
        const preview = words.join(' ')
        
        return {
          summary: `📝 Note Preview:\n\n${preview}${words.length >= 200 ? '...' : ''}\n\n💡 Tip: AI summarization is currently unavailable. This is a preview of your note content.`
        }
      }
    )
    
    note.aiSummary = data.summary
    await note.save()
    
    res.json({ summary: data.summary, isAIGenerated })
  } catch (error) {
    console.error('Note summary error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

// Get my notes
export async function getMyNotes(req, res) {
  try {
    const Note = (await import('../models/Note.js')).default
    const { course, search } = req.query
    const query = { user: req.user.id }
    
    if (course) query.course = course
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    const notes = await Note.find(query)
      .populate('course', 'title')
      .sort({ createdAt: -1 })
    
    res.json(notes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update note
export async function updateNote(req, res) {
  try {
    const Note = (await import('../models/Note.js')).default
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }
    
    res.json(note)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete note
export async function deleteNote(req, res) {
  try {
    const Note = (await import('../models/Note.js')).default
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }
    
    res.json({ message: 'Note deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Share note
export async function shareNote(req, res) {
  try {
    const Note = (await import('../models/Note.js')).default
    const { userIds, isPublic } = req.body
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id })
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }
    
    if (userIds) note.sharedWith = userIds
    if (typeof isPublic !== 'undefined') note.isPublic = isPublic
    
    await note.save()
    res.json(note)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
