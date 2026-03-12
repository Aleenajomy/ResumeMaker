import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
        backgroundImage:
          'radial-gradient(circle at 18% 18%, rgba(214, 236, 205, 0.14), transparent 24%), radial-gradient(circle at 82% 14%, rgba(207,215,222,0.18), transparent 26%), linear-gradient(135deg,#b8cab4 0%,#695aac 48%,#b8cab4 100%)',
      }}
    >
      <LandingParticles />
      <div className="absolute inset-0 bg-white/4" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/78 p-8 shadow-[0_24px_70px_rgba(24,28,42,0.22)] backdrop-blur-x">
          <h1 className="mb-2 text-center text-3xl font-bold text-white/80">Resume Maker</h1>
          <p className="mb-6 text-center text-sm text-white/70">
            Login to access resume optimization tools
          </p>

          <div className="mb-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'login'
                 ? 'bg-[#583bac] text-white hover:bg-[#462f8a]'
                 :  'bg-white/72 text-[#ede8e6]/70 hover:bg-[#b9c9b7]'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-[#583bac] text-white hover:bg-[#462f8a]'
                  : 'bg-white/72 text-[#ede8e6]/70 hover:bg-[#b9c9b7]'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="auth-username" className="mb-1 block text-sm font-medium text-white/60">
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
                className="w-full rounded-lg border border-gray-300 bg-white/92 p-3 outline-none focus:border-[#7b869b] focus:ring-2 focus:ring-[#7b869b]"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-white/60">
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
                  className="w-full rounded-lg border border-gray-300 bg-white/92 p-3 outline-none focus:border-[#7b869b] focus:ring-2 focus:ring-[#7b869b]"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-white/60">
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
                  className="w-full rounded-lg border border-gray-300 bg-white/92 p-3 pr-10 outline-none focus:border-[#7b869b] focus:ring-2 focus:ring-[#7b869b]"
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
                  className="text-sm text-white/60 hover:text-[#c2e4a2] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-password-confirm"
                  className="mb-1 block text-sm font-medium text-white/60"
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
                    className="w-full rounded-lg border border-gray-300 bg-white/92 p-3 pr-10 outline-none focus:border-[#7b869b] focus:ring-2 focus:ring-[#7b869b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    aria-label={showPasswordConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showPasswordConfirm}
                    className="absolute inset-y-0 right-0 px-3 text-white/60 hover:text-gray-700 focus:outline-none focus:text-gray-700"
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
              className="w-full rounded-lg bg-[#520780] py-3 text-white transition-colors hover:bg-[#420667] disabled:bg-gray-400"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};