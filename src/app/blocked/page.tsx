import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ban, CreditCard, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              No Credits Remaining
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <CreditCard className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-gray-700 mb-2 font-medium">
                Your account has been blocked due to insufficient credits.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Current balance: <span className="font-semibold text-red-600">0 credits</span>
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Ban className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-yellow-800 font-medium mb-1">
                    Access Restricted
                  </p>
                  <p className="text-xs text-yellow-700">
                    All protected content and features are currently unavailable until credits are added to your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                To regain access to the platform, please contact an administrator to have credits added to your account.
              </p>
              
              <div className="pt-4 border-t border-gray-200">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/api/auth/signout">
                    Sign Out
                  </Link>
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-4">
              If you believe this is an error, please contact support immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}