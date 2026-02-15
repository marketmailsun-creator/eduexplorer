'use client';
// ============================================================
// FILE: src/components/features/DeleteAccountSection.tsx  — NEW FILE
// Danger zone section for the profile page.
// - Shows a "Delete Account" button
// - Opens a confirmation dialog
// - For credentials users: requires password + typing "DELETE"
// - For OAuth users: just requires typing "DELETE"
// - On success: signs out and redirects to /login
// ============================================================

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Trash2, AlertTriangle, Eye, EyeOff, X } from 'lucide-react';

interface DeleteAccountSectionProps {
  hasPassword: boolean; // true for credentials users, false for Google-only
}

export function DeleteAccountSection({ hasPassword }: DeleteAccountSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfirmed = confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmText,
          ...(hasPassword && password ? { password } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete account');
        setLoading(false);
        return;
      }

      // Sign out and redirect to login
      await signOut({ callbackUrl: '/login?deleted=true' });
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setShowDialog(false);
    setConfirmText('');
    setPassword('');
    setError('');
  };

  return (
    <>
      {/* Danger Zone Card */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-red-50 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <span className="font-bold text-gray-900">Danger Zone</span>
        </div>

        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Delete Account</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Permanently delete your account and all learning data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDialog(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50
                         text-red-700 text-sm font-semibold border border-red-200
                         hover:bg-red-100 hover:border-red-300 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">

            {/* Close button */}
            <button
              onClick={handleClose}
              disabled={loading}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                         rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete your account?</h2>
                <p className="text-xs text-gray-500">This action is permanent and irreversible</p>
              </div>
            </div>

            {/* What gets deleted */}
            <div className="bg-red-50 rounded-xl p-4 mb-5 border border-red-100">
              <p className="text-xs font-semibold text-red-700 mb-2">The following will be permanently deleted:</p>
              <ul className="text-xs text-red-600 space-y-1">
                <li>• All your learning history and topics</li>
                <li>• Saved content and library</li>
                <li>• Quiz scores and streaks</li>
                <li>• Study groups you created</li>
                <li>• Your profile and preferences</li>
              </ul>
            </div>

            {/* Password field (credentials users only) */}
            {hasPassword && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm your password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200
                               text-sm focus:outline-none focus:ring-2 focus:ring-red-300
                               focus:border-red-400 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Type DELETE to confirm */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                disabled={loading}
                className={`w-full h-11 px-3 rounded-xl border text-sm font-mono
                            focus:outline-none focus:ring-2 transition-colors disabled:opacity-50
                            ${isConfirmed
                              ? 'border-red-400 focus:ring-red-200 bg-red-50'
                              : 'border-gray-200 focus:ring-gray-200'
                            }`}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700
                           text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!isConfirmed || loading || (hasPassword && !password)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold
                           hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
