'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CreditCard, AlertTriangle } from 'lucide-react'
import { UserWithStats } from '@/types/database'

interface CreditDisplayProps {
  user: UserWithStats
}

export default function CreditDisplay({ user }: CreditDisplayProps) {
  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '✓'
      case 'PENDING':
        return '⏳'
      case 'REJECTED':
        return '✗'
      case 'BLOCKED':
        return '🚫'
      default:
        return '?'
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  const getCreditStatus = () => {
    if (user.credits <= 0) {
      return {
        color: 'text-red-600',
        message: 'No credits remaining',
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />
      }
    } else if (user.credits <= 5) {
      return {
        color: 'text-yellow-600',
        message: 'Low credits',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
      }
    } else {
      return {
        color: 'text-green-600',
        message: 'Credits available',
        icon: <CreditCard className="h-5 w-5 text-green-500" />
      }
    }
  }

  const creditStatus = getCreditStatus()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Credit Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
          {creditStatus.icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{user.credits}</div>
          <p className={`text-xs ${creditStatus.color}`}>
            {creditStatus.message}
          </p>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Status</CardTitle>
          <span className="text-lg">{getStatusIcon(user.status)}</span>
        </CardHeader>
        <CardContent>
          <Badge className={getStatusColor(user.status)}>
            {user.status.toLowerCase()}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {user.status === 'PENDING' && 'Awaiting admin approval'}
            {user.status === 'APPROVED' && 'Account is active'}
            {user.status === 'REJECTED' && 'Account has been rejected'}
            {user.status === 'BLOCKED' && 'Account is blocked'}
          </p>
        </CardContent>
      </Card>

      {/* Estimated Expiry Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estimated Expiry</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {user.estimatedExpiryDate ? formatDate(user.estimatedExpiryDate) : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {user.estimatedExpiryDate 
              ? `${user.credits} days remaining`
              : 'No active subscription'
            }
          </p>
        </CardContent>
      </Card>

      {/* Registration Info Card */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registration Date</p>
              <p className="font-medium">{formatDate(user.registrationDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Since Registration</p>
              <p className="font-medium">{user.daysSinceRegistration} days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Credit Deduction</p>
              <p className="font-medium">{formatDate(user.lastCreditDeduction)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}