import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import type { JournalEntry, Application } from '../types';
import { Plus, Award, AlertCircle, Calendar, X, FileText } from 'lucide-react';

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Forms toggles
  const [showAdd, setShowAdd] = useState(false);

  // Form states
  const [interviewRoundId, setInterviewRoundId] = useState('');
  const [wins, setWins] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [mood, setMood] = useState('Confident');
  const [nextActions, setNextActions] = useState('');

  const [formError, setFormError] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/intelligence/journal');
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRounds = async () => {
    try {
      const data = await apiRequest('/applications');
      setApps(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchRounds();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await apiRequest('/intelligence/journal', {
        method: 'POST',
        body: JSON.stringify({
          interviewRoundId: interviewRoundId || undefined,
          wins,
          mistakes,
          mood,
          nextActions,
        }),
      });
      setShowAdd(false);
      resetForm();
      fetchEntries();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save entry');
    }
  };

  const resetForm = () => {
    setInterviewRoundId('');
    setWins('');
    setMistakes('');
    setMood('Confident');
    setNextActions('');
    setFormError('');
  };

  const getMoodColor = (m: string) => {
    switch (m) {
      case 'Confident': return 'bg-green-50 text-green-700 border-green-200';
      case 'Anxious': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Exhausted': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Experience Journal</h1>
          <p className="text-slate-500 text-sm">Reflect on wins and mistakes immediately after each interview round.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-slate-900 text-white rounded-md text-sm font-semibold transition shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Log Reflection
        </button>
      </div>

      {/* List of journal reflections */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse text-sm">Loading journal...</div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white border border-slate-200 rounded-lg">
          No reflections logged yet. Log a post-round reflection to analyze performance.
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition duration-150 space-y-4">
              
              {/* Header meta */}
              <div className="flex justify-between items-start flex-wrap gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(entry.loggedAt).toLocaleDateString()}</span>
                  </div>
                  {entry.interviewRound && (
                    <h3 className="font-bold text-slate-900 text-sm">
                      Reflection: {entry.interviewRound.application?.company.name} - Round {entry.interviewRound.roundNumber} ({entry.interviewRound.roundType})
                    </h3>
                  )}
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getMoodColor(entry.mood || '')}`}>
                  Mood: {entry.mood}
                </span>
              </div>

              {/* Wins and Mistakes Split Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entry.wins && (
                  <div className="p-4 bg-green-50/20 border border-green-100 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold uppercase tracking-wider">
                      <Award className="w-4 h-4" />
                      <span>What went well (Wins)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{entry.wins}</p>
                  </div>
                )}

                {entry.mistakes && (
                  <div className="p-4 bg-red-50/20 border border-red-100 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-red-700 font-bold uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" />
                      <span>Areas for Improvement</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{entry.mistakes}</p>
                  </div>
                )}
              </div>

              {/* Next Actions */}
              {entry.nextActions && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Action Items for Next Time</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{entry.nextActions}</p>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Add Reflection Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Log Post-Interview Reflection</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{formError}</div>}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Completed Round</label>
                <select 
                  value={interviewRoundId} 
                  onChange={(e) => setInterviewRoundId(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600 text-slate-700"
                >
                  <option value="">Standalone Entry (Not linked to specific round)</option>
                  {apps.flatMap(app => 
                    app.rounds?.map(round => (
                      <option key={round.id} value={round.id}>
                        {app.company.name} - Round {round.roundNumber} ({round.roundType})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reflection Mood</label>
                  <select value={mood} onChange={(e) => setMood(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="Confident">Confident / Happy</option>
                    <option value="Anxious">Anxious / Nervous</option>
                    <option value="Exhausted">Exhausted / Stressed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">What went well? (Wins)</label>
                <textarea rows={3} placeholder="Describe parts where you excelled or gave strong responses..." value={wins} onChange={(e) => setWins(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">What went wrong? (Mistakes)</label>
                <textarea rows={3} placeholder="Describe stumbling blocks, incorrect code, or weak explanations..." value={mistakes} onChange={(e) => setMistakes(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action items / What to review next</label>
                <textarea rows={2} placeholder="e.g. Study Redux selectors, practice behavioral storytelling..." value={nextActions} onChange={(e) => setNextActions(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAdd(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black hover:bg-slate-900 text-white text-sm font-semibold rounded">Save Reflection</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
