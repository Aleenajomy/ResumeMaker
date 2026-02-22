import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { certificationService } from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Certification {
  id?: number;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  media_file?: File | string | null;
}

export const Certifications: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Certification>({
    title: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: '',
    media_file: null,
  });

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    try {
      const response = await certificationService.list();
      console.log('Certifications:', response.data);
      setCertifications(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading certifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('issuer', formData.issuer);
      data.append('issue_date', formData.issue_date);
      if (formData.expiry_date) data.append('expiry_date', formData.expiry_date);
      if (formData.credential_id) data.append('credential_id', formData.credential_id);
      if (formData.credential_url && formData.credential_url.trim()) data.append('credential_url', formData.credential_url);
      if (formData.media_file instanceof File) {
        data.append('media_file', formData.media_file);
      }

      if (editingId) {
        await certificationService.update(editingId, data);
      } else {
        await certificationService.create(data);
      }
      await loadCertifications();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error:', error.response?.data);
      alert(error.response?.data?.error || JSON.stringify(error.response?.data) || 'Error saving certification');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      try {
        await certificationService.delete(id);
        await loadCertifications();
      } catch (error) {
        alert('Error deleting certification');
      }
    }
  };

  const handleEdit = (cert: Certification) => {
    setFormData(cert);
    setEditingId(cert.id!);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      issuer: '',
      issue_date: '',
      expiry_date: '',
      credential_id: '',
      credential_url: '',
      media_file: null,
    });
    setEditingId(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Certifications</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Certification
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Issuer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Issue Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certifications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No certifications added yet
                  </td>
                </tr>
              ) : (
                certifications.map((cert) => (
                  <tr key={cert.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{cert.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cert.issuer}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            View URL
                          </a>
                        )}
                        {typeof cert.media_file === 'string' && cert.media_file && (
                          <a
                            href={cert.media_file.startsWith('http') ? cert.media_file : `http://localhost:8000${cert.media_file}`}
                            target="_blank"
                            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                          >
                            View File
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(cert)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(cert.id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingId ? 'Edit Certification' : 'Add Certification'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
                  <input
                    type="text"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credential URL (optional)</label>
                  <input
                    type="url"
                    value={formData.credential_url || ''}
                    onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Certificate (optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setFormData({ ...formData, media_file: e.target.files?.[0] || null })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supported: PDF, JPG, PNG, DOC, DOCX</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
