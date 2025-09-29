import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ConfigState, Difficulty } from '../../types'

const initialState: ConfigState = {
  timerValues: {
    easy: 20,
    medium: 60,
    hard: 120
  },
  difficultyOrder: ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'],
  scoringWeights: {
    easy: 1.0,
    medium: 1.75,
    hard: 2.25
  },
  backendUrl: 'http://localhost:8000'
}

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    updateTimerValues: (state, action: PayloadAction<Partial<ConfigState['timerValues']>>) => {
      state.timerValues = { ...state.timerValues, ...action.payload }
    },
    
    updateDifficultyOrder: (state, action: PayloadAction<Difficulty[]>) => {
      state.difficultyOrder = action.payload
    },
    
    updateScoringWeights: (state, action: PayloadAction<Partial<ConfigState['scoringWeights']>>) => {
      state.scoringWeights = { ...state.scoringWeights, ...action.payload }
    },
    
    updateBackendUrl: (state, action: PayloadAction<string>) => {
      state.backendUrl = action.payload
    }
  }
})

export const {
  updateTimerValues,
  updateDifficultyOrder,
  updateScoringWeights,
  updateBackendUrl
} = configSlice.actions

export default configSlice.reducer
