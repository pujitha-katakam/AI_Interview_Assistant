import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setSortBy, setSortOrder } from '../store/slices/candidatesSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, User, Mail, Phone, Calendar, Award } from 'lucide-react'
import { format } from 'date-fns'

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  createdAt: string
  result?: {
    finalScore: number
    summary: string
    finishedAt?: string
  }
  status: 'completed' | 'in-progress'
}

interface CandidatesTableProps {
  candidates: Candidate[]
  onSelectCandidate: (candidateId: string) => void
}

export default function CandidatesTable({ candidates, onSelectCandidate }: CandidatesTableProps) {
  const dispatch = useDispatch()
  const [sortBy, setSortByState] = useState<'score' | 'date' | 'name'>('score')
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: 'score' | 'date' | 'name') => {
    if (sortBy === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      setSortOrderState(newOrder)
      dispatch(setSortOrder(newOrder))
    } else {
      setSortByState(field)
      dispatch(setSortBy(field))
    }
  }

  const getSortIcon = (field: 'score' | 'date' | 'name') => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    return status === 'completed' 
      ? <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      : <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No candidates found</h3>
          <p className="text-muted-foreground text-center">
            {candidates.length === 0 
              ? "No candidates have been added yet. Candidates will appear here after they start their interviews."
              : "No candidates match your search criteria."
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidates</CardTitle>
        <CardDescription>
          {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-medium"
                  >
                    Name {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('score')}
                    className="h-auto p-0 font-medium"
                  >
                    Score {getSortIcon('score')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('date')}
                    className="h-auto p-0 font-medium"
                  >
                    Date {getSortIcon('date')}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {candidate.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{candidate.email}</span>
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {candidate.result ? (
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-medium ${getScoreColor(candidate.result.finalScore)}`}>
                          {candidate.result.finalScore}/100
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{format(new Date(candidate.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(candidate.status)}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectCandidate(candidate.id)}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
