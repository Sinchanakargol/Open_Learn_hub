import mongoose from 'mongoose'

const jobPostingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  companyLogo: { type: String },
  description: { type: String, required: true },
  
  jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'], required: true },
  location: { type: String },
  isRemote: { type: Boolean, default: false },
  
  salaryRange: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' }
  },
  
  requirements: [{ type: String }],
  responsibilities: [{ type: String }],
  benefits: [{ type: String }],
  
  relatedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  requiredSkills: [{ type: String }],
  
  applicationUrl: { type: String },
  applicationEmail: { type: String },
  
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date },
  
  applicants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'], default: 'pending' },
    resume: { type: String },
    coverLetter: { type: String }
  }],
  
  views: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false }
}, { timestamps: true })

jobPostingSchema.index({ isActive: 1, expiresAt: 1 })
jobPostingSchema.index({ requiredSkills: 1 })

export default mongoose.model('JobPosting', jobPostingSchema)
