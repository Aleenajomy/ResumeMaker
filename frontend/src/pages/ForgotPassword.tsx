import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LandingParticles } from '../components/LandingParticles';
import { authService } from '../services/api';
import { extractApiErrorMessage } from '../utils/apiError';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authService.requestPasswordReset(email.trim());
      const uid = response?.uid;
      const token = response?.token;

      if (!uid || !token) {
        throw new Error('Unable to continue password reset. Please try again.');
      }

      setSuccessMessage(response?.message || 'Email verified. Redirecting to password reset...');
      setEmail('');
      setTimeout(() => {
        const nextUrl = `/reset-password?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`;
        navigate(nextUrl);
      }, 350);
    } catch (error) {
      setErrorMessage(
        extractApiErrorMessage(error, {
          statusMessages: {
            400: 'Please provide a valid email address.',
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
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Forgot Password</h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Enter your email to verify your account and continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label
                htmlFor="forgot-password-email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="forgot-password-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
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
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-400"
            >
              {loading ? 'Please wait...' : 'Verify Email'}
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
