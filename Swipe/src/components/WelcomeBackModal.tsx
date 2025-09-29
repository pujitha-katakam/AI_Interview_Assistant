import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { hideModal } from '../store/slices/uiSlice'
import { clearSession, resumeTimer } from '../store/slices/sessionSlice'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Clock, User, Mail, Phone } from 'lucide-react'

export default function WelcomeBackModal() {
  const dispatch = useDispatch()
  const { currentSession, remainingTime, currentQuestionIndex } = useSelector((state: RootState) => state.session)
  const { profiles } = useSelector((state: RootState) => state.candidates)

  // const handleAccept = () => {
  //   dispatch(resumeTimer())
  //   dispatch(hideModal('welcomeBack'))
  // }

  const handleContinue = () => {
    dispatch(resumeTimer())
    dispatch(hideModal('welcomeBack'))
  }

  const handleDiscard = () => {
    dispatch(clearSession())
    dispatch(hideModal('welcomeBack'))
  }

  if (!currentSession) return null

  const candidate = profiles[currentSession.candidateId]
  const currentQuestion = currentSession.items[currentQuestionIndex]
  // const progress = ((currentQuestionIndex + 1) / currentSession.items.length) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={true} onOpenChange={() => dispatch(hideModal('welcomeBack'))}>
  <DialogContent className="sm:max-w-md bg-gray-900 text-gray-100 shadow-2xl rounded-xl">
    <DialogHeader>
      <DialogTitle className="flex items-center space-x-2 text-blue-400">
        <Clock className="h-5 w-5" />
        <span>Welcome Back!</span>
      </DialogTitle>
      <DialogDescription className="text-gray-300">
        You have an interview session in progress. What would you like to do?
      </DialogDescription>
    </DialogHeader>

    <Card className="bg-gray-800 border border-gray-700 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Interview Session</CardTitle>
        <CardDescription className="text-gray-400">
          Progress: {currentQuestionIndex + 1} of {currentSession.items.length} questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {candidate && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-300" />
              <span className="font-medium">{candidate.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-300" />
              <span className="text-sm text-gray-300">{candidate.email}</span>
            </div>
            {candidate.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-300" />
                <span className="text-sm text-gray-300">{candidate.phone}</span>
              </div>
            )}
          </div>
        )}

        {currentQuestion && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200">Current Question</span>
              <Badge
                variant={
                  currentQuestion.difficulty === 'easy'
                    ? 'default'
                    : currentQuestion.difficulty === 'medium'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <p className="text-sm text-gray-300">
              {currentQuestion.question}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Time remaining:</span>
              <span className="font-mono text-white">{formatTime(remainingTime)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <DialogFooter className="flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        onClick={handleDiscard}
        className="w-full sm:w-auto border-gray-500 text-gray-200 hover:bg-gray-700"
      >
        Discard Session
      </Button>
      <Button
        onClick={handleContinue}
        className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
      >
        Continue Interview
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

  )
}
