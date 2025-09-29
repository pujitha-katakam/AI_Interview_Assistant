import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { addCandidate } from '../store/slices/candidatesSlice'
import { addToast } from '../store/slices/uiSlice'
import { parseResume } from '../services/api'
import { parseResumeFile } from '../services/fileParser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Upload, FileText, User, Mail, Phone, CheckCircle } from 'lucide-react'
import { cn } from '../lib/utils'

interface ResumeUploaderProps {
  onComplete: (candidateId: string) => void
}

export default function ResumeUploader({ onComplete }: ResumeUploaderProps) {
  const dispatch = useDispatch()
  // const { backendUrl } = useSelector((state: RootState) => state.config)
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parsedData, setParsedData] = useState<{
    name?: string
    email?: string
    phone?: string
    filename: string
    fileSize: number
  } | null>(null)
  const [manualData, setManualData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [useBackend, setUseBackend] = useState(true)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      let result
      
      if (useBackend) {
        try {
          result = await parseResume(file)
        } catch (error) {
          console.warn('Backend parsing failed, falling back to client-side:', error)
          result = await parseResumeFile(file)
        }
      } else {
        result = await parseResumeFile(file)
      }

      setUploadProgress(100)
      clearInterval(progressInterval)

      setParsedData({
        name: result.name,
        email: result.email,
        phone: result.phone,
        filename: file.name,
        fileSize: file.size
      })

      setManualData({
        name: result.name || '',
        email: result.email || '',
        phone: result.phone || ''
      })

      dispatch(addToast({
        type: 'success',
        message: 'Resume parsed successfully!',
        duration: 3000
      }))

    } catch (error) {
      console.error('Resume parsing error:', error)
      dispatch(addToast({
        type: 'error',
        message: `Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      }))
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [dispatch, useBackend])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading
  })

  const handleSubmit = () => {
    const candidateId = Date.now().toString()
    const candidate = {
      id: candidateId,
      name: manualData.name || parsedData?.name || 'Unknown',
      email: manualData.email || parsedData?.email || '',
      phone: manualData.phone || parsedData?.phone || '',
      resumeMeta: parsedData ? {
        filename: parsedData.filename,
        type: parsedData.filename.endsWith('.pdf') ? 'pdf' as const : 'docx' as const,
        size: parsedData.fileSize
      } : undefined,
      createdAt: new Date().toISOString()
    }

    dispatch(addCandidate(candidate))
    dispatch(addToast({
      type: 'success',
      message: 'Profile created successfully!',
      duration: 3000
    }))

    onComplete(candidateId)
  }

  const isFormValid = manualData.name.trim() && manualData.email.trim()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Resume</span>
          </CardTitle>
          <CardDescription>
            Upload your resume in PDF or DOCX format. We'll extract your contact information automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-1">
          <Input
            type="checkbox"
            id="useBackend"
            checked={useBackend}
            onChange={(e) => setUseBackend(e.target.checked)}
            className="w-3 h-3 rounded accent-blue-500"
          />
          <Label htmlFor="useBackend" className="text-sm">
            Use AI-powered backend parsing (recommended)
          </Label>
        </div>


          <div
  {...getRootProps()}
  className={cn(
    "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out",
    isDragActive
      ? "border-blue-400 bg-blue-50 shadow-md scale-[1.02]"
      : "border-muted-foreground/25 bg-gradient-to-b from-pink-50 via-purple-50 to-blue-50 hover:shadow-lg hover:scale-[1.01]",
    isUploading && "pointer-events-none opacity-60"
  )}
>
  <input {...getInputProps()} />

  <div className="space-y-4">
    <Upload className="h-10 w-10 mx-auto text-blue-400 animate-bounce" />

    {isUploading ? (
      <div className="space-y-3">
        <p className="text-sm font-medium text-blue-600 flex items-center justify-center gap-2">
          <span className="animate-spin">⏳</span> Processing resume...
        </p>
        <Progress value={uploadProgress} className="w-full" />
      </div>
    ) : isDragActive ? (
      <p className="text-sm font-medium text-green-600 animate-pulse">
        🚀 Drop the file here...
      </p>
    ) : (
      <div className="space-y-1">
        <p className="text-sm font-medium text-purple-700 flex items-center justify-center gap-2">
          📂 Drag & drop your resume here, or click to select
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          📑 PDF or DOCX files up to 10MB
        </p>
      </div>
    )}
  </div>
</div>

        </CardContent>
      </Card>

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Extracted Information</span>
            </CardTitle>
            <CardDescription>
              Review and update your contact information before starting the interview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={manualData.name}
                    onChange={(e) => setManualData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                    placeholder="Your full name"
                  />
                </div>
                {parsedData.name && manualData.name !== parsedData.name && (
                  <p className="text-xs text-muted-foreground">
                    Extracted: {parsedData.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={manualData.email}
                    onChange={(e) => setManualData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    placeholder="your.email@example.com"
                  />
                </div>
                {parsedData.email && manualData.email !== parsedData.email && (
                  <p className="text-xs text-muted-foreground">
                    Extracted: {parsedData.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={manualData.phone}
                    onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {parsedData.phone && manualData.phone !== parsedData.phone && (
                  <p className="text-xs text-muted-foreground">
                    Extracted: {parsedData.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Resume processed successfully</span>
              </div>
              <Badge variant="outline">
                {parsedData.filename}
              </Badge>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={!isFormValid}
              className="w-full"
            >
              Continue to Interview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
