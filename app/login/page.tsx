'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Lock, User } from 'lucide-react'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Redirect if already authenticated - with immediate hard redirect
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('User is authenticated, redirecting...')
      // Use hard redirect instead of router.push
      window.location.href = '/chat'
    }
  }, [status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false
      })

      console.log('SignIn result:', result)

      if (result?.error) {
        setError('Invalid credentials')
      } else if (result?.ok) {
        // Don't rely on router.push, use hard redirect immediately
        console.log('Login successful, redirecting...')
        window.location.href = '/chat'
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking authentication status
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Don't show anything if authenticated (redirect will happen)
  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
