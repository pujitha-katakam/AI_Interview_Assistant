import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CandidateProfile, CandidateResult } from '../../types'

interface CandidatesState {
  profiles: Record<string, CandidateProfile>;
  results: Record<string, CandidateResult>;
  searchQuery: string;
  sortBy: 'score' | 'date' | 'name';
  sortOrder: 'asc' | 'desc';
}

const initialState: CandidatesState = {
  profiles: {},
  results: {},
  searchQuery: '',
  sortBy: 'score',
  sortOrder: 'desc'
}

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<CandidateProfile>) => {
      state.profiles[action.payload.id] = action.payload
    },
    
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<CandidateProfile> }>) => {
      if (state.profiles[action.payload.id]) {
        state.profiles[action.payload.id] = {
          ...state.profiles[action.payload.id],
          ...action.payload.updates
        }
      }
    },
    
    addResult: (state, action: PayloadAction<CandidateResult>) => {
      state.results[action.payload.candidateId] = action.payload
    },
    
    updateResult: (state, action: PayloadAction<{ candidateId: string; updates: Partial<CandidateResult> }>) => {
      if (state.results[action.payload.candidateId]) {
        state.results[action.payload.candidateId] = {
          ...state.results[action.payload.candidateId],
          ...action.payload.updates
        }
      }
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    
    setSortBy: (state, action: PayloadAction<'score' | 'date' | 'name'>) => {
      state.sortBy = action.payload
    },
    
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload
    },
    
    removeCandidate: (state, action: PayloadAction<string>) => {
      delete state.profiles[action.payload]
      delete state.results[action.payload]
    }
  }
})

export const {
  addCandidate,
  updateCandidate,
  addResult,
  updateResult,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  removeCandidate
} = candidatesSlice.actions

export default candidatesSlice.reducer
