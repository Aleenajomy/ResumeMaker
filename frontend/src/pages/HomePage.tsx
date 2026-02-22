import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, LayoutDashboard, LogOut } from 'lucide-react';
import { authService } from '../services/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Resume Maker</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Welcome to Your Career Hub
            </h2>
            <p className="text-gray-600">
              Manage your profile, optimize resumes, and generate professional documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <LayoutDashboard size={32} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">Dashboard</h3>
              </div>
              <p className="text-gray-600">
                Manage your profile, resumes, and personal details
              </p>
            </button>

            <button
              onClick={() => navigate('/resume-optimizer')}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-100 p-4 rounded-lg">
                  <FileText size={32} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">Resume Optimizer</h3>
              </div>
              <p className="text-gray-600">
                Optimize your resume for specific job descriptions
              </p>
            </button>

            <button
              onClick={() => navigate('/cover-letter')}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-100 p-4 rounded-lg">
                  <FileText size={32} className="text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">Cover Letter</h3>
              </div>
              <p className="text-gray-600">
                Generate professional cover letters for job applications
              </p>
            </button>

            <button
              onClick={() => navigate('/email-template')}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-orange-100 p-4 rounded-lg">
                  <Mail size={32} className="text-orange-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">Email Templates</h3>
              </div>
              <p className="text-gray-600">
                Create professional email templates for networking
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
