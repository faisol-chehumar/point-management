import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AdminLayout from '@/components/admin/AdminLayout'
import UserManagementTable from '@/components/admin/UserManagementTable'

export default async function AdminUsersPage() {
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
            User Management
          </h2>
          <p className="text-gray-600">
            Manage user accounts, approve registrations, and update user status.
          </p>
        </div>

        <UserManagementTable />
      </div>
    </AdminLayout>
  )
}