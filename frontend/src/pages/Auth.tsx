import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { LandingParticles } from '../components/LandingParticles';
import { authService } from '../services/api';
import { extractApiErrorMessage } from '../utils/apiError';

type AuthMode = 'login' | 'register';

const defaultFormState = {
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
};

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formState, setFormState] = useState(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage('');
    setSuccessMessage('');
    setShowPassword(false);
    setShowPasswordConfirm(false);
  };

  const updateField =
    (field: keyof typeof defaultFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleLogin = async () => {
    const username = formState.username.trim();
    const password = formState.password;

    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    await authService.login(username, password);
    setSuccessMessage('Login successful. Redirecting...');
    await new Promise((resolve) => setTimeout(resolve, 500));
    navigate('/resume-optimizer', { replace: true });
  };

  const handleRegister = async () => {
    await authService.register(
      formState.username.trim(),
      formState.email.trim(),
      formState.password,
      formState.passwordConfirm
    );

    setSuccessMessage('Registration successful. Please login.');
    setMode('login');
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setFormState((prev) => ({
      ...prev,
      password: '',
      passwordConfirm: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (mode === 'login') {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (error) {
      setErrorMessage(
        extractApiErrorMessage(error, {
          statusMessages: {
            400: 'Invalid request. Please check your input and try again.',
            500: 'Server error. Please try again later.',
          },
          unauthorizedMessage: 'Unauthorized access. Please check your username and password.',
          unauthorizedMatchers: ['no active account', 'authentication failed'],
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

      {/* Logo in top left */}
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
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Login to access resume optimization tools
          </p>

          <div className="mb-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'login'
                 ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                 :  'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="auth-username" className="mb-1 block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="auth-username"
                name="username"
                type="text"
                value={formState.username}
                onChange={updateField('username')}
                autoComplete="username"
                required
                className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={updateField('email')}
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formState.password}
                  onChange={updateField('password')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-10 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="-mt-1 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-password-confirm"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password-confirm"
                    name="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={formState.passwordConfirm}
                    onChange={updateField('passwordConfirm')}
                    autoComplete="new-password"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-10 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    aria-label={showPasswordConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showPasswordConfirm}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                  >
                    {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

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
              className="w-full rounded-lg bg-emerald-600 py-3 text-white font-medium transition-colors hover:bg-emerald-700 disabled:bg-gray-400"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};