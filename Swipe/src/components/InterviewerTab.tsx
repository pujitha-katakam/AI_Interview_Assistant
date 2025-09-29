import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import CandidatesTable from './CandidatesTable'
import CandidateDetails from './CandidateDetails'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Search, Users, TrendingUp, Clock, CheckCircle, Plus, Settings } from 'lucide-react'

export default function InterviewerTab() {
  const { profiles, results, sortBy, sortOrder } = useSelector((state: RootState) => state.candidates)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')

  // Get all candidates with their results
  const candidatesWithResults = useMemo(() => {
    const candidates = Object.values(profiles).map(profile => {
      const result = results[profile.id]
      return {
        ...profile,
        result,
        status: (result ? 'completed' : 'in-progress') as 'completed' | 'in-progress'
      }
    })

    // Filter by search query
    const filtered = searchInput.trim() 
      ? candidates.filter(candidate => 
          candidate.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchInput.toLowerCase())
        )
      : candidates

    // Sort candidates
    return filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'score':
          const scoreA = a.result?.finalScore || 0
          const scoreB = b.result?.finalScore || 0
          comparison = scoreA - scoreB
          break
        case 'date':
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          comparison = dateA - dateB
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }, [profiles, results, searchInput, sortBy, sortOrder])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = candidatesWithResults.length
    const completed = candidatesWithResults.filter(c => c.status === 'completed').length
    const inProgress = total - completed
    const averageScore = completed > 0 
      ? Math.round(candidatesWithResults
          .filter(c => c.result)
          .reduce((sum, c) => sum + (c.result?.finalScore || 0), 0) / completed)
      : 0

    return { total, completed, inProgress, averageScore }
  }, [candidatesWithResults])

  if (selectedCandidateId) {
    return (
      <CandidateDetails 
        candidateId={selectedCandidateId}
        onBack={() => setSelectedCandidateId(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold 
               bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 
               bg-clip-text text-transparent 
               drop-shadow-md 
               animate-pulse">
  Interview Dashboard
</h1>

          <p className="text-gray-100">
  Manage and review candidate interviews
</p>

        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-gray-100">
              {stats.total} candidates
            </span>
          </div>
          <div className="flex space-x-2">
            <Button 
  variant="outline" 
  size="sm" 
  className="flex items-center border-white text-white hover:bg-gradient-to-r hover:from-pink-400 hover:via-purple-400 hover:to-blue-400 hover:text-black transition-all duration-300"
>
  <Settings className="h-4 w-4 mr-2" />
  Configure
</Button>

            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.averageScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find candidates by name or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <CandidatesTable 
        candidates={candidatesWithResults}
        onSelectCandidate={setSelectedCandidateId}
      />
    </div>
  )
}
