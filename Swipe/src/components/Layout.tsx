import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { clearRole } from '../store/slices/userSlice'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Clock, Users, Settings } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const dispatch = useDispatch()
  const location = useLocation()
  const currentPath = location.pathname
  const { role } = useSelector((state: RootState) => state.user)

  const handleRoleChange = () => {
    dispatch(clearRole())
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">Interview Assistant</h1>
              <Badge variant="outline" className="hidden sm:inline-flex">
                AI-Powered
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRoleChange}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Change Role</span>
              </Button>
            </div>
            
            {role === 'interviewer' ? (
              <Tabs value={currentPath === '/' ? '/interviewer' : currentPath} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="/interviewee" asChild>
                    <Link to="/interviewee" className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Interviewee</span>
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger value="/interviewer" asChild>
                    <Link to="/interviewer" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Interviewer</span>
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Interview Mode</span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
