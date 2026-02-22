import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { ATSScore } from '../components/ATSScore';
import {
  authService,
  coverLetterService,
  jobDescriptionService,
  optimizedResumeService,
  resumeService,
} from '../services/api';
import { OptimizedResume } from '../types';
import { Download, FileText } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [jdId, setJdId] = useState<number | null>(null);
  const [jdText, setJdText] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  const handleResumeUpload = async (file: File) => {
    setLoading(true);
    try {
      const response = await resumeService.upload(file);
      setResumeId(response.data.id);
      setStep(2);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error uploading resume. Please try again.';
      alert(errorMessage);
      console.error('Resume upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJDSubmit = async () => {
    if (!jdText || !jdTitle) {
      alert('Please provide job title and description');
      return;
    }
    
    setLoading(true);
    try {
      const response = await jobDescriptionService.create(jdTitle, jdText);
      setJdId(response.data.id);
      setStep(3);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error processing job description. Please try again.';
      alert(errorMessage);
      console.error('Job description error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!resumeId || !jdId) return;
    
    setLoading(true);
    try {
      const response = await optimizedResumeService.create(resumeId, jdId);
      setOptimizedResume(response.data);
      setStep(4);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error optimizing resume. Please try again.';
      alert(errorMessage);
      console.error('Optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!optimizedResume) return;
    
    setLoading(true);
    try {
      const response = await coverLetterService.create(optimizedResume.id);
      window.open(`${backendUrl}${response.data.pdf_file}`, '_blank');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error generating cover letter. Please try again.';
      alert(errorMessage);
      console.error('Cover letter error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">ATS Resume Optimizer</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Logout
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step 1: Upload Resume */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">Step 1: Upload Your Resume</h2>
              <FileUpload
                onFileSelect={handleResumeUpload}
                label="Drop your resume here (PDF, DOCX, or TXT)"
              />
              {loading && <p className="mt-4 text-center text-gray-600">Processing...</p>}
            </div>
          )}

          {/* Step 2: Job Description */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">Step 2: Enter Job Description</h2>
              <input
                type="text"
                placeholder="Job Title"
                value={jdTitle}
                onChange={(e) => setJdTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              />
              <textarea
                placeholder="Paste job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg mb-4"
              />
              <button
                onClick={handleJDSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 3: Optimize */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Step 3: Generate Optimized Resume</h2>
              <p className="text-gray-600 mb-6">
                Click below to analyze and optimize your resume for this job
              </p>
              <button
                onClick={handleOptimize}
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Optimizing...' : 'Optimize Resume'}
              </button>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && optimizedResume && (
            <div className="space-y-6">
              <ATSScore
                score={optimizedResume.ats_score}
                matchedKeywords={optimizedResume.matched_keywords}
                missingKeywords={optimizedResume.missing_keywords}
              />

              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-semibold mb-4">Download Your Documents</h2>
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href={`${backendUrl}${optimizedResume.pdf_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                  >
                    <Download size={20} />
                    Download Resume
                  </a>
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    <FileText size={20} />
                    {loading ? 'Generating...' : 'Generate Cover Letter'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setResumeId(null);
                  setJdId(null);
                  setOptimizedResume(null);
                }}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
              >
                Start New Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
