import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { InterviewSession, QAItem } from '../../types'

interface SessionState {
  currentSession: InterviewSession | null;
  isActive: boolean;
  currentQuestionIndex: number;
  remainingTime: number;
  isTimerRunning: boolean;
  lastTimerUpdate: number;
  isRehydrated: boolean;
}

const initialState: SessionState = {
  currentSession: null,
  isActive: false,
  currentQuestionIndex: 0,
  remainingTime: 0,
  isTimerRunning: false,
  lastTimerUpdate: Date.now(),
  isRehydrated: false
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<{ candidateId: string; questions: QAItem[] }>) => {
      state.currentSession = {
        candidateId: action.payload.candidateId,
        status: 'in-progress',
        items: action.payload.questions,
        currentIndex: 0
      }
      state.isActive = true
      state.currentQuestionIndex = 0
      state.remainingTime = action.payload.questions[0]?.timeAllocatedSec || 0
      state.isTimerRunning = true
      state.lastTimerUpdate = Date.now()
    },
    
    updateTimer: (state, _action: PayloadAction<number>) => {
      if (state.isTimerRunning) {
        const now = Date.now()
        const delta = (now - state.lastTimerUpdate) / 1000
        state.remainingTime = Math.max(0, state.remainingTime - delta)
        state.lastTimerUpdate = now
      }
    },
    
    pauseTimer: (state) => {
      state.isTimerRunning = false
    },
    
    resumeTimer: (state) => {
      state.isTimerRunning = true
      state.lastTimerUpdate = Date.now()
    },
    
    submitAnswer: (state, action: PayloadAction<{ answer: string; score?: number; feedback?: string }>) => {
      if (state.currentSession && state.currentSession.items[state.currentQuestionIndex]) {
        const currentItem = state.currentSession.items[state.currentQuestionIndex]
        currentItem.answer = action.payload.answer
        currentItem.submittedAt = new Date().toISOString()
        if (action.payload.score !== undefined) {
          currentItem.aiScore = action.payload.score
        }
        if (action.payload.feedback) {
          currentItem.aiFeedback = action.payload.feedback
        }
      }
    },
    
    nextQuestion: (state) => {
      if (state.currentSession) {
        state.currentQuestionIndex += 1
        state.currentSession.currentIndex = state.currentQuestionIndex
        if (state.currentQuestionIndex < state.currentSession.items.length) {
          state.remainingTime = state.currentSession.items[state.currentQuestionIndex].timeAllocatedSec
          state.isTimerRunning = true
          state.lastTimerUpdate = Date.now()
        } else {
          state.currentSession.status = 'completed'
          state.isActive = false
          state.isTimerRunning = false
        }
      }
    },
    
    completeSession: (state) => {
      if (state.currentSession) {
        state.currentSession.status = 'completed'
        state.isActive = false
        state.isTimerRunning = false
      }
    },
    
    clearSession: (state) => {
      state.currentSession = null
      state.isActive = false
      state.currentQuestionIndex = 0
      state.remainingTime = 0
      state.isTimerRunning = false
      state.lastTimerUpdate = Date.now()
    },
    
    restoreSession: (state, action: PayloadAction<InterviewSession>) => {
      state.currentSession = action.payload
      state.isActive = action.payload.status === 'in-progress'
      state.currentQuestionIndex = action.payload.currentIndex
      
      if (state.isActive && action.payload.items[state.currentQuestionIndex]) {
        const currentItem = action.payload.items[state.currentQuestionIndex]
        if (currentItem.startedAt) {
          const startTime = new Date(currentItem.startedAt).getTime()
          const now = Date.now()
          const elapsed = (now - startTime) / 1000
          state.remainingTime = Math.max(0, currentItem.timeAllocatedSec - elapsed)
        } else {
          state.remainingTime = currentItem.timeAllocatedSec
        }
        state.isTimerRunning = true
        state.lastTimerUpdate = Date.now()
      }
    },
    
    setRehydrated: (state) => {
      state.isRehydrated = true
    },
    
    markQuestionStarted: (state) => {
      if (state.currentSession && state.currentSession.items[state.currentQuestionIndex]) {
        state.currentSession.items[state.currentQuestionIndex].startedAt = new Date().toISOString()
      }
    }
  }
})

export const {
  startSession,
  updateTimer,
  pauseTimer,
  resumeTimer,
  submitAnswer,
  nextQuestion,
  completeSession,
  clearSession,
  restoreSession,
  setRehydrated,
  markQuestionStarted
} = sessionSlice.actions

export default sessionSlice.reducer
