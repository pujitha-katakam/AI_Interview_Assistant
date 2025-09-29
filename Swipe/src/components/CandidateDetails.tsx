import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { ArrowLeft, User, Mail, Phone, Calendar, Award, Clock, CheckCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface CandidateDetailsProps {
  candidateId: string
  onBack: () => void
}

export default function CandidateDetails({ candidateId, onBack }: CandidateDetailsProps) {
  const { profiles, results } = useSelector((state: RootState) => state.candidates)
  const { currentSession } = useSelector((state: RootState) => state.session)

  const candidate = profiles[candidateId]
  const result = results[candidateId]
  const isCurrentSession = currentSession?.candidateId === candidateId

  if (!candidate) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Candidates</span>
        </Button>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Candidate not found</h3>
              <p className="text-muted-foreground">
                The requested candidate could not be found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
  onClick={onBack}
  className="flex items-center space-x-2 bg-white text-black hover:bg-gray-200 transition"
>
  <ArrowLeft className="h-4 w-4" />
  <span>Back to Candidates</span>
</Button>

        {isCurrentSession && (
          <Badge variant="secondary" className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span>Currently Interviewing</span>
          </Badge>
        )}
      </div>

      {/* Candidate Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Candidate Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name</span>
              </div>
              <p className="text-sm text-muted-foreground">{candidate.name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email</span>
              </div>
              <p className="text-sm text-muted-foreground">{candidate.email}</p>
            </div>

            {candidate.phone && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone</span>
                </div>
                <p className="text-sm text-muted-foreground">{candidate.phone}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Interview Date</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(candidate.createdAt), 'MMMM dd, yyyy \'at\' h:mm a')}
              </p>
            </div>
          </div>

          {candidate.resumeMeta && (
            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Resume</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{candidate.resumeMeta.type.toUpperCase()}</Badge>
                <span className="text-sm text-muted-foreground">
                  {candidate.resumeMeta.filename}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Results */}
      {result ? (
        <div className="space-y-6">
          {/* Final Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Interview Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className={`text-4xl font-bold ${getScoreColor(result.finalScore)}`}>
                  {result.finalScore}/100
                </div>
                <div className="text-lg font-medium">
                  {getScoreLabel(result.finalScore)}
                </div>
                <Progress value={result.finalScore} className="w-full max-w-xs mx-auto" />
              </div>

              {result.finishedAt && (
                <div className="text-center text-sm text-muted-foreground">
                  Completed on {format(new Date(result.finishedAt), 'MMMM dd, yyyy \'at\' h:mm a')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>AI Assessment Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Question Breakdown */}
          {currentSession && currentSession.candidateId === candidateId && (
            <Card>
              <CardHeader>
                <CardTitle>Question Breakdown</CardTitle>
                <CardDescription>
                  Detailed performance for each interview question
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentSession.items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Question {index + 1}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            item.difficulty === 'easy' ? 'default' : 
                            item.difficulty === 'medium' ? 'secondary' : 'destructive'
                          }>
                            {item.difficulty}
                          </Badge>
                          {item.aiScore !== undefined && (
                            <span className={`font-medium ${getScoreColor(item.aiScore * 10)}`}>
                              {item.aiScore}/10
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{item.question}</p>
                      
                      {item.answer && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Answer:</h5>
                          <p className="text-sm bg-muted p-3 rounded">{item.answer}</p>
                        </div>
                      )}
                      
                      {item.aiFeedback && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">AI Feedback:</h5>
                          <p className="text-sm text-muted-foreground">{item.aiFeedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Interview in Progress</h3>
              <p className="text-muted-foreground">
                This candidate is currently taking their interview. Results will appear here once completed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
