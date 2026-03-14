import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LandingParticles } from '../components/LandingParticles';
import { authService } from '../services/api';
import { extractApiErrorMessage } from '../utils/apiError';

export const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const uid = params.get('uid') || '';
  const token = params.get('token') || '';
  const hasResetParams = Boolean(uid && token);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!hasResetParams) {
        throw new Error('Invalid reset link. Please request a new password reset email.');
      }

      const response = await authService.resetPassword(uid, token, newPassword, confirmPassword);
      setSuccessMessage(response?.message || 'Password reset successful. Redirecting to login...');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login', { replace: true }), 1000);
    } catch (error) {
      setErrorMessage(
        extractApiErrorMessage(error, {
          statusMessages: {
            400: 'Invalid or expired reset link. Please request a new one.',
            500: 'Server error. Please try again later.',
          },
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #fef5f7 0%, #e8f5f0 25%, #f0f9f5 50%, #fef0f5 75%, #e8f5f0 100%)',
      }}
    >
      <LandingParticles />

      <div className="absolute top-6 left-8 z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 font-['Manrope'] text-4xl font-bold tracking-tight text-[#059669]"
        >
          <Sparkles size={30} strokeWidth={2.2} className="text-[#059669]" />
          <span>Resume Maker</span>
        </button>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,185,129,0.15)] backdrop-blur-sm">
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Reset Password</h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Set a new password for your account.
          </p>

          {!hasResetParams && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50/95 p-3 text-sm text-red-700">
              This reset link is invalid. Please request a new password reset email.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label
                htmlFor="reset-password-new"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="reset-password-new"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-10 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showNewPassword}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-password-confirm"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reset-password-confirm"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-10 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirmPassword}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50/95 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md border border-green-200 bg-green-50/95 p-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !hasResetParams}
              className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-400"
            >
              {loading ? 'Please wait...' : 'Reset Password'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-600">
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
