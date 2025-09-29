import { Badge } from './ui/badge'
import { Clock } from 'lucide-react'
import { cn } from '../lib/utils'

interface TimerBadgeProps {
  remainingTime: number
  isRunning: boolean
  className?: string
}

export default function TimerBadge({ remainingTime, isRunning, className }: TimerBadgeProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getVariant = () => {
    if (remainingTime <= 10) return 'destructive'
    if (remainingTime <= 30) return 'secondary'
    return 'default'
  }

  return (
    <Badge 
      variant={getVariant()} 
      className={cn(
        "flex items-center space-x-2 px-3 py-1",
        !isRunning && "opacity-50",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      <span className="font-mono text-sm">
        {formatTime(remainingTime)}
      </span>
    </Badge>
  )
}
