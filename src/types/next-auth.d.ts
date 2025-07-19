import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: string
      status: string
      credits: number
    }
  }

  interface User {
    id: string
    email: string
    role: string
    status: string
    credits: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    status: string
    credits: number
  }
}