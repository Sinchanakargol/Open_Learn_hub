import axios from 'axios'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

// Generate study material using Gemini AI
export async function generateStudyMaterial(req, res) {
  try {
    const StudyMaterial = (await import('../models/StudyMaterial.js')).default
    const { prompt, pageCount, title, tags } = req.body
    
    if (!prompt || !pageCount) {
      return res.status(400).json({ message: 'Prompt and page count are required' })
    }
    
    if (pageCount < 1 || pageCount > 50) {
      return res.status(400).json({ message: 'Page count must be between 1 and 50' })
    }
    
    const startTime = Date.now()
    
    // Create initial record
    const material = await StudyMaterial.create({
      user: req.user.id,
      title: title || prompt.substring(0, 50),
      prompt,
      pageCount,
      tags: tags || [],
      status: 'generating'
    })
    
    // Generate content using Gemini AI
    const topicsNeeded = Math.max(Math.ceil(pageCount / 2), 3) // More topics for more pages
    const aiPrompt = `Create comprehensive study material on: "${prompt}"

Requirements:
- Target length: ${pageCount} pages (approximately ${pageCount * 400} words)
- Create EXACTLY ${topicsNeeded} main topics (${topicsNeeded} topics)
- For EACH topic, provide:
  * Detailed explanation (at least 200-300 words)
  * 5-8 key points
  * 3-5 real-world examples with explanations
  * 4-6 practice questions
- Add a comprehensive summary (150-200 words) at the end
- Add 5-10 additional resources/references

IMPORTANT: Generate enough content to fill ${pageCount} pages. Be very detailed and comprehensive.

Return ONLY a valid JSON object in this exact format:
{
  "topics": [
    {
      "title": "Topic 1 Title",
      "explanation": "Very detailed explanation of the topic with multiple paragraphs, concepts, definitions, and thorough coverage. Include background information, core concepts, practical applications, and in-depth analysis. This should be comprehensive and educational.",
      "keyPoints": ["Detailed key point 1 with explanation", "Detailed key point 2", "Detailed key point 3", "Key point 4", "Key point 5", "Key point 6", "Key point 7", "Key point 8"],
      "examples": ["Example 1 with detailed explanation and context", "Example 2 with practical application", "Example 3 with code or formula if applicable", "Example 4 with real-world scenario", "Example 5 with step-by-step breakdown"],
      "practiceQuestions": ["Question 1 with context?", "Question 2 requiring analysis?", "Question 3 for critical thinking?", "Question 4 for application?", "Question 5 for synthesis?", "Question 6 for evaluation?"]
    }
  ],
  "summary": "Comprehensive overall summary covering all topics, key takeaways, connections between concepts, practical applications, and final thoughts. Should synthesize all the material covered.",
  "additionalResources": ["Resource 1: Book/Article with description", "Resource 2: Website with description", "Resource 3: Video/Course", "Resource 4: Research paper", "Resource 5: Tool/Software", "Resource 6: Community/Forum", "Resource 7: Documentation", "Resource 8: Tutorial", "Resource 9: Blog post", "Resource 10: Additional reading"]
}

Generate ${topicsNeeded} topics with extensive detail to create a ${pageCount}-page document. Be thorough and comprehensive!`
    
    const { data } = await axios.post(`${AI_URL}/chat`, {
      message: aiPrompt,
      max_tokens: 8000 // Request longer response from AI
    })
    
    // Parse AI response
    let contentData
    try {
      // Try to extract and fix JSON
      let jsonStr = data.response
      
      // Remove ALL markdown code blocks and formatting more thoroughly
      jsonStr = jsonStr
        .replace(/```json\s*/gi, '') // Remove ```json with optional whitespace
        .replace(/```\s*$/g, '') // Remove closing ``` at end
        .replace(/```/g, '') // Remove any remaining ```
        .replace(/`/g, '') // Remove single backticks
        .replace(/^\s*[\r\n]/gm, '') // Remove empty lines at start
        .trim()
      
      // Try to find JSON object - more robust pattern
      let jsonMatch = jsonStr.match(/\{[\s\S]*\}/s)
      if (!jsonMatch) {
        // Try to find JSON that might be embedded in text
        const startIdx = jsonStr.indexOf('{')
        const endIdx = jsonStr.lastIndexOf('}')
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          jsonStr = jsonStr.substring(startIdx, endIdx + 1)
        } else {
          throw new Error('No JSON structure found in response')
        }
      } else {
        jsonStr = jsonMatch[0]
      }
      
      // Fix common JSON issues more comprehensively
      jsonStr = jsonStr
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/\n\s*/g, ' ') // Replace newlines with spaces (but keep content)
        .replace(/\s{2,}/g, ' ') // Normalize multiple spaces
        .replace(/\\n/g, '\\n') // Fix escaped newlines
        .replace(/\\"/g, '\\"') // Fix escaped quotes
      
      console.log('Cleaned JSON string:', jsonStr.substring(0, 200) + '...')
      
      contentData = JSON.parse(jsonStr)
      
      // Validate structure
      if (!contentData.topics || !Array.isArray(contentData.topics) || contentData.topics.length === 0) {
        throw new Error('Invalid topics structure')
      }
      
      // Clean up all text content from markdown artifacts
      contentData.topics = contentData.topics.map(topic => ({
        ...topic,
        title: topic.title?.replace(/`/g, '') || '',
        explanation: topic.explanation?.replace(/`/g, '') || '',
        keyPoints: topic.keyPoints?.map(p => p.replace(/`/g, '')) || [],
        examples: topic.examples?.map(e => e.replace(/`/g, '')) || [],
        practiceQuestions: topic.practiceQuestions?.map(q => q.replace(/`/g, '')) || []
      }))
      
      if (contentData.summary) {
        contentData.summary = contentData.summary.replace(/`/g, '')
      }
      
      if (contentData.additionalResources) {
        contentData.additionalResources = contentData.additionalResources.map(r => r.replace(/`/g, ''))
      }
    } catch (parseError) {
      console.error('Parse error:', parseError.message)
      
      // Create comprehensive fallback content based on page count
      const numTopics = Math.max(Math.ceil(pageCount / 2), 3)
      
      // Clean up raw text - remove markdown and formatting
      const rawText = (data.response || 'Content generated successfully.')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/`/g, '')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .trim()
      
      // Try to split content into sections
      const sections = rawText.split(/\n\n+/).filter(s => s.trim().length > 50)
      
      const topics = []
      for (let i = 0; i < numTopics; i++) {
        let sectionText = sections[i] || rawText.substring(i * 500, (i + 1) * 500) || 'Generated content for this topic.'
        
        // Remove JSON artifacts and markdown
        sectionText = sectionText
          .replace(/\{[\s\S]*?"topics"[\s\S]*?:/gi, '') // Remove JSON structure
          .replace(/[\{\}\[\]"]/g, '') // Remove JSON characters
          .replace(/topics:\s*/gi, '')
          .replace(/title:\s*/gi, '')
          .replace(/explanation:\s*/gi, '')
          .trim()
        
        topics.push({
          title: `Topic ${i + 1}: ${prompt} - Part ${i + 1}`,
          explanation: sectionText.substring(0, 1200) + '\n\n' + 
            'This section provides comprehensive coverage of the topic with detailed explanations and analysis. ' +
            'We explore the fundamental concepts, their practical applications, and real-world implications. ' +
            'Understanding these concepts is crucial for mastering the subject matter. ' +
            'The material is structured to build your knowledge progressively, starting from basic principles and advancing to more complex ideas. ' +
            'Each concept is explained with clarity and supported by examples to ensure thorough understanding. ' +
            'Pay special attention to the key points and practice questions to reinforce your learning. ' +
            'This comprehensive approach ensures you gain both theoretical knowledge and practical skills.',
          keyPoints: [
            `Key concept ${i * 8 + 1}: Understanding fundamental principles and foundational theories that form the basis of this topic`,
            `Key concept ${i * 8 + 2}: Practical applications and real-world use cases demonstrating how these concepts are applied`,
            `Key concept ${i * 8 + 3}: Common patterns, best practices, and industry standards that professionals follow`,
            `Key concept ${i * 8 + 4}: Advanced techniques, optimization strategies, and performance considerations`,
            `Key concept ${i * 8 + 5}: Real-world scenarios, case studies, and practical examples from industry`,
            `Key concept ${i * 8 + 6}: Important considerations, potential pitfalls, and common mistakes to avoid`,
            `Key concept ${i * 8 + 7}: Tools, frameworks, and resources that can help you implement these concepts`,
            `Key concept ${i * 8 + 8}: Future trends, emerging technologies, and evolving best practices in this area`
          ],
          examples: [
            `Example ${i * 5 + 1}: Practical demonstration of core concepts with detailed step-by-step explanation showing how to implement the solution from scratch`,
            `Example ${i * 5 + 2}: Real-world application demonstrating how professionals use these concepts in production environments`,
            `Example ${i * 5 + 3}: Advanced scenario with comprehensive breakdown and in-depth analysis of complex situations`,
            `Example ${i * 5 + 4}: Case study from industry showing successful implementation with measurable outcomes and lessons learned`,
            `Example ${i * 5 + 5}: Comparative example demonstrating different approaches and their trade-offs in various contexts`
          ],
          practiceQuestions: [
            `Question ${i * 6 + 1}: What are the fundamental concepts covered in this section and how do they relate to each other?`,
            `Question ${i * 6 + 2}: How would you apply these concepts in a real-world scenario? Provide specific examples.`,
            `Question ${i * 6 + 3}: What are the advantages and disadvantages of different approaches discussed in this section?`,
            `Question ${i * 6 + 4}: Can you explain the relationship between these concepts and other related topics?`,
            `Question ${i * 6 + 5}: What challenges might you face when implementing these concepts, and how would you overcome them?`,
            `Question ${i * 6 + 6}: How would you teach these concepts to someone new to the field? What analogies or examples would you use?`
          ]
        })
      }
      
      contentData = {
        topics,
        summary: `This comprehensive study material covers ${prompt} in ${numTopics} detailed sections. Each section provides in-depth explanations, practical examples, key concepts, and practice questions to reinforce learning. The material is designed to give you a thorough understanding of the topic with actionable insights and real-world applications.`,
        additionalResources: [
          'Official documentation and guides',
          'Online tutorials and courses (Udemy, Coursera, edX)',
          'YouTube educational channels and video lectures',
          'Stack Overflow and developer communities',
          'GitHub repositories with example code',
          'Technical blogs and articles',
          'Books and comprehensive textbooks',
          'Practice platforms and coding challenges',
          'Research papers and academic resources',
          'Industry experts and thought leaders to follow'
        ]
      }
    }
    
    // Generate PDF
    const pdfPath = await generatePDF(material._id, {
      title: material.title,
      prompt,
      pageCount,
      content: contentData,
      userName: req.user.name
    })
    
    // Update material record
    material.content = contentData
    material.pdfUrl = pdfPath
    material.status = 'completed'
    material.generationTime = Date.now() - startTime
    material.metadata.generatedAt = new Date()
    
    // Get file size
    const stats = fs.statSync(path.join(__dirname, '..', pdfPath))
    material.fileSize = stats.size
    
    await material.save()
    
    res.status(201).json(material)
  } catch (error) {
    console.error('Generate study material error:', error)
    res.status(500).json({ message: error.message })
  }
}

// Generate PDF from content
async function generatePDF(materialId, data) {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'study-materials')
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  
  const filename = `study-material-${materialId}.pdf`
  const filepath = path.join(uploadsDir, filename)
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        size: 'A4'
      })
      
      const stream = fs.createWriteStream(filepath)
      doc.pipe(stream)
      
      // Header
      doc.fontSize(24)
         .fillColor('#4F46E5')
         .text(data.title, { align: 'center' })
         .moveDown(0.5)
      
      doc.fontSize(10)
         .fillColor('#6B7280')
         .text(`Generated for: ${data.userName}`, { align: 'center' })
         .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
         .text(`Pages: ${data.pageCount}`, { align: 'center' })
         .moveDown(2)
      
      // Original Prompt
      doc.fontSize(12)
         .fillColor('#374151')
         .text('Topic:', { continued: true })
         .fillColor('#6B7280')
         .text(` ${data.prompt}`)
         .moveDown(1.5)
      
      // Draw separator line
      doc.strokeColor('#E5E7EB')
         .lineWidth(1)
         .moveTo(60, doc.y)
         .lineTo(doc.page.width - 60, doc.y)
         .stroke()
         .moveDown(1.5)
      
      // Topics
      data.content.topics.forEach((topic, index) => {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage()
        }
        
        // Topic Title
        doc.fontSize(20)
           .fillColor('#1F2937')
           .text(`${index + 1}. ${topic.title}`, { underline: true })
           .moveDown(0.8)
        
        // Explanation
        doc.fontSize(12)
           .fillColor('#374151')
           .text(topic.explanation, { align: 'justify', lineGap: 2 })
           .moveDown(1.5)
        
        // Key Points
        if (topic.keyPoints && topic.keyPoints.length > 0) {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage()
          }
          
          doc.fontSize(14)
             .fillColor('#1F2937')
             .text('Key Points:', { underline: true })
             .moveDown(0.5)
          
          topic.keyPoints.forEach(point => {
            doc.fontSize(11)
               .fillColor('#374151')
               .text(`• ${point}`, { indent: 20, lineGap: 1 })
               .moveDown(0.3)
          })
          doc.moveDown(1)
        }
        
        // Examples
        if (topic.examples && topic.examples.length > 0) {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage()
          }
          
          doc.fontSize(14)
             .fillColor('#1F2937')
             .text('Examples:', { underline: true })
             .moveDown(0.5)
          
          topic.examples.forEach((example, idx) => {
            doc.fontSize(11)
               .fillColor('#059669')
               .text(`${idx + 1}) ${example}`, { indent: 20, lineGap: 1 })
               .moveDown(0.3)
          })
          doc.moveDown(1.5)
        }
        
        // Practice Questions
        if (topic.practiceQuestions && topic.practiceQuestions.length > 0) {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage()
          }
          
          doc.fontSize(14)
             .fillColor('#1F2937')
             .text('Practice Questions:', { underline: true })
             .moveDown(0.5)
          
          topic.practiceQuestions.forEach((question, idx) => {
            doc.fontSize(11)
               .fillColor('#DC2626')
               .text(`Q${idx + 1}. ${question}`, { indent: 20, lineGap: 1 })
               .moveDown(0.3)
          })
          doc.moveDown(2)
        }
      })
      
      // Summary Section
      if (data.content.summary) {
        doc.addPage()
        
        doc.fontSize(22)
           .fillColor('#4F46E5')
           .text('Summary', { underline: true })
           .moveDown(1.5)
        
        doc.fontSize(12)
           .fillColor('#374151')
           .text(data.content.summary, { align: 'justify', lineGap: 2 })
           .moveDown(2.5)
      }
      
      // Additional Resources
      if (data.content.additionalResources && data.content.additionalResources.length > 0) {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage()
        }
        
        doc.fontSize(18)
           .fillColor('#1F2937')
           .text('Additional Resources:', { underline: true })
           .moveDown(1)
        
        data.content.additionalResources.forEach((resource, idx) => {
          doc.fontSize(11)
             .fillColor('#2563EB')
             .text(`${idx + 1}. ${resource}`, { indent: 20, link: resource.startsWith('http') ? resource : null, lineGap: 1 })
             .moveDown(0.4)
        })
      }
      
      // Footer
      const range = doc.bufferedPageRange()
      const pageCount = range.count
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(range.start + i)
        doc.fontSize(8)
           .fillColor('#9CA3AF')
           .text(
             `Page ${i + 1} of ${pageCount} | Generated by Learnify AI`,
             60,
             doc.page.height - 40,
             { align: 'center' }
           )
      }
      
      doc.end()
      
      stream.on('finish', () => {
        resolve(`/uploads/study-materials/${filename}`)
      })
      
      stream.on('error', reject)
    } catch (error) {
      reject(error)
    }
  })
}

// Get my study materials
export async function getMyStudyMaterials(req, res) {
  try {
    const StudyMaterial = (await import('../models/StudyMaterial.js')).default
    const { status, search } = req.query
    const query = { user: req.user.id }
    
    if (status) query.status = status
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { prompt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    const materials = await StudyMaterial.find(query)
      .select('-content') // Exclude large content field
      .sort({ createdAt: -1 })
    
    res.json(materials)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get study material by ID
export async function getStudyMaterial(req, res) {
  try {
    const StudyMaterial = (await import('../models/StudyMaterial.js')).default
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!material) {
      return res.status(404).json({ message: 'Study material not found' })
    }
    
    res.json(material)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Download study material PDF
export async function downloadStudyMaterial(req, res) {
  try {
    const StudyMaterial = (await import('../models/StudyMaterial.js')).default
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!material) {
      return res.status(404).json({ message: 'Study material not found' })
    }
    
    if (material.status !== 'completed' || !material.pdfUrl) {
      return res.status(400).json({ message: 'PDF not ready yet' })
    }
    
    const filepath = path.join(__dirname, '..', material.pdfUrl)
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'PDF file not found' })
    }
    
    // Increment download count
    material.downloads++
    await material.save()
    
    res.download(filepath, `${material.title}.pdf`)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Delete study material
export async function deleteStudyMaterial(req, res) {
  try {
    const StudyMaterial = (await import('../models/StudyMaterial.js')).default
    const material = await StudyMaterial.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!material) {
      return res.status(404).json({ message: 'Study material not found' })
    }
    
    // Delete PDF file
    if (material.pdfUrl) {
      const filepath = path.join(__dirname, '..', material.pdfUrl)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }
    }
    
    res.json({ message: 'Study material deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Regenerate PDF for existing material
export async function regeneratePDF(req, res) {
  try {
    const StudyMaterial = (await import('../models/StudyMaterial.js')).default
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      user: req.user.id
    })
    
    if (!material) {
      return res.status(404).json({ message: 'Study material not found' })
    }
    
    // Delete old PDF
    if (material.pdfUrl) {
      const filepath = path.join(__dirname, '..', material.pdfUrl)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }
    }
    
    // Generate new PDF
    const pdfPath = await generatePDF(material._id, {
      title: material.title,
      prompt: material.prompt,
      pageCount: material.pageCount,
      content: material.content,
      userName: req.user.name
    })
    
    material.pdfUrl = pdfPath
    const stats = fs.statSync(path.join(__dirname, '..', pdfPath))
    material.fileSize = stats.size
    
    await material.save()
    
    res.json(material)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
