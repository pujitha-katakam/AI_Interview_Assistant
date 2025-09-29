import axios from 'axios'
import { 
  ResumeParseResponse, 
  QuestionResponse, 
  ScoreResponse, 
  FinalizeResponse,
  QuestionRequest,
  ScoreRequest,
  FinalizeRequest
} from '../types'
import { 
  generateMockQuestions, 
  scoreMockAnswer, 
  generateMockSummary 
} from './mockAI'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Resume parsing
export const parseResume = async (file: File): Promise<ResumeParseResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/parse-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

// Question generation
export const generateQuestions = async (request: QuestionRequest): Promise<QuestionResponse[]> => {
  try {
    const response = await api.post('/generate-questions', request)
    return response.data
  } catch (error) {
    console.warn('Backend unavailable, using mock questions:', error)
    return generateMockQuestions()
  }
}

// Answer scoring
export const scoreAnswer = async (request: ScoreRequest): Promise<ScoreResponse> => {
  try {
    const response = await api.post('/score-answer', request)
    return response.data
  } catch (error) {
    console.warn('Backend unavailable, using mock scoring:', error)
    return scoreMockAnswer(request.question, request.difficulty, request.answer)
  }
}

// Interview finalization
export const finalizeInterview = async (request: FinalizeRequest): Promise<FinalizeResponse> => {
  try {
    const response = await api.post('/finalize', request)
    return response.data
  } catch (error) {
    console.warn('Backend unavailable, using mock finalization:', error)
    return generateMockSummary(request.items, request.profile)
  }
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
