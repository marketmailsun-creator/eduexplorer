'use client';
// ============================================================
// FILE: src/components/features/ChangePasswordSection.tsx  — NEW FILE
// Add to profile page for logged-in users who have a password.
// Google-only users see a message instead.
// ============================================================
import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ChangePasswordSectionProps {
  hasPassword: boolean;
}

export function ChangePasswordSection({ hasPassword }: ChangePasswordSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) { setError("New passwords don't match"); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => { setSuccess(false); setIsOpen(false); }, 3000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header — always visible, toggles form */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Lock className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">
              {hasPassword ? 'Change Password' : 'Password'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {hasPassword ? 'Update your account password' : 'Managed via Google sign-in'}
            </p>
          </div>
        </div>
        {hasPassword && (
          isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Google-only users */}
      {!hasPassword && (
        <div className="px-5 pb-4">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-700">
              Your account uses <strong>Google sign-in</strong>. Password management is handled by Google. You can set a password by using "Forgot Password" from the login page.
            </p>
          </div>
        </div>
      )}

      {/* Change password form — only for credentials users */}
      {hasPassword && isOpen && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
          {success ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Password changed!</p>
                <p className="text-xs text-green-600 mt-0.5">Your password has been updated successfully.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Current password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    disabled={loading}
                    className="w-full h-10 px-3 pr-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                    disabled={loading}
                    className="w-full h-10 px-3 pr-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm new password</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  minLength={6}
                  required
                  disabled={loading}
                  className={`w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 transition-colors ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-indigo-400'
                  }`}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 transition-all"
                >
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
