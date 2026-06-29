import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  useGetHistoryQuery, 
  useGetHistoryDetailsQuery, 
  useDeleteHistoryMutation 
} from '../store/services/historyApi';
import { 
  Loader2, 
  Search, 
  Calendar, 
  Award, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  MessageSquare, 
  User, 
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  History
} from 'lucide-react';

export const InterviewHistory: React.FC = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [interviewType, setInterviewType] = useState<string>('');
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Build the filter params for RTK Query
  const params: any = {
    page,
    pageSize: 10,
    ...(interviewType ? { interviewType } : {}),
    ...(minScore ? { minScore } : {}),
    ...(maxScore ? { maxScore } : {}),
    ...(startDate ? { startDate: new Date(startDate).toISOString() } : {}),
    ...(endDate ? { endDate: new Date(endDate).toISOString() } : {}),
    ...(search ? { search } : {})
  };

  const { data, error, isLoading, isFetching } = useGetHistoryQuery(params);
  const [deleteHistory, { isLoading: isDeleting }] = useDeleteHistoryMutation();

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.pagination?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteSessionId) {
      try {
        await deleteHistory(deleteSessionId).unwrap();
        setDeleteSessionId(null);
      } catch (err) {
        console.error('Failed to delete history item:', err);
      }
    }
  };

  const getPerformanceTier = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 70) return { label: 'Good', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (score >= 50) return { label: 'Needs Work', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Poor', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  const getStatus = (score: number | null, dateStr: string) => {
    if (score !== null) return { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    const date = new Date(dateStr);
    const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return { label: 'Incomplete', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { label: 'Abandoned', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Interview History</h1>
          <p className="text-slate-500 text-sm">Review, analyze, and learn from all your past AI mock interviews.</p>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search role or company..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Type filter */}
          <select
            value={interviewType}
            onChange={(e) => { setInterviewType(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
          >
            <option value="">All Interview Types</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="system design">System Design</option>
          </select>

          {/* Score Range Filters */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min Score"
              value={minScore}
              onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="number"
              placeholder="Max Score"
              value={maxScore}
              onChange={(e) => { setMaxScore(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Date range filters */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* GRID LAYOUT / SPINNER */}
      {isLoading || isFetching ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-slate-500 text-sm">Fetching history...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Error loading history records. Please try again.</span>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          <History className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">No interviews found</h3>
          <p className="text-slate-500 text-sm max-w-sm mt-1">Adjust your filter options or practice a new mock interview session to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.items.map((item: any) => {
              const status = getStatus(item.overallScore, item.createdAt);
              const tier = item.overallScore !== null ? getPerformanceTier(item.overallScore) : null;
              
              return (
                <div 
                  key={item.id} 
                  className="bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-5 shadow-sm hover:shadow transition duration-150 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header info */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 capitalize">
                          {item.interviewType}
                        </span>
                        <h3 className="font-bold text-slate-900 text-lg mt-1">{item.position}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">{item.companyName || 'Unspecified Company'}</p>
                      </div>
                      
                      {/* Circular score gauge */}
                      {item.overallScore !== null ? (
                        <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 border border-slate-200 shadow-inner flex-shrink-0">
                          <span className="text-sm font-black text-slate-800">{item.overallScore}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">In Progress</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-4 items-center">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.durationMinutes} mins
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                    <div className="flex gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                      {tier && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}>
                          {tier.label}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {item.overallScore !== null && (
                        <button
                          onClick={() => router.push(`/ScorecardDetail?sessionId=${item.id}`)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition min-h-[44px] flex items-center"
                        >
                          View Scorecard
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedSessionId(item.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition min-h-[44px] flex items-center"
                      >
                        View Transcript
                      </button>
                      <button
                        onClick={() => setDeleteSessionId(item.id)}
                        className="p-2 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition min-h-[44px] flex items-center"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION CONTROLS */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500">
                Page <strong>{page}</strong> of <strong>{data.pagination.totalPages}</strong> ({data.pagination.totalItems} sessions)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition min-h-[44px] flex items-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.pagination.totalPages}
                  className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition min-h-[44px] flex items-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {selectedSessionId && (
        <SessionDetailModal 
          sessionId={selectedSessionId} 
          onClose={() => setSelectedSessionId(null)} 
          getPerformanceTier={getPerformanceTier}
        />
      )}

      {/* CONFIRMATION DELETION MODAL */}
      {deleteSessionId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <h3 className="font-bold text-slate-900 text-lg">Delete Session?</h3>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Are you sure you want to delete this interview record? This action will perform a soft delete and exclude this session from your history and analytics dashboards. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setDeleteSessionId(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold min-h-[44px] flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// DETAILS MODAL SUBCOMPONENT
interface DetailModalProps {
  sessionId: string;
  onClose: () => void;
  getPerformanceTier: (score: number) => { label: string; color: string };
}

const SessionDetailModal: React.FC<DetailModalProps> = ({ sessionId, onClose, getPerformanceTier }) => {
  const { data: session, isLoading, error } = useGetHistoryDetailsQuery(sessionId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Interview Report Details</span>
            </h2>
            {session && (
              <p className="text-slate-400 text-xs mt-0.5">
                Session ID: {session.id}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span className="text-slate-500 text-sm">Loading session details...</span>
            </div>
          ) : error || !session ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Failed to fetch session detail.</span>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Summary Header Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Position</span>
                  <div className="font-bold text-slate-800 text-sm">{session.position}</div>
                  <div className="text-xs text-slate-500">{session.companyName || 'Unspecified Company'}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Performance</span>
                  <div className="flex items-center gap-2">
                    {session.overallScore !== null ? (
                      <>
                        <div className="text-lg font-black text-slate-900">{session.overallScore}%</div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getPerformanceTier(session.overallScore).color}`}>
                          {getPerformanceTier(session.overallScore).label}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Ungraded Session</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Session Duration</span>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{session.durationMinutes} minutes</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Type & Flow</span>
                  <div className="text-xs font-bold text-slate-800 flex flex-wrap gap-1">
                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded capitalize">
                      {session.interviewType}
                    </span>
                    {session.voiceEnabled && (
                      <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Voice Enabled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verdict Banner */}
              {session.verdict && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  session.verdict === 'SELECTED' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Outcome verdict: {session.verdict}</div>
                      <p className="text-xs mt-0.5 opacity-90">{session.feedbackSummary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              {session.overallScore !== null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Demonstrated Strengths</span>
                    </h3>
                    <ul className="text-xs text-slate-600 space-y-2 pl-4 list-disc">
                      {session.strengths.map((str: string, idx: number) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-amber-800 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Areas for Improvement</span>
                    </h3>
                    <ul className="text-xs text-slate-600 space-y-2 pl-4 list-disc">
                      {session.weaknesses.map((weak: string, idx: number) => (
                        <li key={idx}>{weak}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Timeline Transcript */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-lg">Interview Transcript Timeline</h3>
                
                <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-6">
                  {session.transcript.map((msg: any, idx: number) => {
                    const isInterviewer = msg.role === 'interviewer';
                    
                    return (
                      <div key={idx} className="relative">
                        {/* Timeline bubble bullet */}
                        <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow ${
                          isInterviewer ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                        }`}>
                          {isInterviewer ? <MessageSquare className="w-1.5 h-1.5" /> : <User className="w-1.5 h-1.5" />}
                        </span>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                              {isInterviewer ? 'Interviewer' : 'Candidate'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold min-h-[44px]"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};

export default InterviewHistory;
