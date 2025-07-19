import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import CreditManagementDashboard from '@/components/admin/CreditManagementDashboard'

export default async function AdminCreditsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Credit Management
          </h2>
          <p className="text-gray-600">
            Manage user credits, view credit history, and handle credit adjustments.
          </p>
        </div>

        <CreditManagementDashboard />
      </div>
    </AdminLayout>
  )
}