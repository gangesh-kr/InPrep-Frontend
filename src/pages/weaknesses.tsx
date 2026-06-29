import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  useGetWeaknessProfileQuery, 
  useRefreshWeaknessProfileMutation 
} from '../store/services/weaknessApi';
import { useAppSelector } from '../store';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Loader2, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Cpu
} from 'lucide-react';

export const WeaknessAnalysis: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id || '';

  const { data: profile, isLoading, error, refetch } = useGetWeaknessProfileQuery({});
  const [refreshProfile, { isLoading: isRefreshing }] = useRefreshWeaknessProfileMutation();

  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});

  // 1. Cooldown countdown effect
  useEffect(() => {
    if (profile && !profile.needsMoreData && profile.lastAnalyzedAt) {
      const lastAnalyzed = new Date(profile.lastAnalyzedAt).getTime();
      const nextAllowed = lastAnalyzed + 24 * 60 * 60 * 1000;
      const calculateCooldown = () => {
        const remaining = Math.max(0, Math.round((nextAllowed - Date.now()) / 1000));
        setCooldownSeconds(remaining);
      };
      calculateCooldown();
      const timer = setInterval(calculateCooldown, 1000);
      return () => clearInterval(timer);
    }
  }, [profile]);

  // 2. Load Checklist state from localStorage
  useEffect(() => {
    if (profile && !profile.needsMoreData && profile.topics) {
      const loaded: { [key: string]: boolean } = {};
      profile.topics.forEach((topic: any) => {
        topic.recommendations.forEach((_rec: string, idx: number) => {
          const key = `inprep_weakness_${userId}_${topic.name}_${idx}`;
          loaded[key] = localStorage.getItem(key) === 'true';
        });
      });
      setChecklist(loaded);
    }
  }, [profile, userId]);

  const toggleChecklist = (topicName: string, index: number) => {
    const key = `inprep_weakness_${userId}_${topicName}_${index}`;
    const newState = !checklist[key];
    setChecklist(prev => ({ ...prev, [key]: newState }));
    localStorage.setItem(key, String(newState));
  };

  const handleRefresh = async () => {
    if (cooldownSeconds === 0 && !isRefreshing) {
      try {
        await refreshProfile({}).unwrap();
      } catch (err) {
        console.error('Failed to refresh weakness profile:', err);
      }
    }
  };

  const formatCooldown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    return `${hours}h ${mins}m ${remainingSecs}s`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-slate-500 text-sm">Running weakness identification model...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
        <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load weakness analysis. Please complete more sessions.</span>
      </div>
    );
  }

  // Handle Needs More Data State
  if (profile?.needsMoreData) {
    const completed = profile.sessionsCompleted || 0;
    const required = profile.sessionsRequired || 3;
    const progressPercent = Math.min(100, Math.round((completed / required) * 100));

    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="relative flex items-center justify-center w-28 h-28 mx-auto">
          {/* Progress Ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="56" cy="56" r="48" stroke="#E2E8F0" strokeWidth="8" fill="transparent" />
            <circle cx="56" cy="56" r="48" stroke="#2563EB" strokeWidth="8" fill="transparent"
              strokeDasharray={301.6}
              strokeDashoffset={301.6 - (301.6 * progressPercent) / 100}
            />
          </svg>
          <div className="absolute font-black text-xl text-slate-800">{completed} / {required}</div>
        </div>

        <div className="space-y-2">
          <h2 className="font-bold text-slate-900 text-2xl">Surfacing Weak Topics...</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Our LLM scanner parses your mock interview transcripts to identify structural weaknesses, conceptual gaps, and study goals. Complete <strong>{required - completed} more</strong> session{required - completed > 1 ? 's' : ''} to generate your weakness report.
          </p>
        </div>

        <button
          onClick={() => router.push('/ai-interviewer')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-md min-h-[44px]"
        >
          Complete Mock Interview
        </button>
      </div>
    );
  }

  // Sort topics by severity: critical first, then moderate, then minor
  const severityOrder: { [key: string]: number } = { critical: 1, moderate: 2, minor: 3 };
  const sortedTopics = [...(profile.topics || [])].sort((a: any, b: any) => {
    return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
  });

  const getSeverityBadgeColor = (severity: string) => {
    if (severity === 'critical') return 'bg-red-50 text-red-700 border-red-200';
    if (severity === 'moderate') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getBarColor = (severity: string) => {
    if (severity === 'critical') return '#EF4444';
    if (severity === 'moderate') return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Weak Topic Profiling</h1>
          <p className="text-slate-500 text-sm">
            AI-identified conceptual weaknesses across your last {profile.sessionCount} interview sessions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile.lastAnalyzedAt && (
            <span className="text-slate-400 text-xs font-medium">
              Analyzed: {new Date(profile.lastAnalyzedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={cooldownSeconds > 0 || isRefreshing}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 rounded-lg text-xs font-bold transition shadow-sm min-h-[44px]"
          >
            {isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>
              {cooldownSeconds > 0 
                ? `Cooldown: ${formatCooldown(cooldownSeconds)}`
                : 'Refresh Analysis'}
            </span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL BAR CHART VISUAL SUMMARY */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Weakness Frequency & Severity Index</h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sortedTopics}
              margin={{ top: 10, right: 10, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} label={{ value: 'Sessions Affected', position: 'bottom', offset: -5, fontSize: 10 }} />
              <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} width={120} />
              <Tooltip 
                contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="frequency" name="Sessions Present" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                {sortedTopics.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.severity)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOPICS DETAIL LIST CARD */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-lg">Actionable Improvement Plans</h3>
        
        <div className="space-y-5">
          {sortedTopics.map((topic: any, tIdx: number) => (
            <div 
              key={tIdx}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition duration-150 space-y-4"
            >
              <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-900 text-base">{topic.name}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getSeverityBadgeColor(topic.severity)}`}>
                      {topic.severity}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs italic">
                    Affects {topic.frequency} completed mock interview session{topic.frequency > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3">
                {/* Description */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Knowledge Gap Description</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {topic.description}
                  </p>
                </div>

                {/* Recommendations Checklist */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Study Recommendations Checklist</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topic.recommendations.map((rec: string, rIdx: number) => {
                      const key = `inprep_weakness_${userId}_${topic.name}_${rIdx}`;
                      const isTicked = !!checklist[key];
                      
                      return (
                        <button
                          key={rIdx}
                          onClick={() => toggleChecklist(topic.name, rIdx)}
                          className={`flex items-start gap-3 p-3 border rounded-lg text-left transition duration-150 focus:outline-none min-h-[44px] ${
                            isTicked 
                              ? 'bg-slate-50 border-slate-200 text-slate-400' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:bg-blue-50/10'
                          }`}
                        >
                          <span className="mt-0.5 flex-shrink-0">
                            {isTicked ? (
                              <CheckSquare className="w-4 h-4 text-slate-400 fill-current" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </span>
                          <span className={`text-xs leading-tight font-medium ${isTicked ? 'line-through' : ''}`}>
                            {rec}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// Simple inline AlertCircleIcon subcomponent to satisfy Typescript
const AlertCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

export default WeaknessAnalysis;
