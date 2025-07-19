'use client'

import { useState } from 'react'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { LoginForm } from '@/components/auth/LoginForm'
import { Button } from '@/components/ui/button'

export default function TestFormsPage() {
  const [activeForm, setActiveForm] = useState<'register' | 'login'>('register')

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Form Testing Page
          </h1>
          <p className="text-gray-600">
            Test the registration and login forms
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button 
            variant={activeForm === 'register' ? 'default' : 'outline'}
            onClick={() => setActiveForm('register')}
          >
            Registration Form
          </Button>
          <Button 
            variant={activeForm === 'login' ? 'default' : 'outline'}
            onClick={() => setActiveForm('login')}
          >
            Login Form
          </Button>
        </div>

        <div className="max-w-md mx-auto">
          {activeForm === 'register' ? (
            <RegisterForm 
              onSuccess={() => {
                console.log('Registration successful!')
                setActiveForm('login')
              }}
            />
          ) : (
            <LoginForm 
              onSuccess={() => {
                console.log('Login successful!')
              }}
            />
          )}
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Form Features Implemented:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Registration form with email and password validation</li>
            <li>✅ Password confirmation matching</li>
            <li>✅ Login form with email and password</li>
            <li>✅ Form validation using Zod schemas</li>
            <li>✅ React Hook Form integration</li>
            <li>✅ Loading states with spinner</li>
            <li>✅ Toast notifications for success/error feedback</li>
            <li>✅ Error handling and display</li>
            <li>✅ Responsive design with Shadcn/ui components</li>
          </ul>
        </div>
      </div>
    </div>
  )
}