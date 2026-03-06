import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

type AuthMode = 'login' | 'register';

const defaultFormState = {
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
};

const getFirstString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = getFirstString(item);
      if (nested) {
        return nested;
      }
    }
  }

  if (typeof value === 'object' && value !== null) {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const nested = getFirstString(item);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const apiMessage = getFirstString(data);

    if (apiMessage) {
      const normalized = apiMessage.toLowerCase();
      if (
        status === 401 ||
        normalized.includes('no active account') ||
        normalized.includes('authentication failed')
      ) {
        return 'Unauthorized access. Please check your username and password.';
      }
      return apiMessage;
    }

    if (status === 401) {
      return 'Unauthorized access. Please check your username and password.';
    }
    if (status === 400) {
      return 'Invalid request. Please check your input and try again.';
    }
    if (status === 500) {
      return 'Server error. Please try again later.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Request failed. Please try again.';
};

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formState, setFormState] = useState(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage('');
    setSuccessMessage('');
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
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Resume Maker</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Login to access resume optimization tools
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`py-2 rounded-md text-sm font-medium ${
              mode === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`py-2 rounded-md text-sm font-medium ${
              mode === 'register'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={formState.username}
              onChange={updateField('username')}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formState.email}
                onChange={updateField('email')}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formState.password}
              onChange={updateField('password')}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={formState.passwordConfirm}
                onChange={updateField('passwordConfirm')}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {errorMessage && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
