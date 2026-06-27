import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import type { Application } from '../types';
import { Briefcase, Calendar, DollarSign, Plus, ChevronRight, X, User } from 'lucide-react';

export const Applications: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modals / Forms toggle
  const [showAddApp, setShowAddApp] = useState(false);
  const [showAddRound, setShowAddRound] = useState(false);
  
  // Add App Form state
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [position, setPosition] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [source, setSource] = useState('LinkedIn');
  const [appStatus, setAppStatus] = useState('Applied');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);

  // Add Round Form state
  const [roundNumber, setRoundNumber] = useState('1');
  const [roundType, setRoundType] = useState('Technical Screen');
  const [interviewerNames, setInterviewerNames] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [roundStatus, setRoundStatus] = useState('Scheduled');
  const [confidenceScore, setConfidenceScore] = useState('5');
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const [formError, setFormError] = useState('');

  const fetchApps = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/applications?status=${filterStatus}` : '/applications';
      const data = await apiRequest(url);
      setApps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [filterStatus]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          companyWebsite,
          position,
          salaryMin: salaryMin || undefined,
          salaryMax: salaryMax || undefined,
          currency,
          source,
          status: appStatus,
          appliedDate,
        }),
      });
      setShowAddApp(false);
      resetAppForm();
      fetchApps();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create application');
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedApp) return;
    try {
      await apiRequest('/rounds', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: selectedApp.id,
          roundNumber,
          roundType,
          interviewerNames,
          scheduledAt: scheduledAt || undefined,
          durationMinutes: durationMinutes || undefined,
          status: roundStatus,
          confidenceScore: confidenceScore || undefined,
          feedbackNotes,
        }),
      });
      setShowAddRound(false);
      resetRoundForm();
      // Reload detail view
      const updatedApp = await apiRequest(`/applications/${selectedApp.id}`);
      setSelectedApp(updatedApp);
      fetchApps();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add round');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiRequest(`/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
      fetchApps();
    } catch (err) {
      console.error(err);
    }
  };

  const resetAppForm = () => {
    setCompanyName('');
    setCompanyWebsite('');
    setPosition('');
    setSalaryMin('');
    setSalaryMax('');
    setSource('LinkedIn');
    setAppStatus('Applied');
    setAppliedDate(new Date().toISOString().split('T')[0]);
    setFormError('');
  };

  const resetRoundForm = () => {
    setRoundNumber('1');
    setRoundType('Technical Screen');
    setInterviewerNames('');
    setScheduledAt('');
    setDurationMinutes('45');
    setRoundStatus('Scheduled');
    setConfidenceScore('5');
    setFeedbackNotes('');
    setFormError('');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Screening': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Technical': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Fit': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Offer': return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Applications</h1>
          <p className="text-slate-500 text-sm">Track your active opportunities and interview rounds.</p>
        </div>
        <button
          onClick={() => setShowAddApp(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-slate-900 text-white rounded-md text-sm font-semibold transition shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      {/* Main layout split if an application is selected */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Applications List */}
        <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${selectedApp ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="font-bold text-slate-900 text-sm">Opportunities</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Technical">Technical</option>
              <option value="Fit">Fit</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 animate-pulse text-sm">Loading applications...</div>
          ) : apps.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No applications found. Log one to get started!</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {apps.map((app) => (
                <div
                  key={app.id}
                  onClick={async () => {
                    const detail = await apiRequest(`/applications/${app.id}`);
                    setSelectedApp(detail);
                  }}
                  className={`p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition duration-150 ${
                    selectedApp?.id === app.id ? 'bg-blue-50/50 border-r-4 border-blue-600' : ''
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <h3 className="font-bold text-slate-900 text-sm">{app.position}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{app.company.name}</span>
                      <span>•</span>
                      <span>{new Date(app.appliedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(app.status)}`}>
                      {app.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Selected Application Detail View */}
        {selectedApp && (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{selectedApp.company.name}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedApp.position}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  {selectedApp.salaryMin && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {selectedApp.salaryMin.toLocaleString()} - {selectedApp.salaryMax?.toLocaleString()} {selectedApp.currency}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Applied: {new Date(selectedApp.appliedDate).toLocaleDateString()}
                  </span>
                  <span>Source: {selectedApp.source}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Toggles */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Stage Status</h4>
              <div className="flex flex-wrap gap-2">
                {['Applied', 'Screening', 'Technical', 'Fit', 'Offer', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(selectedApp.id, status)}
                    className={`text-xs px-3 py-1 rounded-full border transition duration-150 font-semibold ${
                      selectedApp.status === status
                        ? 'bg-black text-white border-black'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds Log list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-base">Interview Rounds</h3>
                <button
                  onClick={() => setShowAddRound(true)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Round
                </button>
              </div>

              {selectedApp.rounds?.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                  No interview rounds scheduled yet. Click Add Round above to log one.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedApp.rounds?.map((round) => (
                    <div key={round.id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition bg-slate-50/30">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">
                            Round {round.roundNumber}: {round.roundType}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {round.interviewerNames && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" /> {round.interviewerNames}
                              </span>
                            )}
                            {round.scheduledAt && (
                              <span>Scheduled: {new Date(round.scheduledAt).toLocaleDateString()}</span>
                            )}
                            {round.durationMinutes && <span>Duration: {round.durationMinutes}m</span>}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            round.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {round.status}
                          </span>
                          {round.confidenceScore && (
                            <span className="text-xs text-slate-600">
                              Confidence: <strong className="text-slate-900">{round.confidenceScore}/10</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {round.feedbackNotes && (
                        <div className="mt-3 p-3 bg-white border border-slate-100 rounded text-xs text-slate-600 italic">
                          "{round.feedbackNotes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Add Application Modal Overlay */}
      {showAddApp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Job Application</h3>
              <button onClick={() => { setShowAddApp(false); resetAppForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{formError}</div>}

            <form onSubmit={handleCreateApp} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input type="text" required placeholder="Google" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Website</label>
                  <input type="text" placeholder="https://google.com" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Position / Role *</label>
                <input type="text" required placeholder="Senior Frontend Engineer" value={position} onChange={(e) => setPosition(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Min</label>
                  <input type="number" placeholder="100000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Max</label>
                  <input type="number" placeholder="150000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Application Source</label>
                  <select value={source} onChange={(e) => setSource(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Referral">Referral</option>
                    <option value="Direct">Direct Apply</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Applied Date *</label>
                  <input type="date" required value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                <select value={appStatus} onChange={(e) => setAppStatus(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                  <option value="Applied">Applied</option>
                  <option value="Screening">Screening</option>
                  <option value="Technical">Technical</option>
                  <option value="Fit">Fit</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddApp(false); resetAppForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black hover:bg-slate-900 text-white text-sm font-semibold rounded">Save Application</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Round Modal Overlay */}
      {showAddRound && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Interview Round</h3>
              <button onClick={() => { setShowAddRound(false); resetRoundForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{formError}</div>}

            <form onSubmit={handleCreateRound} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Round Number *</label>
                  <input type="number" min="1" required value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Round Type *</label>
                  <select value={roundType} onChange={(e) => setRoundType(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="HR Screen">HR Screen</option>
                    <option value="Technical Screen">Technical Screen</option>
                    <option value="Coding Round">Coding Round</option>
                    <option value="System Design">System Design</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Fit Check">Fit Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interviewer Name(s)</label>
                <input type="text" placeholder="Sarah Jane, Tech Lead" value={interviewerNames} onChange={(e) => setInterviewerNames(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled At</label>
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (minutes)</label>
                  <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Round Status</label>
                  <select value={roundStatus} onChange={(e) => setRoundStatus(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confidence Score (1-10)</label>
                  <select value={confidenceScore} onChange={(e) => setConfidenceScore(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}/10</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Notes / Summary</label>
                <textarea rows={3} placeholder="Summarize how it went, things they liked, things you stumbled on..." value={feedbackNotes} onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddRound(false); resetRoundForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black hover:bg-slate-900 text-white text-sm font-semibold rounded">Save Round</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
