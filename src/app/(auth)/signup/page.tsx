'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ageError, setAgeError] = useState('');

  // Calculate minimum date (13 years ago)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];
  
  // Calculate maximum date (120 years ago - reasonable limit)
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];

  const validateAge = (dateOfBirth: string): boolean => {
    const dob = new Date(dateOfBirth);
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
      ? age - 1
      : age;

    if (adjustedAge < 13) {
      setAgeError('You must be at least 13 years old to use this service');
      return false;
    }

    if (adjustedAge > 120) {
      setAgeError('Please enter a valid date of birth');
      return false;
    }

    setAgeError('');
    return true;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAgeError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;

    // Validate age
    if (!validateAge(dateOfBirth)) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, dateOfBirth }),
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Card className="w-full max-w-md shadow-xl border-gray-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join EduExplorer to start learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                name="name"
                type="text"
                placeholder="John Doe"
                required
                disabled={loading}
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
                disabled={loading}
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Date of Birth
                <span className="text-xs text-gray-500 ml-2">(Must be 13+)</span>
              </label>
              <Input
                name="dateOfBirth"
                type="date"
                max={maxDate}
                min={minDate}
                required
                disabled={loading}
                onChange={(e) => validateAge(e.target.value)}
                className="h-11"
              />
              {ageError && (
                <div className="flex items-start gap-2 mt-2 text-xs text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{ageError}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Required for age-appropriate content filtering
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                minLength={6}
                required
                disabled={loading}
                className="h-11"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading || !!ageError} 
              className="w-full h-11 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
