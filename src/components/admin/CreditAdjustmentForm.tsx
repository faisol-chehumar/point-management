'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { User } from '@prisma/client'

const creditAdjustmentSchema = z.object({
  amount: z.number().int().min(-1000, 'Cannot deduct more than 1000 credits').max(1000, 'Cannot add more than 1000 credits'),
  reason: z.string().min(1, 'Reason is required').max(255, 'Reason must be less than 255 characters')
})

type CreditAdjustmentForm = z.infer<typeof creditAdjustmentSchema>

interface CreditAdjustmentFormProps {
  user: Pick<User, 'id' | 'email' | 'credits'>
  onSuccess?: () => void
}

export function CreditAdjustmentForm({ user, onSuccess }: CreditAdjustmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<CreditAdjustmentForm>({
    resolver: zodResolver(creditAdjustmentSchema),
    defaultValues: {
      amount: 0,
      reason: ''
    }
  })

  const amount = watch('amount')

  const onSubmit = async (data: CreditAdjustmentForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}/credits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || 'Credits updated successfully')
        reset()
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to update credits')
      }
    } catch (error) {
      console.error('Credit adjustment error:', error)
      toast.error('An error occurred while updating credits')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAdjustment = (quickAmount: number) => {
    setValue('amount', quickAmount)
    setValue('reason', quickAmount > 0 ? `Added ${quickAmount} credits` : `Deducted ${Math.abs(quickAmount)} credits`)
  }

  const newBalance = Math.max(0, user.credits + amount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Management</CardTitle>
        <CardDescription>
          Adjust credits for {user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">Current Balance</Label>
            <div className="font-semibold">{user.credits} credits</div>
          </div>
          <div>
            <Label className="text-muted-foreground">New Balance</Label>
            <div className={`font-semibold ${newBalance === 0 ? 'text-red-600' : 'text-green-600'}`}>
              {newBalance} credits
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Credit Adjustment</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter positive number to add, negative to deduct"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quick Actions</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjustment(10)}
              >
                +10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjustment(30)}
              >
                +30
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjustment(100)}
              >
                +100
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjustment(-10)}
              >
                -10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdjustment(-30)}
              >
                -30
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="Enter reason for credit adjustment"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          {newBalance === 0 && amount < 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ This adjustment will set the user's credits to 0 and block their access.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || amount === 0}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Credits'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}