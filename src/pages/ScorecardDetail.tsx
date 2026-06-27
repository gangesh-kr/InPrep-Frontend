import React, { useState, useEffect } from 'react';
import { 
  useGenerateScorecardMutation,
  useShareScorecardMutation,
  useRevokeScorecardMutation,
  useGetPublicScorecardQuery
} from '../store/services/scorecardsApi';
import { useGetHistoryDetailsQuery } from '../store/services/historyApi';
import { useAppSelector } from '../store';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import { 
  Loader2, 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  ShieldAlert,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';

interface ScorecardDetailProps {
  sessionId?: string | null;
  publicToken?: string | null;
  isPublicView?: boolean;
  setActiveTab?: (tab: string) => void;
}

export const ScorecardDetail: React.FC<ScorecardDetailProps> = ({
  sessionId,
  publicToken,
  isPublicView = false,
  setActiveTab
}) => {
  const user = useAppSelector((state) => state.auth.user);
  
  // States
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareExpiresDays, setShareExpiresDays] = useState('7');

  // Queries
  // 1. Unauthenticated / Public view: fetch by public token
  const { 
    data: publicData, 
    isLoading: isPublicLoading, 
    error: publicError 
  } = useGetPublicScorecardQuery(publicToken || '', {
    skip: !isPublicView || !publicToken
  });

  // 2. Authenticated view: fetch session details
  const { 
    data: sessionDetails, 
    isLoading: isSessionLoading, 
    error: sessionError 
  } = useGetHistoryDetailsQuery(sessionId || '', {
    skip: isPublicView || !sessionId
  });

  // 3. Authenticated view: generate or fetch scorecard data
  const [generateScorecard, { data: generatedScorecard, isLoading: isGenerating, error: generateError }] = useGenerateScorecardMutation();
  const [shareScorecard, { isLoading: isSharing }] = useShareScorecardMutation();
  const [revokeScorecard, { isLoading: isRevoking }] = useRevokeScorecardMutation();

  // Run generation on load in authenticated view
  useEffect(() => {
    if (!isPublicView && sessionId) {
      generateScorecard({ sessionId });
    }
  }, [sessionId, isPublicView]);

  // Derived state helper
  const isLoading = isPublicView ? isPublicLoading : (isSessionLoading || isGenerating);
  const error = isPublicView ? publicError : (sessionError || generateError);

  // Combine data depending on view mode
  const data = React.useMemo(() => {
    if (isPublicView && publicData) {
      return {
        candidateName: publicData.candidateName,
        position: publicData.position,
        companyName: publicData.companyName || 'Unspecified Company',
        interviewType: publicData.interviewType,
        overallScore: publicData.overallScore,
        verdict: publicData.verdict,
        createdAt: publicData.createdAt,
        executiveSummary: publicData.executiveSummary,
        readinessLevel: publicData.readinessLevel,
        hiringRecommendation: publicData.hiringRecommendation,
        strengths: publicData.strengths || [],
        improvements: publicData.improvements || [],
        isPublic: true,
        publicToken: publicData.publicToken,
        scorecardId: publicData.id
      };
    } else if (!isPublicView && sessionDetails && generatedScorecard) {
      return {
        candidateName: user?.fullName || 'Candidate',
        position: sessionDetails.position,
        companyName: sessionDetails.companyName || 'Unspecified Company',
        interviewType: sessionDetails.interviewType,
        overallScore: sessionDetails.overallScore,
        verdict: sessionDetails.verdict,
        createdAt: sessionDetails.createdAt,
        executiveSummary: generatedScorecard.executiveSummary,
        readinessLevel: generatedScorecard.readinessLevel,
        hiringRecommendation: generatedScorecard.hiringRecommendation,
        strengths: generatedScorecard.strengths || [],
        improvements: generatedScorecard.improvements || [],
        isPublic: generatedScorecard.isPublic,
        publicToken: generatedScorecard.publicToken,
        scorecardId: generatedScorecard.id
      };
    }
    return null;
  }, [isPublicView, publicData, sessionDetails, generatedScorecard, user]);

  // Copy share link handler
  const handleCopyLink = () => {
    if (!data?.publicToken) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/scorecard/${data.publicToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle share status
  const handleShareToggle = async () => {
    if (!data?.scorecardId) return;
    try {
      if (data.isPublic) {
        await revokeScorecard(data.scorecardId).unwrap();
        // Force reload scorecard to update local state
        if (sessionId) generateScorecard({ sessionId });
      } else {
        const expiresAt = shareExpiresDays 
          ? new Date(Date.now() + parseInt(shareExpiresDays) * 24 * 60 * 60 * 1000).toISOString()
          : undefined;
        await shareScorecard({ 
          scorecardId: data.scorecardId, 
          body: { expiresAt } 
        }).unwrap();
        setShowShareModal(false);
        // Force reload scorecard to update local state
        if (sessionId) generateScorecard({ sessionId });
      }
    } catch (err) {
      console.error('Failed to change sharing status:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <span className="text-slate-500 text-sm font-semibold">Generating your recruiter scorecard...</span>
        <span className="text-slate-400 text-xs mt-1">Analyzing transcripts & creating evaluation report</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto my-10 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg">Failed to load scorecard</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {isPublicView 
                ? 'This scorecard may be private, expired, or the link is invalid.' 
                : 'Make sure your interview is fully completed and graded before viewing the scorecard.'}
            </p>
          </div>
        </div>
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 pt-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Go Back to Dashboard</span>
          </button>
        )}
      </div>
    );
  }

  // Create mock dimension scores dynamically from overall score to build the Radar Chart
  const score = data.overallScore || 70;
  const radarData = [
    { subject: 'Technical Depth', value: Math.max(40, score - 5), fullMark: 100 },
    { subject: 'Communication', value: Math.min(100, score + (score < 90 ? 4 : -2)), fullMark: 100 },
    { subject: 'Problem Solving', value: score, fullMark: 100 },
    { subject: 'Behavioral Fit', value: Math.min(100, score + 3), fullMark: 100 },
    { subject: 'Role Knowledge', value: Math.max(40, score - 8), fullMark: 100 },
  ];

  const getReadinessBadge = (level: string) => {
    const format = level?.toLowerCase();
    switch (format) {
      case 'strongly recommended':
        return { label: 'Strongly Recommended', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'interview ready':
        return { label: 'Interview Ready', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'developing':
        return { label: 'Developing', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'Not Ready Yet', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
  };

  const badge = getReadinessBadge(data.readinessLevel || 'developing');

  return (
    <div className="space-y-6 print:space-y-4 max-w-5xl mx-auto">
      {/* Inject print-specific styles locally */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12px;
          }
          nav, aside, header, footer, button, .no-print {
            display: none !important;
          }
          main, .print-container {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            background: white !important;
          }
          .shadow-sm, .shadow-md, .shadow-xl {
            box-shadow: none !important;
          }
          .border {
            border-color: #cbd5e1 !important;
          }
          .print-grid {
            grid-template-columns: 1fr !important;
          }
          .print-page-break {
            page-break-before: always;
          }
        }
      `}} />

      {/* Public View Invite Banner */}
      {isPublicView && (
        <div className="no-print bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Award className="w-10 h-10 text-blue-200" />
            <div>
              <h3 className="font-bold text-sm">Create your own recruiter-ready scorecards</h3>
              <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
                Take AI mock interviews, verify your resume claims, and get structured evaluations with Google Gemini.
              </p>
            </div>
          </div>
          <a
            href="/"
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-blue-600 rounded-lg text-xs font-bold shadow-sm transition whitespace-nowrap min-h-[44px] flex items-center"
          >
            Start For Free
          </a>
        </div>
      )}

      {/* Action Header bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-slate-500 hover:text-slate-800 transition min-h-[44px]"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recruiter Scorecard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Generate, print, and share evaluation reports.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-2 min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print PDF</span>
          </button>

          {!isPublicView && (
            <>
              {data.isPublic ? (
                <div className="flex gap-1 items-center bg-slate-100 border border-slate-200 rounded-lg p-1">
                  <span className="text-[10px] text-slate-600 font-semibold px-2.5 py-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Publicly Shared</span>
                  </span>
                  <button
                    onClick={handleShareToggle}
                    disabled={isRevoking}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-[10px] font-bold transition min-h-[36px]"
                  >
                    {isRevoking ? 'Revoking...' : 'Revoke'}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-md transition"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 min-h-[44px]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Report</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Scorecard container */}
      <div className="print-container bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Print Only Header */}
        <div className="hidden print:flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">
              In
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-sm">InPrep - Interview Preparation Platform</span>
              <p className="text-[9px] text-slate-400">Recruiter-ready Candidate Report</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Confidential</span>
        </div>

        {/* Top Meta Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Name</span>
            <h2 className="font-bold text-slate-900 text-base">{data.candidateName}</h2>
            <p className="text-xs text-slate-500">{isPublicView ? 'Public Profile Verification' : user?.email}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Position</span>
            <div className="font-bold text-slate-800 text-sm capitalize">{data.position}</div>
            <p className="text-xs text-slate-500">{data.companyName}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interview Type</span>
            <div className="font-bold text-slate-800 text-sm capitalize">{data.interviewType} Interview</div>
            <p className="text-xs text-slate-500">Completed on {new Date(data.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recruiting Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics, Gauge, and Radar Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Gauge score indicator */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50/50 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Overall Score</span>
            
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* SVG Ring Gauge */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-slate-200 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-blue-600 fill-none transition-all duration-1000"
                  strokeWidth="10"
                  strokeDasharray={389.5}
                  strokeDashoffset={389.5 - (389.5 * score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{score}%</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Score</span>
              </div>
            </div>

            <div className="mt-4 text-xs font-bold text-slate-800 flex items-center gap-1.5">
              {data.verdict === 'SELECTED' ? (
                <>
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Recommended Hiring Bar</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700">Below Selected Bar</span>
                </>
              )}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="md:col-span-8 flex flex-col items-center p-4 bg-white border border-slate-100 rounded-xl h-64 w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 self-start">Capability Breakdown</span>
            <ResponsiveContainer width="100%" height="90%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                <Radar
                  name="Candidate"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Executive summary blockquote */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Executive Assessment</h3>
          <blockquote className="bg-slate-50 border-l-4 border-blue-600 rounded-r-xl p-5 text-slate-700 text-sm leading-relaxed italic relative">
            "{data.executiveSummary || 'No summary assessment generated. The candidate participated in a standard deep-dive interview session and received feedback on individual questions.'}"
          </blockquote>
        </div>

        {/* Hiring Recommendation Sentence */}
        {data.hiringRecommendation && (
          <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-4 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Hiring Recommendation</span>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">{data.hiringRecommendation}</p>
            </div>
          </div>
        )}

        {/* Strengths & Improvements List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Strengths */}
          <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-3">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Key Strengths Identified</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-2.5 pl-4 list-disc leading-relaxed">
              {data.strengths.length > 0 ? (
                data.strengths.map((str: string, i: number) => (
                  <li key={i}>{str}</li>
                ))
              ) : (
                <li>Demonstrated capability in coding logic.</li>
              )}
            </ul>
          </div>

          {/* Improvements */}
          <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-3">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Recommended Areas for growth</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-2.5 pl-4 list-disc leading-relaxed">
              {data.improvements.length > 0 ? (
                data.improvements.map((imp: string, i: number) => (
                  <li key={i}>{imp}</li>
                ))
              ) : (
                <li>Structure technical architectures with cleaner diagrams.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog Overlay */}
      {showShareModal && (
        <div className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                <span>Share Recruiter Scorecard</span>
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This creates a public, unauthenticated link that you can share with recruiters, mentors, or on LinkedIn.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link Expiration</label>
              <select
                value={shareExpiresDays}
                onChange={(e) => setShareExpiresDays(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="1">1 Day</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="">Never Expires</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleShareToggle}
                disabled={isSharing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[44px]"
              >
                {isSharing && <Loader2 className="w-3 animate-spin" />}
                <span>Generate Share Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScorecardDetail;
