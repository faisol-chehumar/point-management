import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SaaS Member System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            A complete member management system with user registration, 
            admin approval workflows, and credit-based access control.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/auth/signin">
              Sign In
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/register">
              Register
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}