import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { loginLimiter } from './rate-limiter';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const remainingRequests = await loginLimiter.removeTokens(1);
        if (remainingRequests < 0) {
          throw new Error('Too many requests');
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        console.log('isPasswordValid', isPasswordValid);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Check if user is rejected
        if (user.status === 'REJECTED') {
          throw new Error('Your account has been rejected');
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          credits: user.credits
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.status = user.status
        token.credits = user.credits
      }
      
      // Refresh user data on each request to keep session up to date
      if (trigger === 'update' || !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: {
            role: true,
            status: true,
            credits: true
          }
        })
        
        if (dbUser) {
          token.role = dbUser.role
          token.status = dbUser.status
          token.credits = dbUser.credits
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.status = token.status as string
        session.user.credits = token.credits as number
      }
      return session
    },
    async signIn({ user }) {
      // Allow sign in for all users except rejected ones (handled in authorize)
      return true
    },
    async redirect({ url, baseUrl }) {
      // For regular redirects, use default behavior or redirect to dashboard
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  events: {
    async signIn({ user }) {
      console.log(`User ${user.email} signed in`)
    },
    async signOut({ token }) {
      console.log(`User ${token?.email} signed out`)
    }
  }
}