import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
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

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    loadProfile();
    loadResumes();
  }, []);

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
    setLoading(true);
    try {
      await profileService.update(profile);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    setLoading(true);
    try {
      // Delete existing resumes first
      for (const resume of resumes) {
        await resumeService.delete(resume.id);
      }
      
      // Upload new resume
      await resumeService.upload(file);
      await loadResumes();
      alert('Resume uploaded successfully!');
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="New York, USA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={profile.linkedin_url}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                <input
                  type="url"
                  value={profile.github_url}
                  onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="github.com/johndoe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                <input
                  type="url"
                  value={profile.portfolio_url}
                  onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="johndoe.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <textarea
                  value={profile.summary}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Brief professional summary..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Python, React, Node.js"
                />
              </div>
              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </div>

          {/* Resume Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">My Resumes</h2>
            
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                <Upload className="text-gray-400 mb-2" size={32} />
                <span className="text-sm text-gray-600">Upload Resume</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.tex"
                  onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                  disabled={loading}
                />
              </label>
            </div>

            <div className="space-y-3">
              {resumes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No resumes uploaded yet</p>
              ) : (
                resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Resume #{resume.id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const filePath = resume.original_file || resume.latex_file;
                          if (!filePath) {
                            return;
                          }
                          const url = filePath.startsWith('http')
                            ? filePath
                            : `${backendUrl}${filePath}`;
                          console.log('Opening URL:', url);
                          window.open(url, '_blank');
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
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
