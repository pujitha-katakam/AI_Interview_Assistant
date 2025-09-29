import { CheckCircle } from 'lucide-react'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import { QAItem } from '../types'

interface ProgressStepperProps {
  currentStep: number
  totalSteps: number
  questions: QAItem[]
}

export default function ProgressStepper({ currentStep, totalSteps, questions }: ProgressStepperProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
  Progress
</h3>

        <span className="text-sm text-muted-foreground">
          {currentStep} of {totalSteps} questions
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {questions.map((question, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={question.id} className="flex items-center">
              <div className="flex items-center space-x-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                    isCompleted && "bg-green-100 border-green-500 text-green-700",
                    isCurrent && "bg-primary border-primary text-primary-foreground",
                    isUpcoming && "bg-muted border-muted-foreground text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      getDifficultyColor(question.difficulty)
                    )}
                  >
                    {question.difficulty}
                  </Badge>
                </div>
              </div>
              
              {index < questions.length - 1 && (
                <div className="w-8 h-0.5 bg-muted mx-2" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
