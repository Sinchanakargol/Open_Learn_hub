import mongoose from 'mongoose'

const studyMaterialSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  prompt: { type: String, required: true },
  pageCount: { type: Number, required: true },
  
  content: {
    topics: [{
      title: { type: String },
      explanation: { type: String },
      keyPoints: [{ type: String }],
      examples: [{ type: String }],
      practiceQuestions: [{ type: String }]
    }],
    summary: { type: String },
    additionalResources: [{ type: String }]
  },
  
  pdfUrl: { type: String },
  fileSize: { type: Number }, // in bytes
  
  status: { 
    type: String, 
    enum: ['generating', 'completed', 'failed'], 
    default: 'generating' 
  },
  
  generationTime: { type: Number }, // milliseconds
  downloads: { type: Number, default: 0 },
  
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: false },
  
  metadata: {
    aiModel: { type: String, default: 'gemini-2.0-flash-exp' },
    generatedAt: { type: Date }
  }
}, { timestamps: true })

studyMaterialSchema.index({ user: 1, createdAt: -1 })
studyMaterialSchema.index({ tags: 1 })
studyMaterialSchema.index({ isPublic: 1 })

export default mongoose.model('StudyMaterial', studyMaterialSchema)
