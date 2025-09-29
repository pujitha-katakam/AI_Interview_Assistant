import { useDispatch } from 'react-redux'
import { selectRole } from '../store/slices/userSlice'
import { UserRole } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Users, User } from 'lucide-react'

export default function RoleSelection() {
  const dispatch = useDispatch()

  const handleRoleSelect = (role: UserRole) => {
    dispatch(selectRole(role))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
  Interview Assistant
</h1>

          <p className="text-lg text-muted-foreground">
            Choose your role to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
  {/* Interviewer Card - Soft Pink */}
  <Card className="cursor-pointer bg-pink-50 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 p-3 bg-pink-100 rounded-full w-fit">
        <Users className="h-8 w-8 text-pink-500" />
      </div>
      <CardTitle className="text-2xl">Interviewer</CardTitle>
      <CardDescription>
        Conduct interviews, manage candidates, and review results
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2 text-sm text-muted-foreground mb-6">
        <li>• Create and manage interview sessions</li>
        <li>• Upload and review candidate resumes</li>
        <li>• Generate AI-powered questions</li>
        <li>• Track candidate progress and scores</li>
        <li>• Access interview dashboard</li>
      </ul>
      <Button 
        onClick={() => handleRoleSelect('interviewer')}
        className="w-full"
        size="lg"
      >
        Continue as Interviewer
      </Button>
    </CardContent>
  </Card>

  {/* Interviewee Card - Soft Blue */}
  <Card className="cursor-pointer bg-blue-50 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
        <User className="h-8 w-8 text-blue-500" />
      </div>
      <CardTitle className="text-2xl">Interviewee</CardTitle>
      <CardDescription>
        Take interviews, answer questions, and track your progress
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2 text-sm text-muted-foreground mb-6">
        <li>• Participate in interview sessions</li>
        <li>• Answer timed questions</li>
        <li>• Receive real-time feedback</li>
        <li>• Track your performance</li>
        <li>• View your interview results</li>
      </ul>
      <Button 
        onClick={() => handleRoleSelect('interviewee')}
        variant="outline"
        className="w-full"
        size="lg"
      >
        Continue as Interviewee
      </Button>
    </CardContent>
  </Card>
</div>


        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            You can change your role later in the settings
          </p>
        </div>
      </div>
    </div>
  )
}
