import React, { useState, useEffect } from 'react';
import { AppHeader } from '../components/AppHeader';
import { profileService, resumeService } from '../services/api';
import { Upload, Eye, Trash2 } from 'lucide-react';
import { Resume } from '../types';

export const Dashboard: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    summary: '',
    skills: [] as string[],
  });


  useEffect(() => {
    loadProfile();
    loadResumes();
  }, []);

  const normalizeOptionalUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  };

  const extractApiErrorMessage = (error: any) => {
    const responseData = error?.response?.data;
    if (!responseData) {
      return 'Error updating profile';
    }

    if (typeof responseData === 'string') {
      return responseData;
    }

    if (typeof responseData?.error === 'string') {
      return responseData.error;
    }

    if (typeof responseData === 'object') {
      const messages: string[] = [];
      for (const [field, value] of Object.entries(responseData)) {
        if (Array.isArray(value) && value.length > 0) {
          messages.push(`${field}: ${String(value[0])}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      }

      if (messages.length > 0) {
        return messages.join('\n');
      }
    }

    return 'Error updating profile';
  };

  const loadProfile = async () => {
    try {
      const response = await profileService.get();
      if (response.data) {
        setProfile({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          location: response.data.location || '',
          linkedin_url: response.data.linkedin_url || '',
          github_url: response.data.github_url || '',
          portfolio_url: response.data.portfolio_url || '',
          summary: response.data.summary || '',
          skills: response.data.skills || [],
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadResumes = async () => {
    try {
      const response = await resumeService.list();
      setResumes(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading resumes:', error);
    }
  };

  const handleProfileUpdate = async () => {
    const fullName = profile.full_name.trim();
    if (!fullName) {
      alert('Full Name is required');
      return;
    }

    const payload = {
      ...profile,
      full_name: fullName,
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      location: profile.location.trim(),
      linkedin_url: normalizeOptionalUrl(profile.linkedin_url),
      github_url: normalizeOptionalUrl(profile.github_url),
      portfolio_url: normalizeOptionalUrl(profile.portfolio_url),
      summary: profile.summary.trim(),
      skills: Array.isArray(profile.skills)
        ? profile.skills.map((skill) => skill.trim()).filter(Boolean)
        : [],
    };

    setLoading(true);
    try {
      const response = await profileService.update(payload);
      if (response.data) {
        setProfile({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          location: response.data.location || '',
          linkedin_url: response.data.linkedin_url || '',
          github_url: response.data.github_url || '',
          portfolio_url: response.data.portfolio_url || '',
          summary: response.data.summary || '',
          skills: response.data.skills || [],
        });
      }
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(extractApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.tex')) {
      alert('Please upload a LaTeX (.tex) resume to preserve exact structure.');
      return;
    }

    setLoading(true);
    try {
      // Upload first, then delete previous resumes to avoid data loss if upload fails.
      const existingResumeIds = resumes.map((resume) => resume.id);
      await resumeService.upload(file);

      const failedDeletes: number[] = [];
      for (const resumeId of existingResumeIds) {
        try {
          await resumeService.delete(resumeId);
        } catch {
          failedDeletes.push(resumeId);
        }
      }

      await loadResumes();
      if (failedDeletes.length > 0) {
        alert('Resume uploaded, but some old resumes could not be deleted. You can remove them manually.');
      } else {
        alert('Resume uploaded successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error uploading resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      try {
        await resumeService.delete(id);
        await loadResumes();
        alert('Resume deleted successfully!');
      } catch (error) {
        alert('Error deleting resume');
      }
    }
  };

  const cardClass =
    'rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_40px_-28px_rgba(16,185,129,0.6)]';
  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-100px] top-24 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute right-[-120px] top-0 h-80 w-80 rounded-full bg-teal-200/35 blur-3xl" />
      </div>
      <AppHeader />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-['Manrope'] text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="mb-8 mt-1 text-slate-600">
          Manage your profile and upload your base `.tex` resume for optimization.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cardClass}>
            <h2 className="mb-4 font-['Manrope'] text-xl font-semibold text-slate-800">Personal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className={inputClass}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className={inputClass}
                  placeholder="New York, USA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={profile.linkedin_url}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub</label>
                <input
                  type="url"
                  value={profile.github_url}
                  onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://github.com/johndoe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Portfolio</label>
                <input
                  type="url"
                  value={profile.portfolio_url}
                  onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://johndoe.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
                <textarea
                  value={profile.summary}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  className={inputClass}
                  rows={3}
                  placeholder="Brief professional summary..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
                  className={inputClass}
                  placeholder="Python, React, Node.js"
                />
              </div>
              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-white font-medium transition hover:bg-emerald-600 disabled:bg-slate-400"
              >
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="mb-4 font-['Manrope'] text-xl font-semibold text-slate-800">My Resumes</h2>
            
            <div className="mb-6">
              <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 transition-colors hover:border-emerald-500 hover:bg-emerald-50">
                <Upload className="mb-2 text-emerald-600" size={32} />
                <span className="text-sm font-medium text-slate-700">Upload Base Resume (.tex)</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".tex"
                  onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                  disabled={loading}
                />
              </label>
              <p className="mt-2 text-xs text-slate-500">
                Exact layout preservation works with LaTeX resume source files.
              </p>
            </div>

            <div className="space-y-3">
              {resumes.length === 0 ? (
                <p className="py-8 text-center text-slate-500">No resumes uploaded yet</p>
              ) : (
                resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">Resume #{resume.id}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await resumeService.viewFile(resume.id);
                            const blob = new Blob([res.data], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                          } catch {
                            alert('Could not load resume file.');
                          }
                        }}
                        className="rounded-lg p-2 text-emerald-700 transition-colors hover:bg-emerald-50"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="rounded-lg p-2 text-rose-700 transition-colors hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
