'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { CreditLogType } from '@prisma/client'

interface CreditLog {
  id: string
  amount: number
  type: CreditLogType
  reason: string | null
  createdAt: string
  adminEmail: string | null
}

interface CreditLogData {
  user: {
    id: string
    email: string
  }
  creditLogs: CreditLog[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

interface CreditLogDisplayProps {
  userId: string
  refreshTrigger?: number
}

export function CreditLogDisplay({ userId, refreshTrigger }: CreditLogDisplayProps) {
  const [data, setData] = useState<CreditLogData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchCreditLogs = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/credit-logs?page=${page}&limit=10`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setCurrentPage(page)
      } else {
        console.error('Failed to fetch credit logs:', result.error)
      }
    } catch (error) {
      console.error('Error fetching credit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCreditLogs(1)
  }, [userId, refreshTrigger])

  const handlePageChange = (page: number) => {
    fetchCreditLogs(page)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTypeColor = (type: CreditLogType) => {
    switch (type) {
      case 'ADDED':
        return 'bg-green-100 text-green-800'
      case 'DEDUCTED':
        return 'bg-red-100 text-red-800'
      case 'DAILY_DEDUCTION':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAmountDisplay = (amount: number, type: CreditLogType) => {
    const sign = amount > 0 ? '+' : ''
    const color = amount > 0 ? 'text-green-600' : 'text-red-600'
    return (
      <span className={`font-semibold ${color}`}>
        {sign}{amount}
      </span>
    )
  }

  if (isLoading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>Loading credit transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>Failed to load credit history</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>
            Transaction history for {data.user.email} ({data.pagination.totalCount} total transactions)
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchCreditLogs(currentPage)}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {data.creditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No credit transactions found
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.creditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(log.type)}>
                          {log.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getAmountDisplay(log.amount, log.type)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.reason || 'No reason provided'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.adminEmail || 'System'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {data.pagination.currentPage} of {data.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!data.pagination.hasPrevPage || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!data.pagination.hasNextPage || isLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}