import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  useGetTrendsQuery, 
  useGetScoreBreakdownQuery, 
  useGetActivityQuery 
} from '../store/services/analyticsApi';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import { 
  Loader2, 
  TrendingUp, 
  Award, 
  Calendar, 
  Flame, 
  Play, 
  AlertCircle 
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useGetTrendsQuery({ timeframe });
  const { data: breakdownData, isLoading: breakdownLoading, error: breakdownError } = useGetScoreBreakdownQuery({});
  const { data: activityData, isLoading: activityLoading, error: activityError } = useGetActivityQuery({});

  const [streak, setStreak] = useState(0);

  // Calculate Streak on the frontend from the activity heatmap data
  useEffect(() => {
    if (activityData && Array.isArray(activityData)) {
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      
      // Sort activity from most recent (today) backwards
      const sortedActivity = [...activityData].sort((a, b) => b.date.localeCompare(a.date));
      
      // Find today's index
      const todayIdx = sortedActivity.findIndex(a => a.date === today);
      
      if (todayIdx !== -1) {
        let idx = todayIdx;
        
        // If today has 0, check if yesterday had > 0 to keep streak alive
        if (sortedActivity[idx].count === 0 && idx + 1 < sortedActivity.length && sortedActivity[idx + 1].count > 0) {
          idx = idx + 1; // start from yesterday
        }

        while (idx < sortedActivity.length && sortedActivity[idx].count > 0) {
          currentStreak++;
          idx++;
        }
      }
      setStreak(currentStreak);
    }
  }, [activityData]);

  const isLoading = trendsLoading || breakdownLoading || activityLoading;
  const isError = trendsError || breakdownError || activityError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-slate-500 text-sm">Loading analytics dashboard...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load analytics dashboard data. Please try again.</span>
      </div>
    );
  }

  const hasNoSessions = !trendsData || trendsData.stats.totalSessions === 0;

  if (hasNoSessions) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
        <Award className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="font-bold text-slate-900 text-2xl">No Performance History Yet</h2>
        <p className="text-slate-500 text-sm max-w-sm mt-2 mb-6 leading-relaxed">
          Complete at least one mock interview session to unlock your improvement analytics, score trends, and weakness profiling.
        </p>
        <button
          onClick={() => router.push('/ai-interviewer')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Practice Your First Session</span>
        </button>
      </div>
    );
  }

  // Format activity data for calendar rendering
  // Heatmap Calendar Grid details:
  // Render 52 weeks (365 days).
  // Standard calendars have 7 rows (Sunday-Saturday) and 53 columns.
  // We chunk the activityData into weeks of 7 days.
  const chunkedWeeks: any[][] = [];
  if (activityData && Array.isArray(activityData)) {
    // Fill first partial week if needed, but simple partitioning works:
    for (let i = 0; i < activityData.length; i += 7) {
      chunkedWeeks.push(activityData.slice(i, i + 7));
    }
  }

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count === 1) return 'bg-blue-200';
    if (count === 2) return 'bg-blue-400';
    return 'bg-blue-700'; // 3+ completed sessions
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Performance Trajectory</h1>
        <p className="text-slate-500 text-sm">Detailed aggregates and trends tracking your mock interview preparations.</p>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Practice</span>
            <div className="text-2xl font-bold text-slate-900">{trendsData.stats.totalSessions} sessions</div>
            <span className="text-[10px] text-slate-500">Across selected timeframe</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Average Score</span>
            <div className="text-2xl font-bold text-slate-900">{trendsData.stats.averageScore}%</div>
            {trendsData.stats.weekOverWeekImprovement !== 0 ? (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                trendsData.stats.weekOverWeekImprovement > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendsData.stats.weekOverWeekImprovement > 0 ? '+' : ''}{trendsData.stats.weekOverWeekImprovement}% WoW
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Stable level</span>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Best Score</span>
            <div className="text-2xl font-bold text-slate-900">{trendsData.stats.bestScore}%</div>
            <span className="text-[10px] text-slate-500">Top assessment level</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Practice Streak</span>
            <div className="text-2xl font-bold text-slate-900">{streak} Days</div>
            <span className="text-[10px] text-orange-600 font-semibold flex items-center gap-0.5">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> Keep practicing!
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-current" />
          </div>
        </div>

      </div>

      {/* CHART ROW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trajectory Line Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Score Growth Trajectory</h3>
            
            {/* Timeframe tab selector */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['7d', '30d', '90d', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    timeframe === t 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0F172A' }}
                />
                <ReferenceLine y={trendsData.stats.averageScore} stroke="#2563EB" strokeDasharray="3 3" label={{ value: `Avg: ${trendsData.stats.averageScore}%`, fill: '#2563EB', fontSize: 10, position: 'top' }} />
                <Line type="monotone" dataKey="score" name="Overall Score" stroke="#2563EB" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dimension Radar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">Performance Dimensions</h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={breakdownData || []}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="dimension" stroke="#64748B" fontSize={11} fontWeight="bold" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" fontSize={9} />
                <Radar name="Average Score" dataKey="score" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.4} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* HEATMAP CALENDAR ROW */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Preparation Heatmap</h3>
            <p className="text-slate-500 text-xs mt-0.5">Consistency metric checking completed sessions in the last 365 days.</p>
          </div>
          {/* Heatmap Legend */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>Less</span>
            <span className="w-2.5 h-2.5 bg-slate-100 rounded-sm border border-slate-200" />
            <span className="w-2.5 h-2.5 bg-blue-200 rounded-sm border border-blue-300" />
            <span className="w-2.5 h-2.5 bg-blue-400 rounded-sm border border-blue-400" />
            <span className="w-2.5 h-2.5 bg-blue-700 rounded-sm" />
            <span>More</span>
          </div>
        </div>

        {/* Custom Calendar heatmap grid */}
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-[700px] py-2">
            {/* Render weeks */}
            {chunkedWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className={`w-3.5 h-3.5 rounded-sm flex-shrink-0 cursor-pointer ${getHeatmapColor(day.count)}`}
                    title={`${day.date}: ${day.count} sessions completed`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
