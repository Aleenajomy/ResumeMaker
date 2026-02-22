import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ATSScore } from '../components/ATSScore';
import { authService, resumeOptimizerService, resumeService } from '../services/api';
import { GeneratedDocument, OptimizerGenerateResponse, Resume } from '../types';
import { Copy, Download, FileText, RotateCcw, Upload } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [result, setResult] = useState<GeneratedDocument | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const latestResume = useMemo(() => (resumes.length > 0 ? resumes[0] : null), [resumes]);

  useEffect(() => {
    loadResumes();
  }, []);

  useEffect(() => {
    if (!selectedResumeId && latestResume) {
      setSelectedResumeId(latestResume.id);
    }
  }, [latestResume, selectedResumeId]);

  const loadResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await resumeService.list();
      const resumeList = response.data.results || response.data || [];
      setResumes(resumeList);
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  const resetForm = () => {
    setResult(null);
    setShowDiff(false);
    setResumeFile(null);
    setCompanyName('');
    setJobTitle('');
    setJobDescription('');
    setRequirements('');
  };

  const getMediaUrl = (path: string | null): string => {
    if (!path) return '#';
    return path.startsWith('http') ? path : `${backendUrl}${path}`;
  };

  const handleCopyEmail = async () => {
    if (!result) return;
    const fullEmail = `Subject: ${result.email_subject}\n\n${result.email_body}`;
    await navigator.clipboard.writeText(fullEmail);
    alert('Email copied to clipboard');
  };

  const handleGenerate = async () => {
    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      alert('Please provide company name, job title, and job description');
      return;
    }

    if (jobDescription.trim().length < 50) {
      alert('Job description should be at least 50 characters');
      return;
    }

    if (!resumeFile && !selectedResumeId) {
      alert('Upload a resume here or use one from your Dashboard');
      return;
    }

    setLoadingGenerate(true);
    try {
      const response = await resumeOptimizerService.generate({
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        requirements: requirements.trim(),
        resumeId: resumeFile ? undefined : selectedResumeId || undefined,
        resumeFile,
      });

      const data = response.data as OptimizerGenerateResponse;
      setResult(data.document);
      setCreditsRemaining(data.credits_remaining);
      setShowDiff(false);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to generate optimized documents';
      alert(message);
      console.error('Optimizer generation error:', error);
    } finally {
      setLoadingGenerate(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Resume Optimizer</h1>
            <p className="text-gray-600 mt-1">
              Generate tailored resume, cover letter, email, and resume diff in one click
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Logout
          </button>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Job-Specific Customization</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full h-56 p-3 border border-gray-300 rounded-lg"
                placeholder="Paste the full job description..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements (Optional)
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full h-28 p-3 border border-gray-300 rounded-lg"
                placeholder="Any structured requirements or key constraints..."
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <p className="font-medium text-gray-800">Resume Source (upload not mandatory)</p>

              {loadingResumes ? (
                <p className="text-sm text-gray-600">Loading your dashboard resumes...</p>
              ) : (
                <>
                  {resumes.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Use existing dashboard resume
                      </label>
                      <select
                        value={selectedResumeId ?? ''}
                        onChange={(e) =>
                          setSelectedResumeId(e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        disabled={!!resumeFile}
                      >
                        {resumes.map((resume) => (
                          <option key={resume.id} value={resume.id}>
                            Resume #{resume.id} ({new Date(resume.created_at).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                      {resumeFile && (
                        <p className="text-xs text-blue-700 mt-2">
                          Uploaded file will override selected dashboard resume.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700">
                      No dashboard resume found. Upload a resume file below.
                    </p>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload new resume for this job (Optional)
                </label>
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 bg-white">
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {resumeFile ? resumeFile.name : 'Choose PDF, DOCX, TXT, or TEX'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.tex"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setResumeFile(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 flex flex-col md:flex-row gap-3">
              <button
                onClick={handleGenerate}
                disabled={loadingGenerate}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {loadingGenerate ? 'Generating...' : 'Generate Tailored Documents'}
              </button>
              <button
                onClick={resetForm}
                type="button"
                className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {creditsRemaining !== null && (
              <p className="mt-3 text-sm text-gray-600">Credits remaining: {creditsRemaining}</p>
            )}
          </div>

          {result && (
            <div className="space-y-6">
              <ATSScore
                score={result.ats_score ?? 0}
                matchedKeywords={result.matched_keywords}
                missingKeywords={result.missing_keywords}
              />

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Generated Documents</h2>
                {result.is_latex_based && (
                  <p className="text-sm text-gray-600 mb-4">
                    Controlled LaTeX mode: only Summary, Skills, and Certifications were updated.
                    Experience, Projects, and Education were kept unchanged.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {result.is_latex_based && result.tailored_resume_tex ? (
                    <a
                      href={getMediaUrl(result.tailored_resume_tex)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                    >
                      <Download size={18} />
                      Download Updated .tex
                    </a>
                  ) : (
                    <a
                      href={getMediaUrl(result.resume_pdf)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                    >
                      <Download size={18} />
                      Download Tailored Resume
                    </a>
                  )}
                  <a
                    href={getMediaUrl(result.cover_letter_pdf)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
                  >
                    <FileText size={18} />
                    Download Cover Letter
                  </a>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900"
                  >
                    <Copy size={18} />
                    Copy Professional Email
                  </button>
                  <button
                    onClick={() => setShowDiff((prev) => !prev)}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700"
                  >
                    {showDiff ? 'Hide Resume Diff' : 'View Resume Diff'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Email Subject</h3>
                    <p className="text-gray-700 text-sm">{result.email_subject}</p>
                    <h3 className="font-semibold mt-4 mb-2">Email Body</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{result.email_body}</p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Cover Letter Preview</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap max-h-56 overflow-auto">
                      {result.cover_letter_text}
                    </p>
                    <h3 className="font-semibold mt-4 mb-2">AI Change Summary</h3>
                    {result.ai_changes.length === 0 ? (
                      <p className="text-sm text-gray-600">No changes listed.</p>
                    ) : (
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {result.ai_changes.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {showDiff && result.diff_json && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    {result.is_latex_based ? 'LaTeX Difference Highlight' : 'Resume Difference Highlight'}
                  </h2>
                  <div className="p-4 border border-gray-200 rounded-lg leading-8">
                    {result.diff_json.map((item, index) => (
                      <span
                        key={`${item.word}-${index}`}
                        className={
                          item.type === 'added'
                            ? 'bg-yellow-200 px-1 rounded'
                            : item.type === 'removed'
                            ? 'bg-red-100 text-red-600 line-through px-1 rounded'
                            : ''
                        }
                      >
                        {item.word}{' '}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
