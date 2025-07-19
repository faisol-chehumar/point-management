'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import UserStatusBadge from './UserStatusBadge'
import UserApprovalDialog from './UserApprovalDialog'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface User {
  id: string
  email: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED'
  credits: number
  role: 'USER' | 'ADMIN'
  registrationDate: string
  lastCreditDeduction: string | null
  daysSinceRegistration: number
  estimatedExpiryDate: string | null
  creditLogCount: number
}

interface UserManagementTableProps {}

export default function UserManagementTable({}: UserManagementTableProps = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Approval dialog state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [approvalDialog, setApprovalDialog] = useState<{
    isOpen: boolean
    action: 'approve' | 'reject' | 'block'
    users: User[]
  }>({
    isOpen: false,
    action: 'approve',
    users: []
  })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      if (data.success) {
        setUsers(data.data.users)
        setTotalPages(data.data.pagination.totalPages)
        setTotalCount(data.data.pagination.totalCount)
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, statusFilter, searchTerm, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const openApprovalDialog = (action: 'approve' | 'reject' | 'block', userIds?: string[]) => {
    const targetUserIds = userIds || selectedUsers
    const targetUsers = users.filter(user => targetUserIds.includes(user.id))
    
    setApprovalDialog({
      isOpen: true,
      action,
      users: targetUsers
    })
  }

  const closeApprovalDialog = () => {
    setApprovalDialog({
      isOpen: false,
      action: 'approve',
      users: []
    })
  }

  const handleApprovalConfirm = async (userIds: string[], status: string) => {
    setActionLoading(true)
    try {
      let response
      
      if (userIds.length === 1) {
        // Single user update
        response = await fetch(`/api/admin/users/${userIds[0]}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        })
      } else {
        // Batch update
        response = await fetch('/api/admin/users/batch-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds, status }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user status')
      }

      if (data.success) {
        toast.success(data.message || 'User status updated successfully')
        
        // Refresh the users list
        await fetchUsers()
        
        // Clear selections
        setSelectedUsers([])
      } else {
        throw new Error(data.error || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user status')
    } finally {
      setActionLoading(false)
    }
  }

function UserTableSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <Skeleton className="h-6 w-1/4" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><Skeleton className="h-5 w-5" /></TableHead>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ... (UserManagementTable component)

  if (loading && users.length === 0) {
    return <UserTableSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchUsers}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {/* Summary Stats and Batch Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total: {totalCount} users</span>
              <span>•</span>
              <span>Page {currentPage} of {totalPages}</span>
              {selectedUsers.length > 0 && (
                <>
                  <span>•</span>
                  <span>{selectedUsers.length} selected</span>
                </>
              )}
            </div>
            
            {selectedUsers.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => openApprovalDialog('approve')}
                  disabled={actionLoading}
                >
                  Approve ({selectedUsers.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openApprovalDialog('reject')}
                  disabled={actionLoading}
                >
                  Reject ({selectedUsers.length})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openApprovalDialog('block')}
                  disabled={actionLoading}
                >
                  Block ({selectedUsers.length})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('email')}
                >
                  Email {getSortIcon('email')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('credits')}
                >
                  Credits {getSortIcon('credits')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('registrationDate')}
                >
                  Registered {getSortIcon('registrationDate')}
                </TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.role === 'ADMIN' && (
                          <Badge variant="outline" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{user.credits}</div>
                    {user.creditLogCount > 0 && (
                      <div className="text-xs text-gray-500">
                        {user.creditLogCount} transactions
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(user.registrationDate)}</div>
                    <div className="text-xs text-gray-500">
                      {user.daysSinceRegistration} days ago
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.estimatedExpiryDate ? (
                      <div>
                        <div className="text-sm">{formatDate(user.estimatedExpiryDate)}</div>
                        <div className="text-xs text-gray-500">
                          {Math.ceil((new Date(user.estimatedExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-500">
                      Last deduction: {formatDateTime(user.lastCreditDeduction)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.status === 'PENDING' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openApprovalDialog('approve', [user.id])}
                            disabled={actionLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openApprovalDialog('reject', [user.id])}
                            disabled={actionLoading}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {user.status === 'APPROVED' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openApprovalDialog('block', [user.id])}
                          disabled={actionLoading}
                        >
                          Block
                        </Button>
                      )}
                      {(user.status === 'REJECTED' || user.status === 'BLOCKED') && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openApprovalDialog('approve', [user.id])}
                          disabled={actionLoading}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No users have registered yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Approval Dialog */}
      <UserApprovalDialog
        isOpen={approvalDialog.isOpen}
        onClose={closeApprovalDialog}
        users={approvalDialog.users}
        action={approvalDialog.action}
        onConfirm={handleApprovalConfirm}
        isLoading={actionLoading}
      />
    </div>
  )
}