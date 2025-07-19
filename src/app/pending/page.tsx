import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Account Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Your account is currently pending approval from our administrators. 
              You will receive an email notification once your account has been reviewed.
            </p>
            <p className="text-sm text-gray-500">
              This process typically takes 1-2 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}