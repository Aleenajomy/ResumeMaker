import React, { useEffect, useMemo, useState } from 'react';
import { ATSScore } from '../components/ATSScore';
import { AppHeader } from '../components/AppHeader';
import { resumeOptimizerService, resumeService } from '../services/api';
import { DiffToken, GeneratedDocument, Resume } from '../types';
import { getAccessToken } from '../utils/auth';
import { Copy, Download, FileText, RotateCcw, Upload } from 'lucide-react';

export const Home: React.FC = () => {
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [generateStep, setGenerateStep] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  const [result, setResult] = useState<GeneratedDocument | null>(null);
  const [originalLatex, setOriginalLatex] = useState<string>('');
  const [showDiff, setShowDiff] = useState(false);
  const [diffMode, setDiffMode] = useState<'summary' | 'highlight'>('summary');

  const latexResumes = useMemo(
    () => resumes.filter((resume) => Boolean(resume.latex_file)),
    [resumes]
  );

  useEffect(() => {
    loadResumes();
  }, []);

  useEffect(() => {
    if (!selectedResumeId && latexResumes.length > 0) {
      setSelectedResumeId(latexResumes[0].id);
    }
  }, [latexResumes, selectedResumeId]);

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

  const handleInlineUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.tex')) {
      alert('Please upload a LaTeX (.tex) file.');
      return;
    }
    setUploadingResume(true);
    try {
      const res = await resumeService.upload(file);
      await loadResumes();
      setSelectedResumeId(res.data.id);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error uploading resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setOriginalLatex('');
    setShowDiff(false);
    setDiffMode('summary');
    setCompanyName('');
    setCompanyLocation('');
    setJobTitle('');
    setJobDescription('');
    setRequirements('');
  };

  const getMediaUrl = (path: string | null): string => {
    if (!path) return '#';
    if (path.startsWith('http') || path.startsWith('data:')) {
      return path;
    }
    return `${backendUrl}${path}`;
  };

  const handleCopyEmail = async () => {
    if (!result) return;
    const fullEmail = `Subject: ${result.email_subject}\n\n${result.email_body}`;
    await navigator.clipboard.writeText(fullEmail);
    alert('Email copied to clipboard');
  };

  const handleDownloadEmail = () => {
    if (!result) return;
    const sanitize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'email';
    const fileName = `application_email_${sanitize(companyName)}_${sanitize(jobTitle)}.txt`;
    const fullEmail = `Subject: ${result.email_subject}\n\n${result.email_body}`;
    const blob = new Blob([fullEmail], { type: 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleDownload = async (path: string | null, fileName: string) => {
    if (!path) {
      alert('File is not available');
      return;
    }

    try {
      const source = getMediaUrl(path);
      const token = getAccessToken();
      const useAuthHeader = token && !source.startsWith('data:');
      const response = await fetch(source, {
        headers: useAuthHeader ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
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

    if (!selectedResumeId) {
      alert('Please select a dashboard .tex resume first.');
      return;
    }

    const selectedResume = latexResumes.find((resume) => resume.id === selectedResumeId);
    if (!selectedResume?.latex_file) {
      alert('Selected resume is not a .tex file. Upload/select a .tex resume from Dashboard.');
      return;
    }

    setLoadingGenerate(true);
    setGenerateStep('Generating documents...');
    try {
      // Fetch original .tex before generating so Before panel has proper line structure
      const selectedResume = latexResumes.find((r) => r.id === selectedResumeId);
      if (selectedResume?.latex_file) {
        try {
          const res = await resumeService.viewFile(selectedResume.id);
          setOriginalLatex(res.data);
        } catch {
          setOriginalLatex('');
        }
      }

      const res = await resumeOptimizerService.generate({
        companyName: companyName.trim(),
        companyLocation: companyLocation.trim(),
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        requirements: requirements.trim(),
        resumeId: selectedResumeId ?? undefined,
      });
      setResult(res.data.document);
      setShowDiff(false);
      setDiffMode('summary');
    } catch (error: any) {
      const status = error?.response?.status;
      const apiError = error?.response?.data;
      const message =
        (typeof apiError?.error === 'string' && apiError.error.trim()) ||
        (status === 429
          ? 'Too many requests. Please wait a minute before generating again.'
          : status === 500
          ? 'Server error while generating documents. Please retry in a few seconds.'
          : 'Failed to generate optimized documents');
      const details =
        typeof apiError?.details === 'string' && apiError.details.trim()
          ? apiError.details.trim()
          : '';
      alert(details ? `${message}\n\n${details}` : message);
      console.error('Optimizer generation error:', error);
    } finally {
      setLoadingGenerate(false);
      setGenerateStep('');
    }
  };

  const formatDiffText = (tokens: DiffToken[]) =>
    tokens
      .map((item) => item.word)
      .join(' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\s{2,}/g, ' ')
      .trim();

  const decodeLatexDataUrl = (dataUrl: string | null | undefined): string => {
    if (!dataUrl) return '';
    try {
      return atob(dataUrl.split(',')[1]);
    } catch {
      return '';
    }
  };

  // Extract plain-text summary section from the tailored resume for keyword highlighting
  const tailoredSummaryText = useMemo(() => {
    if (!result) return '';
    const text = result.tailored_resume_text || '';
    if (!text) return '';
    // Match summary section: look for Summary heading and grab content until next section
    const summaryMatch = text.match(
      /(?:summary|professional summary|profile|objective)[\s\S]{0,10}?\n([\s\S]{30,600}?)(?:\n\s*(?:[A-Z][A-Za-z &/\-]{2,}:?\s*\n|\\section))/i
    );
    if (summaryMatch) return summaryMatch[1].trim();
    // Fallback: first 400 chars after the first blank line (covers plain text resumes)
    const afterFirstBlank = text.replace(/^[^\n]*\n/, '').trim();
    return afterFirstBlank.slice(0, 400).trim();
  }, [result]);

  const diffData = useMemo(() => {
    const tokens = result?.diff_json || [];
    if (!tokens.length) return null;

    let addedCount = 0;
    let removedCount = 0;
    const groupedChanges: Array<{ type: 'added' | 'removed'; text: string }> = [];
    let currentType: 'added' | 'removed' | null = null;
    let currentWords: string[] = [];

    const flushGroup = () => {
      if (!currentType || currentWords.length === 0) return;
      groupedChanges.push({
        type: currentType,
        text: currentWords.join(' ').replace(/\s+([,.;:!?])/g, '$1').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s{2,}/g, ' ').trim(),
      });
      currentWords = [];
      currentType = null;
    };

    for (const token of tokens) {
      if (token.type === 'added') addedCount += 1;
      else if (token.type === 'removed') removedCount += 1;
      if (token.type === 'unchanged') { flushGroup(); continue; }
      if (!currentType || currentType === token.type) { currentType = token.type; currentWords.push(token.word); continue; }
      flushGroup();
      currentType = token.type;
      currentWords.push(token.word);
    }
    flushGroup();

    const originalText = formatDiffText(tokens.filter((t) => t.type !== 'added'));
    const updatedText = formatDiffText(tokens.filter((t) => t.type !== 'removed'));

    return {
      addedCount,
      removedCount,
      groupedChanges: groupedChanges.slice(0, 40),
      originalText,
      updatedText,
    };
  }, [result?.diff_json]);

  const panelClass =
    'rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_40px_-28px_rgba(16,185,129,0.65)]';
  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
  const textAreaClass =
    'w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-24 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute right-[-120px] top-10 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
      </div>
      <AppHeader />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-['Manrope'] text-4xl font-bold text-slate-800">Resume Generator</h1>
          <p className="mt-1 text-slate-600">
            Generate ATS-ready resume, cover letter, email, and resume diff in one workflow.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          <div className={panelClass}>
            <h2 className="mb-4 font-['Manrope'] text-2xl font-semibold text-slate-800">
              Job-Specific Customization
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoComplete="off"
                  className={inputClass}
                  placeholder="Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Location (Optional)</label>
                <input
                  type="text"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                  autoComplete="off"
                  className={inputClass}
                  placeholder="Technopark, Kerala"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  autoComplete="off"
                  className={inputClass}
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                autoComplete="off"
                className={`${textAreaClass} h-56`}
                placeholder="Paste the full job description..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Requirements (Optional)
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                autoComplete="off"
                className={`${textAreaClass} h-28`}
                placeholder="Any structured requirements or key constraints..."
              />
            </div>

            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <p className="font-medium text-slate-800">Resume Source (Dashboard `.tex` only)</p>
              {loadingResumes ? (
                <p className="text-sm text-slate-600">Loading dashboard resumes...</p>
              ) : latexResumes.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-amber-700">No `.tex` resume found. Upload one to continue.</p>
                  <label className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                    uploadingResume ? 'border-slate-300 bg-slate-50' : 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-50'
                  }`}>
                    <Upload size={24} className="mb-1 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {uploadingResume ? 'Uploading...' : 'Upload Base Resume (.tex)'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".tex"
                      disabled={uploadingResume}
                      onChange={(e) => e.target.files?.[0] && handleInlineUpload(e.target.files[0])}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Select uploaded `.tex` resume
                    </label>
                    <select
                      value={selectedResumeId ?? ''}
                      onChange={(e) => setSelectedResumeId(e.target.value ? Number(e.target.value) : null)}
                      className={inputClass}
                    >
                      {latexResumes.map((resume) => (
                        <option key={resume.id} value={resume.id}>
                          Resume #{resume.id} ({new Date(resume.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className={`flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed transition-colors ${
                    uploadingResume ? 'border-slate-300 bg-slate-50 text-slate-400' : 'border-emerald-300 bg-white text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50'
                  }`}>
                    <Upload size={15} />
                    <span className="text-sm font-medium">
                      {uploadingResume ? 'Uploading...' : 'Upload a different .tex file'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".tex"
                      disabled={uploadingResume}
                      onChange={(e) => e.target.files?.[0] && handleInlineUpload(e.target.files[0])}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col md:flex-row gap-3">
              <button
                onClick={handleGenerate}
                disabled={loadingGenerate}
                className="flex-1 rounded-lg bg-emerald-500 py-3 font-medium text-white transition hover:bg-emerald-600 disabled:bg-slate-400"
              >
                {loadingGenerate ? (generateStep || 'Generating...') : 'Generate Documents'}
              </button>
              <button
                onClick={resetForm}
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>

          {result && (
            <div className="space-y-6">
              <ATSScore
                score={result.ats_score ?? 0}
                matchedKeywords={result.matched_keywords}
                missingKeywords={result.missing_keywords}
                summaryText={tailoredSummaryText}
              />

              <div className={panelClass}>
                <h2 className="mb-4 font-['Manrope'] text-2xl font-semibold text-slate-800">Generated Documents</h2>
                {result.is_latex_based && (
                  <p className="mb-4 text-sm text-slate-600">
                    Controlled LaTeX mode: only header headline, Summary, and Skills are updated.
                    Experience, Projects, and Education are kept unchanged.
                  </p>
                )}
                {result.is_latex_based && !result.resume_pdf && result.tailored_resume_tex && (
                  <p className="mb-4 text-sm text-amber-700">
                    PDF compile failed on server. Download the updated LaTeX source and compile locally.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => handleDownload(result.resume_pdf, 'tailored_resume.pdf')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg ${
                      result.resume_pdf
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-slate-300 text-slate-600 pointer-events-none'
                    }`}
                  >
                    <Download size={18} />
                    Download Resume PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(result.cover_letter_pdf, 'cover_letter.pdf')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg ${
                      result.cover_letter_pdf
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-slate-300 text-slate-600 pointer-events-none'
                    }`}
                  >
                    <FileText size={18} />
                    Download Cover Letter PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(result.cover_letter_docx, 'cover_letter.docx')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg ${
                      result.cover_letter_docx
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-300 text-slate-600 pointer-events-none'
                    }`}
                  >
                    <FileText size={18} />
                    Download Cover Letter DOCX
                  </button>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-white hover:bg-slate-800"
                  >
                    <Copy size={18} />
                    Copy Professional Email
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadEmail}
                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 py-3 text-white hover:bg-slate-800"
                  >
                    <Download size={18} />
                    Download Email TXT
                  </button>
                  <button
                    onClick={() => setShowDiff((prev) => !prev)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-white hover:bg-emerald-700"
                  >
                    {showDiff ? 'Hide Resume Diff' : 'View Resume Diff'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold mb-3">Email Template</h3>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{`Subject: ${result.email_subject}\n\n${result.email_body}`}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="font-semibold mb-2">Cover Letter Preview</h3>
                    <p className="max-h-56 overflow-auto text-sm text-slate-700 whitespace-pre-wrap">
                      {result.cover_letter_text}
                    </p>
                    <h3 className="font-semibold mt-4 mb-2">AI Change Summary</h3>
                    {result.ai_changes.length === 0 ? (
                      <p className="text-sm text-slate-600">No changes listed.</p>
                    ) : (
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                        {result.ai_changes.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {showDiff && result.diff_json && diffData && (
                <div className={panelClass}>
                  <h2 className="mb-4 font-['Manrope'] text-2xl font-semibold text-slate-800">
                    {result.is_latex_based ? 'LaTeX Resume Diff' : 'Resume Diff'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setDiffMode('summary')}
                      className={`px-3 py-1.5 rounded-md text-sm border ${
                        diffMode === 'summary'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Summary View
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiffMode('highlight')}
                      className={`px-3 py-1.5 rounded-md text-sm border ${
                        diffMode === 'highlight'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Highlight View
                    </button>
                  </div>

                  {diffMode === 'summary' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3">
                          <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Added Tokens</p>
                          <p className="text-2xl font-bold text-emerald-800">{diffData.addedCount}</p>
                        </div>
                        <div className="border border-rose-200 bg-rose-50 rounded-lg p-3">
                          <p className="text-xs uppercase tracking-wide text-rose-700 font-semibold">Removed Tokens</p>
                          <p className="text-2xl font-bold text-rose-800">{diffData.removedCount}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-3 font-semibold text-slate-800">Key Changes</h3>
                        {diffData.groupedChanges.length === 0 ? (
                          <p className="text-sm text-slate-600">No grouped changes available.</p>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-auto pr-1">
                            {diffData.groupedChanges.map((change, index) => (
                              <div
                                key={`${change.type}-${index}`}
                                className={`text-sm rounded-md p-2 border ${
                                  change.type === 'added'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-rose-50 border-rose-200 text-rose-900'
                                }`}
                              >
                                <span className="font-semibold mr-2">{change.type === 'added' ? '+ Added:' : '- Removed:'}</span>
                                {change.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {(() => {
                        const afterLatex = decodeLatexDataUrl(result?.tailored_resume_tex);
                        const afterLines = afterLatex ? afterLatex.split('\n') : [];

                        const beforeLines = originalLatex.split('\n');

                        const addedSet = new Set(
                          (result?.diff_json || []).filter((t) => t.type === 'added').map((t) => t.word)
                        );
                        const removedSet = new Set(
                          (result?.diff_json || []).filter((t) => t.type === 'removed').map((t) => t.word)
                        );

                        const renderLine = (line: string, hlSet: Set<string>, color: 'red' | 'green', li: number) => {
                          const words = line.split(' ');
                          const changed = words.some((w) => hlSet.has(w));
                          return (
                            <div key={li} className={changed ? (color === 'red' ? 'bg-rose-900/40' : 'bg-emerald-900/40') : ''}>
                              {words.map((w, wi) =>
                                hlSet.has(w) ? (
                                  <mark key={wi} className={color === 'red' ? 'bg-rose-600/70 text-rose-100 rounded-sm px-0.5 mr-0.5' : 'bg-emerald-600/70 text-emerald-100 rounded-sm px-0.5 mr-0.5'}>{w}</mark>
                                ) : (
                                  <span key={wi} className="text-slate-300">{w} </span>
                                )
                              )}
                            </div>
                          );
                        };

                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Before */}
                            <div className="rounded-lg border border-slate-700 bg-[#1e1e2e] p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-200 text-sm">Before</h3>
                                <button type="button" onClick={() => navigator.clipboard.writeText(originalLatex)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700">
                                  <Copy size={12} /> Copy
                                </button>
                              </div>
                              <pre className="max-h-80 overflow-auto text-xs font-mono leading-5 whitespace-pre-wrap">
                                {beforeLines.map((line, li) => renderLine(line, removedSet, 'red', li))}
                              </pre>
                            </div>
                            {/* After */}
                            <div className="rounded-lg border border-slate-700 bg-[#1e1e2e] p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-200 text-sm">After</h3>
                                <button type="button" onClick={() => navigator.clipboard.writeText(afterLatex || diffData.updatedText)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700">
                                  <Copy size={12} /> Copy LaTeX
                                </button>
                              </div>
                              <pre className="max-h-80 overflow-auto text-xs font-mono leading-5 whitespace-pre-wrap">
                                {afterLines.map((line, li) => renderLine(line, addedSet, 'green', li))}
                              </pre>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 leading-8">
                      {result.diff_json.map((item, index) => (
                        <span
                          key={`${item.word}-${index}`}
                          className={
                            item.type === 'added'
                              ? 'bg-emerald-200 text-emerald-900 px-1 rounded'
                              : item.type === 'removed'
                              ? 'bg-rose-200 text-rose-900 line-through px-1 rounded'
                              : 'text-slate-700'
                          }
                        >
                          {item.word}{' '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
