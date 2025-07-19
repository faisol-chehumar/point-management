'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  email: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED'
  credits: number
}

interface UserApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  users: User[]
  action: 'approve' | 'reject' | 'block'
  onConfirm: (userIds: string[], status: string) => Promise<void>
  isLoading?: boolean
}

export default function UserApprovalDialog({
  isOpen,
  onClose,
  users,
  action,
  onConfirm,
  isLoading = false
}: UserApprovalDialogProps) {
  const [confirming, setConfirming] = useState(false)

  const getActionDetails = () => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Users',
          description: 'Are you sure you want to approve the selected user(s)? They will be able to access the platform.',
          status: 'APPROVED',
          buttonText: 'Approve',
          buttonVariant: 'default' as const
        }
      case 'reject':
        return {
          title: 'Reject Users',
          description: 'Are you sure you want to reject the selected user(s)? They will not be able to access the platform.',
          status: 'REJECTED',
          buttonText: 'Reject',
          buttonVariant: 'destructive' as const
        }
      case 'block':
        return {
          title: 'Block Users',
          description: 'Are you sure you want to block the selected user(s)? They will lose access to the platform.',
          status: 'BLOCKED',
          buttonText: 'Block',
          buttonVariant: 'destructive' as const
        }
      default:
        return {
          title: 'Update Users',
          description: 'Are you sure you want to update the selected user(s)?',
          status: 'PENDING',
          buttonText: 'Update',
          buttonVariant: 'default' as const
        }
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const userIds = users.map(user => user.id)
      const { status } = getActionDetails()
      await onConfirm(userIds, status)
      onClose()
    } catch (error) {
      console.error('Error confirming action:', error)
    } finally {
      setConfirming(false)
    }
  }

  const actionDetails = getActionDetails()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{actionDetails.title}</DialogTitle>
          <DialogDescription>
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">
              {users.length === 1 ? 'User to update:' : `${users.length} users to update:`}
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="text-sm font-medium">{user.email}</div>
                    <div className="text-xs text-gray-500">
                      Current status: <Badge variant="outline" className="text-xs">{user.status}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.credits} credits
                  </div>
                </div>
              ))}
            </div>
          </div>

          {action === 'approve' && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Approved users will be able to access the platform. 
                Make sure to assign credits if needed.
              </p>
            </div>
          )}

          {(action === 'reject' || action === 'block') && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action will prevent users from accessing the platform. 
                This action can be reversed later if needed.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={confirming || isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={actionDetails.buttonVariant}
            onClick={handleConfirm}
            disabled={confirming || isLoading}
          >
            {confirming || isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              actionDetails.buttonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}