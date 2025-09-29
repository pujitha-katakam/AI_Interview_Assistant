// Mock AI responses for offline mode
import { QuestionResponse, ScoreResponse, FinalizeResponse } from '../types'

const mockQuestions: QuestionResponse[] = [
  {
    id: 1,
    difficulty: 'easy',
    question: 'What is the difference between React state and props?',
    timeLimit: 20
  },
  {
    id: 2,
    difficulty: 'easy',
    question: 'Explain the Node.js event loop in simple terms.',
    timeLimit: 20
  },
  {
    id: 3,
    difficulty: 'medium',
    question: 'How would you implement debounced search in React?',
    timeLimit: 60
  },
  {
    id: 4,
    difficulty: 'medium',
    question: 'Explain JWT authentication flow in Node.js/Express.',
    timeLimit: 60
  },
  {
    id: 5,
    difficulty: 'hard',
    question: 'Design a scalable file upload system with chunked uploads.',
    timeLimit: 120
  },
  {
    id: 6,
    difficulty: 'hard',
    question: 'Optimize a React app for large tables (10k+ rows).',
    timeLimit: 120
  }
]

export const generateMockQuestions = (): QuestionResponse[] => {
  return mockQuestions
}

export const scoreMockAnswer = (question: string, difficulty: string, answer: string): ScoreResponse => {
  // Simple scoring based on answer length and keywords
  const wordCount = answer.split(' ').length
  const hasKeywords = checkKeywords(question, answer)
  
  let score = 0
  
  if (wordCount < 10) {
    score = 2
  } else if (wordCount < 25) {
    score = 4
  } else if (wordCount < 50) {
    score = 6
  } else {
    score = 8
  }
  
  if (hasKeywords) {
    score = Math.min(10, score + 2)
  }
  
  const feedback = generateMockFeedback(score, difficulty, wordCount)
  
  return { score, feedback }
}

const checkKeywords = (question: string, answer: string): boolean => {
  const questionLower = question.toLowerCase()
  const answerLower = answer.toLowerCase()
  
  // Check for relevant technical terms based on question content
  if (questionLower.includes('react')) {
    return ['component', 'state', 'props', 'hook', 'jsx'].some(term => 
      answerLower.includes(term)
    )
  }
  
  if (questionLower.includes('node')) {
    return ['event', 'loop', 'async', 'callback', 'promise'].some(term => 
      answerLower.includes(term)
    )
  }
  
  if (questionLower.includes('authentication') || questionLower.includes('jwt')) {
    return ['token', 'login', 'session', 'security', 'encrypt'].some(term => 
      answerLower.includes(term)
    )
  }
  
  if (questionLower.includes('upload') || questionLower.includes('file')) {
    return ['chunk', 'stream', 'buffer', 'multipart', 'progress'].some(term => 
      answerLower.includes(term)
    )
  }
  
  return false
}

const generateMockFeedback = (score: number, difficulty: string, wordCount: number): string => {
  // Generate answer-based feedback based on content analysis
  let feedback = ''
  
  if (wordCount < 10) {
    feedback = 'Your answer is quite brief. Consider elaborating on the technical concepts and providing specific examples to demonstrate your understanding.'
  } else if (wordCount < 25) {
    feedback = 'You provided a moderate response. The answer shows some understanding, but could benefit from more technical depth and concrete examples.'
  } else {
    feedback = 'You provided a detailed response. Consider focusing on the most relevant technical aspects and ensuring clarity in your explanations.'
  }
  
  // Add difficulty-specific analysis
  if (difficulty === 'easy') {
    feedback += ' For basic concepts, try to explain the "why" behind your answer and provide simple examples.'
  } else if (difficulty === 'medium') {
    feedback += ' For intermediate topics, consider discussing implementation approaches and potential challenges.'
  } else {
    feedback += ' For advanced concepts, elaborate on system design considerations and trade-offs.'
  }
  
  // Add score-based insights
  if (score >= 8) {
    feedback += ' Your technical knowledge and communication are strong.'
  } else if (score >= 6) {
    feedback += ' Good foundation, focus on providing more specific technical details.'
  } else {
    feedback += ' Consider studying the fundamentals more deeply and practicing with real-world examples.'
  }
  
  return feedback
}

export const generateMockSummary = (items: any[], profile: any): FinalizeResponse => {
  const totalScore = items.reduce((sum, item) => sum + (item.aiScore || 0), 0)
  const averageScore = Math.round((totalScore / items.length) * 10)
  const finalScore = Math.min(100, averageScore)
  
  const completedQuestions = items.filter(item => item.answer).length
  const strengths = []
  const improvements = []
  
  if (finalScore >= 80) {
    strengths.push('strong technical knowledge', 'clear communication')
  } else if (finalScore >= 60) {
    strengths.push('good understanding of concepts')
    improvements.push('more detailed explanations')
  } else {
    improvements.push('deeper technical knowledge', 'more comprehensive answers')
  }
  
  if (completedQuestions < items.length) {
    improvements.push('completing all questions')
  }
  
  let summary = `${profile.name || 'The candidate'} demonstrated `
  
  if (strengths.length > 0) {
    summary += strengths.join(' and ') + '. '
  }
  
  if (improvements.length > 0) {
    summary += `Areas for improvement include ${improvements.join(', ')}. `
  }
  
  summary += `Overall performance: ${finalScore}/100.`
  
  return {
    finalScore,
    summary
  }
}
