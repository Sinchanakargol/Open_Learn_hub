import axios from 'axios'

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

/**
 * Call AI service with automatic fallback handling
 * @param {string} endpoint - The AI service endpoint (e.g., '/generate-note-summary')
 * @param {object} payload - The request payload
 * @param {function} fallbackFn - Function to generate fallback response
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<{data: any, isAIGenerated: boolean}>}
 */
export async function callAIService(endpoint, payload, fallbackFn, timeout = 10000) {
  try {
    const { data } = await axios.post(`${AI_URL}${endpoint}`, payload, { timeout })
    console.log(`✅ AI service responded for ${endpoint}`)
    return { data, isAIGenerated: true }
  } catch (error) {
    console.warn(`⚠️ AI service unavailable for ${endpoint}:`, error.message)
    
    if (fallbackFn) {
      const fallbackData = fallbackFn(payload)
      return { data: fallbackData, isAIGenerated: false }
    }
    
    throw error
  }
}

/**
 * Check if AI service is available
 * @returns {Promise<boolean>}
 */
export async function isAIServiceAvailable() {
  try {
    await axios.get(`${AI_URL}/status`, { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

export { AI_URL }
