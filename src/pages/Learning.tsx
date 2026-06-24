import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import type { LearningItem, Skill } from '../types';
import { Plus, Clock, Edit2, X, GraduationCap, Upload } from 'lucide-react';

export const Learning: React.FC = () => {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Forms toggles
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningItem | null>(null);

  // Form states
  const [skillName, setSkillName] = useState('');
  const [status, setStatus] = useState('Backlog');
  const [progressPercent, setProgressPercent] = useState('0');
  const [hoursInvested, setHoursInvested] = useState('0.0');

  const [formError, setFormError] = useState('');

  // Resume upload states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;

    setUploadStatus('loading');
    setUploadMessage('');

    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      const result = await apiRequest('/auth/resume', {
        method: 'POST',
        body: formData,
      });
      setUploadStatus('success');
      setUploadMessage(result.message || 'Resume parsed successfully!');
      setResumeFile(null);
      const fileInput = document.getElementById('resume-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchItems();
    } catch (err: any) {
      setUploadStatus('error');
      setUploadMessage(err.message || 'Failed to parse resume');
    }
  };

  const [skills, setSkills] = useState<Skill[]>([]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [learningData, skillsData] = await Promise.all([
        apiRequest('/intelligence/learning'),
        apiRequest('/intelligence/skills'),
      ]);
      setItems(learningData);
      setSkills(skillsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await apiRequest('/intelligence/learning', {
        method: 'POST',
        body: JSON.stringify({
          skillName,
          status,
          progressPercent,
          hoursInvested,
        }),
      });
      setShowAdd(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add learning goal');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setFormError('');
    try {
      await apiRequest(`/intelligence/learning/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          progressPercent,
          hoursInvested,
        }),
      });
      setEditingItem(null);
      resetForm();
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update learning goal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this learning item?')) return;
    try {
      await apiRequest(`/intelligence/learning/${id}`, {
        method: 'DELETE',
      });
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setSkillName('');
    setStatus('Backlog');
    setProgressPercent('0');
    setHoursInvested('0.0');
    setFormError('');
  };

  const openEdit = (item: LearningItem) => {
    setEditingItem(item);
    setSkillName(item.skillName);
    setStatus(item.status);
    setProgressPercent(String(item.progressPercent));
    setHoursInvested(String(item.hoursInvested));
  };

  return (
    <div className="space-y-6">
      
      {/* Resume Upload Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-blue-600" /> Auto-import Skills from Resume
          </h3>
          <p className="text-slate-500 text-xs">
            Upload your PDF resume to automatically scan and import technical skills.
          </p>
        </div>
        <form onSubmit={handleResumeUpload} className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="file"
            id="resume-file-input"
            accept=".pdf"
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-xs file:font-semibold
              file:bg-slate-100 file:text-slate-800
              hover:file:bg-slate-200 file:cursor-pointer cursor-pointer border border-slate-200 rounded-md p-1 focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={!resumeFile || uploadStatus === 'loading'}
            className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-slate-900 text-white text-xs font-semibold rounded disabled:opacity-50 transition"
          >
            {uploadStatus === 'loading' ? 'Parsing...' : 'Upload & Parse'}
          </button>
        </form>
      </div>

      {uploadStatus !== 'idle' && (
        <div className={`p-3 text-xs rounded border ${
          uploadStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
          uploadStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          {uploadMessage}
        </div>
      )}

      {/* Mapped Skills Panel */}
      {skills.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">
            Core Profile Skills ({skills.length})
          </h3>
          <p className="text-slate-500 text-xs">
            These skills have been imported from your resume or mapped from logged interview rounds.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full hover:bg-blue-100 transition cursor-default"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Learning Tracker</h1>
          <p className="text-slate-500 text-sm">Add target skills to your curriculum, log hours invested, and track mastery.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-slate-900 text-white rounded-md text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Skill Goal
        </button>
      </div>

      {/* Grid of study items */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse text-sm">Loading curriculum...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white border border-slate-200 rounded-lg">
          No learning goals created yet. Set up a curriculum target to track progress.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition duration-150 relative flex flex-col justify-between">
              
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4" />
                    <span>Skill Goal</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'Mastered' ? 'bg-green-50 text-green-700 border-green-200' :
                      item.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                    <button onClick={() => openEdit(item)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-lg">{item.skillName}</h3>
              </div>

              {/* Progress and hours */}
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-semibold">
                    <span>Progress</span>
                    <span>{item.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Hours Invested: <strong className="text-slate-900">{item.hoursInvested}h</strong></span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Learning Goal</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{formError}</div>}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skill Name *</label>
                <input type="text" required placeholder="e.g. System Design, Docker, FastAPI" value={skillName} onChange={(e) => setSkillName(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Study Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                  <option value="Backlog">Backlog</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Mastered">Mastered</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Progress %</label>
                  <input type="number" min="0" max="100" placeholder="0" value={progressPercent} onChange={(e) => setProgressPercent(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hours Invested</label>
                  <input type="number" step="0.5" min="0" placeholder="0.0" value={hoursInvested} onChange={(e) => setHoursInvested(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAdd(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black hover:bg-slate-900 text-white text-sm font-semibold rounded">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Skill Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit {editingItem.skillName}</h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleDelete(editingItem.id)} className="text-xs text-red-600 hover:text-red-700 font-semibold mr-4">Delete</button>
                <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{formError}</div>}

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Study Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                  <option value="Backlog">Backlog</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Mastered">Mastered</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Progress %</label>
                  <input type="number" min="0" max="100" value={progressPercent} onChange={(e) => setProgressPercent(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hours Invested</label>
                  <input type="number" step="0.5" min="0" value={hoursInvested} onChange={(e) => setHoursInvested(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black hover:bg-slate-900 text-white text-sm font-semibold rounded">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
