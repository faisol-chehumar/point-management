'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CreditAdjustmentForm } from './CreditAdjustmentForm'
import { CreditLogDisplay } from './CreditLogDisplay'
import { Search, DollarSign, Users, TrendingUp, History } from 'lucide-react'
import { UserStatus } from '@prisma/client'

interface User {
  id: string
  email: string
  status: UserStatus
  credits: number
  role: string
  registrationDate: string
  estimatedExpiryDate: string | null
  daysSinceRegistration: number
  creditLogCount: number
}

interface UserData {
  users: User[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export default function CreditManagementDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreditForm, setShowCreditForm] = useState(false)
  const [showCreditHistory, setShowCreditHistory] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchUsers = async (search: string = '') => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        sortBy: 'credits',
        sortOrder: 'desc'
      })
      
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setUserData(result.data)
      } else {
        console.error('Failed to fetch users:', result.error)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(searchTerm)
  }, [searchTerm, refreshTrigger])

  const handleCreditSuccess = () => {
    setShowCreditForm(false)
    setSelectedUser(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'BLOCKED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate statistics
  const stats = userData ? {
    totalUsers: userData.users.length,
    totalCredits: userData.users.reduce((sum, user) => sum + user.credits, 0),
    averageCredits: userData.users.length > 0 ? Math.round(userData.users.reduce((sum, user) => sum + user.credits, 0) / userData.users.length) : 0,
    usersWithCredits: userData.users.filter(user => user.credits > 0).length
  } : null

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCredits}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Credits</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageCredits}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users with Credits</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersWithCredits}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and User Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Credit Management</CardTitle>
          <CardDescription>
            Search and manage credits for individual users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : userData && userData.users.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={user.credits === 0 ? 'text-red-600 font-semibold' : 'font-semibold'}>
                            {user.credits}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.registrationDate)}</TableCell>
                        <TableCell>
                          {user.estimatedExpiryDate ? formatDate(user.estimatedExpiryDate) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog open={showCreditForm && selectedUser?.id === user.id} onOpenChange={(open) => {
                              setShowCreditForm(open)
                              if (!open) setSelectedUser(null)
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Credits
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Adjust Credits</DialogTitle>
                                  <DialogDescription>
                                    Modify credit balance for this user
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedUser && (
                                  <CreditAdjustmentForm
                                    user={selectedUser}
                                    onSuccess={handleCreditSuccess}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>

                            <Dialog open={showCreditHistory && selectedUser?.id === user.id} onOpenChange={(open) => {
                              setShowCreditHistory(open)
                              if (!open) setSelectedUser(null)
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <History className="h-3 w-3 mr-1" />
                                  History
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Credit History</DialogTitle>
                                  <DialogDescription>
                                    View all credit transactions for this user
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedUser && (
                                  <CreditLogDisplay
                                    userId={selectedUser.id}
                                    refreshTrigger={refreshTrigger}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}