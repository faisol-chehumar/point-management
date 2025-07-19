import { User, CreditLog, UserStatus, UserRole, CreditLogType } from '@prisma/client'

// Re-export Prisma types for easier imports
export type {
  User,
  CreditLog,
  UserStatus,
  UserRole,
  CreditLogType,
}

// Extended types for API responses
export interface UserWithStats extends Omit<User, 'password'> {
  estimatedExpiryDate: Date | null
  daysSinceRegistration: number
  _count?: {
    creditLogs: number
  }
}

export interface CreditLogWithUser extends CreditLog {
  user: Pick<User, 'id' | 'email'>
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DatabaseStats {
  totalUsers: number
  totalCreditLogs: number
  usersByStatus: Record<UserStatus, number>
}

// Form types
export interface CreateUserData {
  email: string
  password: string
  role?: UserRole
  credits?: number
}

export interface UpdateUserData {
  status?: UserStatus
  credits?: number
  role?: UserRole
}

export interface CreateCreditLogData {
  userId: string
  amount: number
  type: CreditLogType
  reason?: string
  adminId?: string
}