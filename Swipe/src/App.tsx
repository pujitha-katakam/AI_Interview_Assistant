import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from './store'
import { showModal } from './store/slices/uiSlice'
import { restoreSession, setRehydrated } from './store/slices/sessionSlice'
import Layout from './components/Layout'
import IntervieweeTab from './components/IntervieweeTab'
import InterviewerTab from './components/InterviewerTab'
import RoleSelection from './components/RoleSelection'
import WelcomeBackModal from './components/WelcomeBackModal'
import ToastContainer from './components/ToastContainer'

function App() {
  const dispatch = useDispatch()
  const { currentSession, isRehydrated } = useSelector((state: RootState) => state.session)
  const { modals } = useSelector((state: RootState) => state.ui)
  const { isRoleSelected, role } = useSelector((state: RootState) => state.user)

  useEffect(() => {
    // Mark store as rehydrated on first render
    if (!isRehydrated) {
      dispatch(setRehydrated())
    }
  }, [dispatch, isRehydrated])

  useEffect(() => {
    // Check for existing session on app load after store is rehydrated
    if (isRehydrated && currentSession && currentSession.status === 'in-progress') {
      dispatch(restoreSession(currentSession))
      dispatch(showModal('welcomeBack'))
    }
  }, [dispatch, currentSession, isRehydrated])

  // Show role selection if no role is selected
  if (!isRoleSelected) {
    return (
      <div className="min-h-screen bg-background">
        <RoleSelection />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Layout>
        <Routes>
          <Route 
            path="/" 
            element={
              role === 'interviewee' 
                ? <Navigate to="/interviewee" replace /> 
                : <Navigate to="/interviewer" replace />
            } 
          />
          <Route 
            path="/interviewee" 
            element={
              role === 'interviewee' 
                ? <IntervieweeTab /> 
                : <Navigate to="/interviewer" replace />
            } 
          />
          <Route 
            path="/interviewer" 
            element={
              role === 'interviewer' 
                ? <InterviewerTab /> 
                : <Navigate to="/interviewee" replace />
            } 
          />
        </Routes>
      </Layout>
      
      {/* Modals */}
      {modals.welcomeBack && <WelcomeBackModal />}
      
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}

export default App
