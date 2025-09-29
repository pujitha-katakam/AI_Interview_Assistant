import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

// Define SpeechRecognition interface
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

export default function VoiceInput({ onTranscript, disabled = false, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = finalTranscriptRef.current
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        finalTranscriptRef.current = finalTranscript
        interimTranscriptRef.current = interimTranscript
        
        // Send the complete transcript (final + interim) to parent
        onTranscript(finalTranscript + interimTranscript)
      }
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
      setError('Speech recognition is not supported in this browser')
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      finalTranscriptRef.current = ''
      interimTranscriptRef.current = ''
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Failed to start speech recognition:', err)
        setError('Failed to start voice recording')
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Note: This is a placeholder for muting functionality
    // In a real implementation, you might want to control audio output
  }

  if (!isSupported) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Voice input is not supported in this browser
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className="flex items-center space-x-2"
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            <span>Stop Recording</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span>Start Recording</span>
          </>
        )}
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleMute}
        className="flex items-center space-x-1"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      
      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
      
      {isListening && (
        <div className="flex items-center space-x-1 text-sm text-blue-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span>Listening...</span>
        </div>
      )}
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}
