import { Badge } from '@/components/ui/badge'

interface UserStatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED'
  className?: string
}

export default function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'Pending'
        }
      case 'APPROVED':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          label: 'Approved'
        }
      case 'REJECTED':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          label: 'Rejected'
        }
      case 'BLOCKED':
        return {
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-300',
          label: 'Blocked'
        }
      default:
        return {
          variant: 'outline' as const,
          className: '',
          label: status
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  )
}