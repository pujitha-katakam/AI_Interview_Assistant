import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UIState } from '../../types'

const initialState: UIState = {
  modals: {
    welcomeBack: false,
    resumeUpload: false
  },
  toasts: []
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true
    },
    
    hideModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false
    },
    
    addToast: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      duration?: number;
    }>) => {
      const toast = {
        id: Date.now().toString(),
        ...action.payload
      }
      state.toasts.push(toast)
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload)
    },
    
    clearToasts: (state) => {
      state.toasts = []
    }
  }
})

export const {
  showModal,
  hideModal,
  addToast,
  removeToast,
  clearToasts
} = uiSlice.actions

export default uiSlice.reducer
