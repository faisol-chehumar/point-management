'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn, getSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { Loader2 } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void
  callbackUrl?: string
}

export function LoginForm({ onSuccess, callbackUrl = '/dashboard' }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        // Handle specific error messages
        let errorMessage = 'Login failed'
        let errorDescription = result.error

        if (result.error.includes('rejected')) {
          errorMessage = 'Account Rejected'
          errorDescription = 'Your account has been rejected by an administrator.'
        } else if (result.error.includes('Invalid')) {
          errorMessage = 'Invalid Credentials'
          errorDescription = 'Please check your email and password.'
        }

        toast.error(errorMessage, {
          description: errorDescription
        })
      } else if (result?.ok) {
        toast.success('Login successful!', {
          description: 'Welcome back to your dashboard.'
        })
        
        // Call success callback or redirect based on user role
        if (onSuccess) {
          onSuccess()
        } else {
          // Get the updated session to check user role
          const session = await getSession()
          
          // Redirect based on user role
          if (session?.user?.role === 'ADMIN') {
            router.push('/admin')
          } else {
            router.push(callbackUrl)
          }
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed', {
        description: 'Network error. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}