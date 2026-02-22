import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { profileService, resumeService, certificationService } from '../services/api';
import { FileText, Award, User, Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, resumesRes, certsRes] = await Promise.all([
        profileService.get(),
        resumeService.list(),
        certificationService.list(),
      ]);
      console.log('Resumes:', resumesRes.data);
      setProfile(profileRes.data);
      setResumes(resumesRes.data.results || resumesRes.data || []);
      setCertifications(certsRes.data.results || certsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Complete Profile View</h1>

        {/* Personal Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-blue-600" size={24} />
            <h2 className="text-2xl font-semibold">Personal Information</h2>
          </div>
          
          {profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{profile.full_name || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profile.email || profile.user?.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{profile.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{profile.location || 'Not provided'}</p>
                </div>
              </div>
              {profile.linkedin_url && (
                <div className="flex items-center gap-3">
                  <Linkedin size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">LinkedIn</p>
                    <a href={profile.linkedin_url} target="_blank" className="font-medium text-blue-600 hover:underline">
                      View Profile
                    </a>
                  </div>
                </div>
              )}
              {profile.github_url && (
                <div className="flex items-center gap-3">
                  <Github size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">GitHub</p>
                    <a href={profile.github_url} target="_blank" className="font-medium text-blue-600 hover:underline">
                      View Profile
                    </a>
                  </div>
                </div>
              )}
              {profile.portfolio_url && (
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Portfolio</p>
                    <a href={profile.portfolio_url} target="_blank" className="font-medium text-blue-600 hover:underline">
                      Visit Website
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Loading profile...</p>
          )}

          {profile?.summary && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Professional Summary</p>
              <p className="text-gray-700">{profile.summary}</p>
            </div>
          )}

          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resumes */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-green-600" size={24} />
            <h2 className="text-2xl font-semibold">Resumes</h2>
          </div>
          
          {resumes.length === 0 ? (
            <p className="text-gray-500">No resumes uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">Resume #{resume.id}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {(resume.original_file || resume.latex_file) && (
                    <div className="mt-4">
                      {(() => {
                        const filePath = resume.original_file || resume.latex_file;
                        if (!filePath) return null;
                        const href = filePath.startsWith('http') ? filePath : `${backendUrl}${filePath}`;
                        return (
                      <a
                        href={href}
                        target="_blank"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        View Resume File
                      </a>
                        );
                      })()}
                    </div>
                  )}
                  
                  {resume.parsed_content && (
                    <div className="bg-gray-50 rounded p-4 text-sm mt-4">
                      <p className="font-medium mb-2">Extracted Information:</p>
                      <div className="space-y-1 text-gray-700">
                        {resume.parsed_content.name && <p>Name: {resume.parsed_content.name}</p>}
                        {resume.parsed_content.email && <p>Email: {resume.parsed_content.email}</p>}
                        {resume.parsed_content.phone && <p>Phone: {resume.parsed_content.phone}</p>}
                        {resume.parsed_content.skills && (
                          <p>Skills: {resume.parsed_content.skills.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-purple-600" size={24} />
            <h2 className="text-2xl font-semibold">Certifications</h2>
          </div>
          
          {certifications.length === 0 ? (
            <p className="text-gray-500">No certifications added yet</p>
          ) : (
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{cert.title}</h3>
                      <p className="text-gray-600">{cert.issuer}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                      </p>
                      {cert.credential_id && (
                        <p className="text-sm text-gray-500">Credential ID: {cert.credential_id}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          View URL
                        </a>
                      )}
                      {cert.media_file && (
                        <a
                          href={cert.media_file.startsWith('http') ? cert.media_file : `${backendUrl}${cert.media_file}`}
                          target="_blank"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                          View File
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
