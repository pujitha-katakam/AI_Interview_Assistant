// Offline storage utilities for when backend is unavailable
import localforage from 'localforage'

const OFFLINE_STORAGE_KEY = 'offline_interviews'

export interface OfflineInterview {
  id: string
  candidateId: string
  questions: Array<{
    id: string
    difficulty: string
    question: string
    timeAllocatedSec: number
    answer?: string
    score?: number
    feedback?: string
  }>
  currentIndex: number
  status: 'in-progress' | 'completed'
  createdAt: string
  completedAt?: string
}

export const saveOfflineInterview = async (interview: OfflineInterview): Promise<void> => {
  try {
    const existing = await localforage.getItem<OfflineInterview[]>(OFFLINE_STORAGE_KEY) || []
    const updated = existing.filter(i => i.id !== interview.id)
    updated.push(interview)
    await localforage.setItem(OFFLINE_STORAGE_KEY, updated)
  } catch (error) {
    console.error('Failed to save offline interview:', error)
  }
}

export const getOfflineInterviews = async (): Promise<OfflineInterview[]> => {
  try {
    return await localforage.getItem<OfflineInterview[]>(OFFLINE_STORAGE_KEY) || []
  } catch (error) {
    console.error('Failed to get offline interviews:', error)
    return []
  }
}

export const getOfflineInterview = async (id: string): Promise<OfflineInterview | null> => {
  try {
    const interviews = await getOfflineInterviews()
    return interviews.find(i => i.id === id) || null
  } catch (error) {
    console.error('Failed to get offline interview:', error)
    return null
  }
}

export const deleteOfflineInterview = async (id: string): Promise<void> => {
  try {
    const existing = await localforage.getItem<OfflineInterview[]>(OFFLINE_STORAGE_KEY) || []
    const updated = existing.filter(i => i.id !== id)
    await localforage.setItem(OFFLINE_STORAGE_KEY, updated)
  } catch (error) {
    console.error('Failed to delete offline interview:', error)
  }
}

export const clearOfflineInterviews = async (): Promise<void> => {
  try {
    await localforage.removeItem(OFFLINE_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear offline interviews:', error)
  }
}
