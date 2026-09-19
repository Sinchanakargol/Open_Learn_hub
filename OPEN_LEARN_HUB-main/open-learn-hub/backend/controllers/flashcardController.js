import axios from 'axios'
import mongoose from 'mongoose'
import { callAIService } from '../utils/aiServiceHelper.js'

// Generate flashcards from content using AI
export async function generateFlashcards(req, res) {
  const Flashcard = (await import('../models/Flashcard.js')).default
  try {
    const { content, course, deck, count = 10 } = req.body
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required to generate flashcards' })
    }
    
    // Call AI service with fallback
    const { data, isAIGenerated } = await callAIService(
      '/generate-flashcards',
      { content, count },
      (payload) => {
        // Fallback: Generate basic flashcards from content
        const words = payload.content.split(/\s+/)
        const topic = words.slice(0, 5).join(' ')
        
        return {
          flashcards: [
            {
              question: `What are the key concepts in: ${topic}?`,
              answer: 'Review the main points in the content.'
            },
            {
              question: `How would you explain the topic: ${topic}?`,
              answer: 'Break the concept into simple parts and explain each.'
            },
            {
              question: `What is the practical application of: ${topic}?`,
              answer: 'Think of real-world examples and use cases.'
            }
          ].slice(0, Math.min(payload.count, 3))
        }
      }
    )
    
    console.log(`${isAIGenerated ? '✅ AI' : '⚠️ Fallback'} returned ${data.flashcards?.length || 0} flashcards`)
    
    // Parse response
    let flashcards = []
    try {
      if (!data.flashcards || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
        throw new Error('No flashcards generated')
      }
      
      flashcards = await Flashcard.insertMany(
        data.flashcards.map(fc => ({
          user: req.user.id,
          course,
          deck: deck || 'Default',
          question: fc.question,
          answer: fc.answer,
          isAiGenerated: isAIGenerated
        }))
      )
      
      console.log(`✅ Created ${flashcards.length} flashcards in database`)
    } catch (parseError) {
      console.error('Flashcard parse error:', parseError.message)
      return res.status(400).json({ 
        message: 'Failed to create flashcards. Please try again.',
        details: parseError.message
      })
    }
    
    if (flashcards.length === 0) {
      return res.status(400).json({ 
        message: 'No flashcards were generated. Content might be too short.' 
      })
    }
    
    res.status(201).json({ 
      flashcards, 
      isAIGenerated,
      message: isAIGenerated ? undefined : 'AI service unavailable. Basic flashcards generated.'
    })
  } catch (error) {
    console.error('Flashcard generation error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

// Create flashcard manually
export async function createFlashcard(req, res) {
  const Flashcard = (await import('../models/Flashcard.js')).default
  try {
    const flashcard = await Flashcard.create({
      user: req.user.id,
      ...req.body
    })
    
    res.status(201).json(flashcard)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get due flashcards for review
export async function getDueFlashcards(req, res) {
  const Flashcard = (await import('../models/Flashcard.js')).default
  try {
    const { deck } = req.query
    const query = {
      user: req.user.id,
      nextReviewDate: { $lte: new Date() }
    }
    
    if (deck) query.deck = deck
    
    const flashcards = await Flashcard.find(query)
      .limit(20)
      .sort({ nextReviewDate: 1 })
    
    res.json(flashcards)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Review flashcard (Spaced Repetition Algorithm)
export async function reviewFlashcard(req, res) {
  const Flashcard = (await import('../models/Flashcard.js')).default
  try {
    const { quality } = req.body // 0-5 (0=complete blackout, 5=perfect response)
    
    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' })
    }
    
    // SM-2 Algorithm
    const q = parseInt(quality)
    flashcard.totalReviews++
    
    if (q >= 3) {
      flashcard.correctCount++
      
      if (flashcard.repetitions === 0) {
        flashcard.interval = 1
      } else if (flashcard.repetitions === 1) {
        flashcard.interval = 6
      } else {
        flashcard.interval = Math.round(flashcard.interval * flashcard.easeFactor)
      }
      
      flashcard.repetitions++
    } else {
      flashcard.incorrectCount++
      flashcard.repetitions = 0
      flashcard.interval = 1
    }
    
    // Update ease factor
    flashcard.easeFactor = Math.max(1.3, flashcard.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    
    // Set next review date
    flashcard.nextReviewDate = new Date(Date.now() + flashcard.interval * 24 * 60 * 60 * 1000)
    flashcard.lastReviewedAt = new Date()
    
    await flashcard.save()
    
    res.json(flashcard)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get all decks
export async function getDecks(req, res) {
  const Flashcard = (await import('../models/Flashcard.js')).default
  try {
    const decks = await Flashcard.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$deck',
          total: { $sum: 1 },
          due: {
            $sum: {
              $cond: [{ $lte: ['$nextReviewDate', new Date()] }, 1, 0]
            }
          },
          mastered: {
            $sum: {
              $cond: [{ $gte: ['$repetitions', 5] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: '$_id',
          deck: '$_id',
          total: 1,
          due: 1,
          mastered: 1
        }
      }
    ])
    
    res.json(decks)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Delete flashcard
export async function deleteFlashcard(req, res) {
  const Flashcard = (await import('../models/Flashcard.js')).default
  try {
    const flashcard = await Flashcard.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' })
    }
    
    res.json({ message: 'Flashcard deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
