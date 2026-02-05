'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/explore');
      router.refresh();
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    
    try {
      await signIn('google', {
        callbackUrl: '/explore',
        redirect: true,
      });
    } catch (error) {
      setError('Failed to sign in with Google');
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Brand & Features */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 text-white">
        <div className="max-w-md mx-auto space-y-8">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <BookOpen className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold">EduExplorer</h1>
            </div>
            <p className="text-xl text-blue-100">
              Your AI-Powered Learning Companion
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-white/20 backdrop-blur rounded flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-blue-100">
                <strong className="text-white">AI-Powered Research</strong> - Get comprehensive explanations on any topic
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 bg-white/20 backdrop-blur rounded flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-blue-100">
                <strong className="text-white">7 Learning Formats</strong> - Articles, audio, presentations, flashcards & more
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 bg-white/20 backdrop-blur rounded flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-blue-100">
                <strong className="text-white">Personalized Learning</strong> - Adaptive content for all learning levels
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold">1M+</div>
              <div className="text-blue-100 text-sm">Topics</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-blue-100 text-sm">Learners</div>
            </div>
            <div>
              <div className="text-3xl font-bold">4.9★</div>
              <div className="text-blue-100 text-sm">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue your learning journey</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={loading || googleLoading}
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={loading || googleLoading}
                  className="h-11"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || googleLoading} 
                className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link 
                href="/signup" 
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Sign up for free
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
