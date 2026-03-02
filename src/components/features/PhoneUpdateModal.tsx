'use client';

import { useState, useEffect } from 'react';
import { Phone, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PhoneUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'enter_phone' | 'enter_otp' | 'success';

export function PhoneUpdateModal({ isOpen, onClose }: PhoneUpdateModalProps) {
  const [step, setStep] = useState<Step>('enter_phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('enter_phone');
      setPhoneInput('');
      setOtpInput('');
      setPhoneError('');
      setOtpError('');
      setResendCountdown(0);
    }
  }, [isOpen]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Auto-close after success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  const handleSendOtp = async () => {
    setPhoneError('');
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${digits}`, channel: 'sms' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error || 'Failed to send OTP');
        return;
      }
      setStep('enter_otp');
      setResendCountdown(60);
    } catch {
      setPhoneError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setOtpError('');
    if (otpInput.length !== 6) {
      setOtpError('Enter the 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/user/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phoneInput.replace(/\D/g, '')}`, code: otpInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Verification failed');
        return;
      }
      setStep('success');
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setOtpError('');
    setOtpInput('');
    await handleSendOtp();
  };

  const handleSkip = () => {
    sessionStorage.setItem('phone_prompt_dismissed', '1');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-0 sm:mx-4 p-6 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {step === 'success' ? (
          /* Success state */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Phone Verified!</h2>
            <p className="text-gray-500 text-sm">Your phone number has been added to your account.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Your Phone Number</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  For faster login and account recovery. You can skip for now.
                </p>
              </div>
            </div>

            {step === 'enter_phone' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 whitespace-nowrap">
                      🇮🇳 +91
                    </span>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit number"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1"
                      maxLength={10}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                  )}
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={sending || phoneInput.replace(/\D/g, '').length !== 10}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending OTP...</>
                  ) : (
                    'Send OTP'
                  )}
                </Button>

                <button
                  onClick={handleSkip}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
                >
                  Skip for now
                </button>
              </div>
            )}

            {step === 'enter_otp' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  OTP sent to <strong>+91 {phoneInput}</strong>
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Enter 6-digit OTP
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-xl tracking-widest font-mono"
                    maxLength={6}
                  />
                  {otpError && (
                    <p className="text-xs text-red-500 mt-1">{otpError}</p>
                  )}
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={verifying || otpInput.length !== 6}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {verifying ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</>
                  ) : (
                    'Verify Phone'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => { setStep('enter_phone'); setOtpInput(''); setOtpError(''); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ← Change number
                  </button>
                  {resendCountdown > 0 ? (
                    <span className="text-gray-400">Resend in {resendCountdown}s</span>
                  ) : (
                    <button onClick={handleResend} className="text-indigo-600 hover:text-indigo-700 font-medium">
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
