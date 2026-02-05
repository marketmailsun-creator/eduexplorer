'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, X, Zap, Crown, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

type PlanType = 'free' | 'pro';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    
    try {
      // Store selected plan in localStorage to apply after OAuth
      localStorage.setItem('selectedPlan', selectedPlan);
      
      await signIn('google', {
        callbackUrl: '/explore',
        redirect: true,
      });
    } catch (error) {
      setError('Failed to sign in with Google');
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name,
          dob,
          plan: selectedPlan
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      // Auto sign in after signup
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Account created, but sign in failed. Please try logging in.');
      } else {
        router.push('/explore');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
              Start Learning Smarter Today
            </p>
          </div>

          {/* Why Join */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Why Join EduExplorer?</h2>
            
            <div className="space-y-3">
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
                  <strong className="text-white">Multiple Learning Formats</strong> - Articles, audio, presentations, flashcards, quizzes & more
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 bg-white/20 backdrop-blur rounded flex-shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-blue-100">
                  <strong className="text-white">Learn Your Way</strong> - Adaptive content for all learning levels
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 bg-white/20 backdrop-blur rounded flex-shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-blue-100">
                  <strong className="text-white">No Credit Card Required</strong> - Start free, upgrade anytime
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          {/* <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
            <p className="text-sm italic mb-3">
              "EduExplorer transformed how I learn. The AI-generated content is accurate, engaging, and perfectly tailored to my level."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                SK
              </div>
              <div className="text-sm">
                <div className="font-semibold">Sarah Kim</div>
                <div className="text-blue-100">Graduate Student</div>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-2xl py-6">
          {/* Plan Selection */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-center mb-4">Choose Your Plan</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Free Plan */}
              <button
                type="button"
                onClick={() => setSelectedPlan('free')}
                disabled={loading || googleLoading}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  selectedPlan === 'free'
                    ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                {selectedPlan === 'free' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                    SELECTED
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold">Free</h3>
                  </div>
                  <div className="text-2xl font-bold">₹0</div>
                </div>

                <ul className="space-y-2 text-sm text-left">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Unlimited topic searches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Full article generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>1 audio</strong> narration per topic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>1 presentation</strong> per topic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>1 flashcard set</strong> per topic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>1 quiz</strong> per topic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Diagrams & concept maps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500">On-demand audio generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500">Multiple audio versions</span>
                  </li>
                </ul>
              </button>

              {/* Pro Plan */}
              <button
                type="button"
                onClick={() => setSelectedPlan('pro')}
                disabled={loading || googleLoading}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  selectedPlan === 'pro'
                    ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </div>

                {selectedPlan === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                    SELECTED
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-6 w-6 text-purple-600" />
                    <h3 className="text-xl font-bold">Pro</h3>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">₹500</div>
                    <div className="text-xs text-gray-600">/month</div>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-left">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Everything in Free</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>5 audio</strong> narrations per topic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>5 flashcard sets</strong> per topic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Unlimited quizzes</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>On-demand</strong> audio generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Advanced concept maps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Download all content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>No ads</span>
                  </li>
                </ul>
              </button>
            </div>
          </div>

          {/* Signup Card */}
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>
                {selectedPlan === 'free' 
                  ? 'Start learning for free - no credit card required'
                  : 'Start your 7-day free trial - cancel anytime'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Google Sign Up Button */}
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
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or sign up with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    disabled={loading || googleLoading}
                    className="h-11"
                  />
                </div>

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
                    minLength={6}
                    required
                    disabled={loading || googleLoading}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <Input
                    name="dob"
                    type="date"
                    required
                    disabled={loading || googleLoading}
                    className="h-11"
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">You must be 13 or older to use EduExplorer</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading || googleLoading} 
                  className={`w-full h-11 text-base ${
                    selectedPlan === 'pro'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      {selectedPlan === 'pro' ? (
                        <>
                          <Crown className="mr-2 h-5 w-5" />
                          Start Free Trial
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
                          Create Free Account
                        </>
                      )}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-600">
                  By signing up, you agree to our Terms & Privacy Policy
                </p>
              </form>

              {/* Sign In Link */}
              <div className="text-center text-sm pt-2">
                <span className="text-gray-600">Already have an account? </span>
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
