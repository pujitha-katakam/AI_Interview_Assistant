import { useDispatch } from 'react-redux'
import { addToast } from '../store/slices/uiSlice'

export const useErrorHandler = () => {
  const dispatch = useDispatch()

  const handleError = (error: unknown, fallbackMessage: string = 'An unexpected error occurred') => {
    console.error('Error:', error)
    
    let message = fallbackMessage
    let type: 'error' | 'warning' = 'error'

    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message)
    }

    // Handle specific error types
    if (message.includes('Network Error') || message.includes('fetch')) {
      message = 'Network connection failed. Please check your internet connection.'
      type = 'warning'
    } else if (message.includes('timeout')) {
      message = 'Request timed out. Please try again.'
    } else if (message.includes('404')) {
      message = 'Service not found. Please check if the backend is running.'
    } else if (message.includes('500')) {
      message = 'Server error. Please try again later.'
    }

    dispatch(addToast({
      type,
      message,
      duration: 5000
    }))
  }

  const handleSuccess = (message: string) => {
    dispatch(addToast({
      type: 'success',
      message,
      duration: 3000
    }))
  }

  const handleWarning = (message: string) => {
    dispatch(addToast({
      type: 'warning',
      message,
      duration: 4000
    }))
  }

  const handleInfo = (message: string) => {
    dispatch(addToast({
      type: 'info',
      message,
      duration: 3000
    }))
  }

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo
  }
}
