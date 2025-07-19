import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle } from 'lucide-react'

export default function RejectedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Account Rejected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Unfortunately, your account application has been rejected by our administrators.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              If you believe this is an error or would like to appeal this decision, 
              please contact our support team.
            </p>
            <p className="text-xs text-gray-400">
              You will not be able to access the platform with this account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}