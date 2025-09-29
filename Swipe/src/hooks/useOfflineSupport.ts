import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addToast } from '../store/slices/uiSlice'

export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const dispatch = useDispatch()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      dispatch(addToast({
        type: 'success',
        message: 'Connection restored!',
        duration: 3000
      }))
    }

    const handleOffline = () => {
      setIsOnline(false)
      dispatch(addToast({
        type: 'warning',
        message: 'You are offline. Some features may be limited.',
        duration: 5000
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dispatch])

  return { isOnline }
}
