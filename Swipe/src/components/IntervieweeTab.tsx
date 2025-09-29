import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { 
  startSession, updateTimer, submitAnswer, nextQuestion, completeSession, 
  markQuestionStarted, clearSession 
} from '../store/slices/sessionSlice'
import { addResult } from '../store/slices/candidatesSlice'
import { addToast } from '../store/slices/uiSlice'
import { clearRole } from '../store/slices/userSlice'
import { generateQuestions, scoreAnswer, finalizeInterview } from '../services/api'
import ResumeUploader from './ResumeUploader'
import TimerBadge from './TimerBadge'
import ProgressStepper from './ProgressStepper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CheckCircle, User, Mail, Home, Square, Upload } from 'lucide-react'
import VoiceInput from './VoiceInput'

export default function IntervieweeTab() {
  const dispatch = useDispatch()
  const { currentSession, isActive, currentQuestionIndex, remainingTime, isTimerRunning } = useSelector((state: RootState) => state.session)
  const { profiles, results } = useSelector((state: RootState) => state.candidates)

  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleVoiceTranscript = (transcript: string) => setCurrentAnswer(transcript)

  const handleInterviewComplete = useCallback(async () => {
    if (!currentSession) return
    try {
      const candidate = profiles[currentSession.candidateId]
      if (!candidate) return

      const result = await finalizeInterview({ items: currentSession.items, profile: candidate })
      dispatch(addResult({
        candidateId: currentSession.candidateId,
        finalScore: result.finalScore,
        summary: result.summary,
        finishedAt: new Date().toISOString()
      }))
      dispatch(completeSession())
      setShowResults(true)
      dispatch(addToast({ type: 'success', message: 'Interview completed! Thank you for your time.', duration: 5000 }))
    } catch (error) {
      console.error('Failed to finalize interview:', error)
      dispatch(addToast({ type: 'error', message: 'Failed to complete interview. Please try again.', duration: 5000 }))
    }
  }, [currentSession, profiles, dispatch])

  const handleEndInterview = useCallback(async () => {
    if (!currentSession) return
    const confirmed = window.confirm('Are you sure you want to end the interview early? Your progress will be saved and scored.')
    if (!confirmed) return

    try {
      const candidate = profiles[currentSession.candidateId]
      if (!candidate) return

      const result = await finalizeInterview({ items: currentSession.items, profile: candidate })
      dispatch(addResult({
        candidateId: currentSession.candidateId,
        finalScore: result.finalScore,
        summary: result.summary,
        finishedAt: new Date().toISOString()
      }))

      dispatch(clearSession())
      dispatch(clearRole())
      setShowResults(false)
      dispatch(addToast({ type: 'success', message: 'Interview ended early. Thank you for your time.', duration: 5000 }))
    } catch (error) {
      console.error('Failed to end interview:', error)
      dispatch(addToast({ type: 'error', message: 'Failed to end interview. Please try again.', duration: 5000 }))
    }
  }, [currentSession, profiles, dispatch])

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentSession || !currentAnswer.trim()) return
    setIsSubmitting(true)
    try {
      const currentQuestion = currentSession.items[currentQuestionIndex]
      const scoreResult = await scoreAnswer({ question: currentQuestion.question, difficulty: currentQuestion.difficulty, answer: currentAnswer })

      dispatch(submitAnswer({ answer: currentAnswer, score: scoreResult.score, feedback: scoreResult.feedback }))
      setCurrentAnswer('')

      if (currentQuestionIndex < currentSession.items.length - 1) {
        dispatch(nextQuestion())
        dispatch(addToast({ type: 'info', message: `Answer submitted! Moving to question ${currentQuestionIndex + 2}...`, duration: 2000 }))
      } else {
        await handleInterviewComplete()
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      dispatch(addToast({ type: 'error', message: 'Failed to submit answer. Please try again.', duration: 5000 }))
    } finally {
      setIsSubmitting(false)
    }
  }, [currentSession, currentAnswer, currentQuestionIndex, dispatch, handleInterviewComplete])

  useEffect(() => {
    if (isActive && currentSession && currentSession.items[currentQuestionIndex]) {
      const currentItem = currentSession.items[currentQuestionIndex]
      if (!currentItem.startedAt) dispatch(markQuestionStarted())
    }
  }, [isActive, currentSession, currentQuestionIndex, dispatch])

  useEffect(() => {
    if (isTimerRunning && remainingTime > 0) {
      const interval = setInterval(() => dispatch(updateTimer(Date.now())), 1000)
      return () => clearInterval(interval)
    } else if (isTimerRunning && remainingTime <= 0) {
      handleSubmitAnswer()
    }
  }, [isTimerRunning, remainingTime, dispatch, handleSubmitAnswer])

  const handleResumeUploadComplete = async (candidateId: string) => {
    try {
      dispatch(addToast({ type: 'info', message: 'Generating interview questions...', duration: 2000 }))

      const questions = await generateQuestions({ role: 'fullstack', counts: { easy: 2, medium: 2, hard: 2 }, seed: 42 })
      const qaItems = questions.map((q, index) => ({
        id: `q${index + 1}`,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        question: q.question,
        timeAllocatedSec: q.timeLimit,
        startedAt: index === 0 ? new Date().toISOString() : undefined
      }))

      dispatch(startSession({ candidateId, questions: qaItems }))
      dispatch(addToast({ type: 'success', message: 'Interview started! Good luck!', duration: 3000 }))
    } catch (error) {
      console.error('Failed to start interview:', error)
      dispatch(addToast({ type: 'error', message: 'Failed to generate questions. Please try again.', duration: 5000 }))
    }
  }

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`

  // Resume Upload Page
  if (!isActive && !showResults) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 bg-clip-text text-transparent drop-shadow-md animate-pulse">
          Welcome to Your Interview
        </h1>
        <p className="text-lg text-muted-foreground flex items-center gap-3">
          <Upload className="h-5 w-5 text-pink-200 flex-shrink-0" />
          <span>Upload your resume to get started with the AI-powered interview process.</span>
        </p>
      </div>
      <ResumeUploader onComplete={handleResumeUploadComplete} />
    </div>
  )

  // Feedback / Thank You Page
  if (showResults && currentSession) {
    const candidate = profiles[currentSession.candidateId]
    const result = results[currentSession.candidateId]

    const handleGoHome = () => {
      dispatch(clearSession())
      dispatch(clearRole())
      setShowResults(false)
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-pink-50 hover:bg-pink-100 transition-colors duration-300">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span>Interview Completed!</span>
            </CardTitle>
            <CardDescription>Thank you for completing the interview! If you are shortlisted, our team will contact you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">Thanks for attending!</h3>
              <p className="text-green-600 dark:text-green-300">Your interview has been successfully completed. We appreciate your time and effort.</p>
            </div>

            {candidate && (
              <div className="flex items-center justify-start space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2"><User className="h-4 w-4" /><span>{candidate.name}</span></div>
                <div className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>{candidate.email}</span></div>
              </div>
            )}

            {result && (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-primary">{result.finalScore}/100</div>
                <p className="text-lg font-medium">Final Score</p>
                <div className="p-4 bg-muted rounded-lg text-left">
                  <h4 className="font-medium mb-2">Interview Summary</h4>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Button onClick={handleGoHome} className="flex items-center space-x-2" size="lg">
                <Home className="h-4 w-4" /><span>Go to Home Page</span>
              </Button>
              <Button onClick={() => { setShowResults(false); dispatch(startSession({ candidateId: '', questions: [] })) }} variant="outline" size="lg">Start New Interview</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentSession) return null

  // Active Interview Page
  const currentQuestion = currentSession.items[currentQuestionIndex]
  const candidate = profiles[currentSession.candidateId]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold 
               bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 
               bg-clip-text text-transparent 
               drop-shadow-md 
               animate-pulse">
  Technical Interview
</h1>

          {candidate && (
  <p className="text-sm font-medium bg-gradient-to-r from-teal-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
    {candidate.name} • {candidate.email}
  </p>
)}

        </div>
        <div className="flex items-center space-x-4">
          <TimerBadge remainingTime={remainingTime} isRunning={isTimerRunning} />
          <Button onClick={handleEndInterview} variant="outline" size="sm" className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50">
            <Square className="h-4 w-4" /><span>End Interview</span>
          </Button>
        </div>
      </div>

      <ProgressStepper currentStep={currentQuestionIndex + 1} totalSteps={currentSession.items.length} questions={currentSession.items} />

      <Card className="bg-blue-50 hover:bg-blue-100 transition-colors duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
            <Badge variant={currentQuestion.difficulty === 'easy' ? 'default' : currentQuestion.difficulty === 'medium' ? 'secondary' : 'destructive'}>
              {currentQuestion.difficulty}
            </Badge>
          </div>
          <CardDescription>Time limit: {formatTime(currentQuestion.timeAllocatedSec)}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6">{currentQuestion.question}</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="answer" className="text-sm font-medium">Your Answer</label>
              <VoiceInput onTranscript={handleVoiceTranscript} disabled={isSubmitting} className="flex-shrink-0" />
            </div>
            <textarea id="answer" value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder="Type your answer here or use voice input..." className="w-full min-h-[200px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary" disabled={isSubmitting} />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{currentAnswer.length} characters</p>
              <Button onClick={handleSubmitAnswer} disabled={!currentAnswer.trim() || isSubmitting} className="min-w-[120px]">{isSubmitting ? 'Submitting...' : 'Submit Answer'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
