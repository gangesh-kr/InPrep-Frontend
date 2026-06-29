import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import type { AnalyticsSummary, Weakness, SkillDistribution, HeatmapItem, Application, AIInterview } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import { 
  Award, 
  Briefcase, 
  Percent, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  Play,
  Code,
  Terminal,
  Trash2,
  Loader2,
  Minimize2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  History,
  BookOpen,
  Search,
  Bell,
  User as UserIcon,
  Calendar,
  CheckCircle2,
  Compass,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { useAppSelector } from '../store';
import { useGetDashboardFeedQuery } from '../store/services/analyticsApi';
import { useToggleTaskMutation } from '../store/services/learningPlanApi';
import { useRouter } from 'next/router';
import Link from 'next/link';

const highlightCode = (code: string, lang: 'javascript' | 'python') => {
  if (!code) return '';
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (lang === 'javascript') {
    const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|export|import|from|new|this|typeof|instanceof|try|catch|finally|throw|async|await)\b)|(\b(?:console|log|warn|error|window|document|JSON|Math)\b)|(\b\d+\b)|(\b\w+(?=\s*\())/g;

    html = html.replace(tokenRegex, (match, comment, string, keyword, builtin, number, func) => {
      if (comment) return `<span class="text-slate-500 italic">${match}</span>`;
      if (string) return `<span class="text-emerald-650 font-medium">${match}</span>`;
      if (keyword) return `<span class="text-blue-650 font-semibold">${match}</span>`;
      if (builtin) return `<span class="text-sky-650 font-semibold">${match}</span>`;
      if (number) return `<span class="text-amber-600">${match}</span>`;
      if (func) return `<span class="text-violet-600">${match}</span>`;
      return match;
    });
  } else {
    const tokenRegex = /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:def|class|return|if|elif|else|for|while|break|continue|in|is|not|and|or|import|from|as|try|except|finally|raise|with|lambda|pass|global|nonlocal|assert|yield)\b)|(\b(?:print|len|range|str|int|float|list|dict|set|tuple|sum|min|max|abs)\b)|(\b\d+\b)|(\b\w+(?=\s*\())/g;

    html = html.replace(tokenRegex, (match, comment, string, keyword, builtin, number, func) => {
      if (comment) return `<span class="text-slate-500 italic">${match}</span>`;
      if (string) return `<span class="text-emerald-650 font-medium">${match}</span>`;
      if (keyword) return `<span class="text-blue-650 font-semibold">${match}</span>`;
      if (builtin) return `<span class="text-sky-650 font-semibold">${match}</span>`;
      if (number) return `<span class="text-amber-600">${match}</span>`;
      if (func) return `<span class="text-violet-600">${match}</span>`;
      return match;
    });
  }
  return html;
};

export const Dashboard: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  // States for stats & tables
  const { data: feed, isLoading } = useGetDashboardFeedQuery({});
  const [toggleTask] = useToggleTaskMutation();
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [activeWeekNum, setActiveWeekNum] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive values from feed cache
  const summary = feed?.summary || null;
  const weaknesses = feed?.weaknesses || [];
  const skills = feed?.skills || [];
  const heatmap = feed?.heatmap || [];
  const applications = feed?.applications || [];
  const latestInterview = feed?.history?.items?.[0] || null;
  const historyCount = feed?.history?.items?.filter((item: any) => item.overallScore !== null).length || 0;
  const miniTrends = feed?.trends?.trends || [];
  const learningPlanData = feed?.learningPlan || null;

  useEffect(() => {
    if (feed?.learningPlan) {
      const planData = feed.learningPlan;
      if (planData.generatedPlan && planData.generatedPlan.weeks) {
        const weeks = planData.generatedPlan.weeks;
        const activeWeek = weeks[0];
        if (activeWeek) {
          setWeeklyTasks(activeWeek.dailyTasks || []);
          setActiveWeekNum(activeWeek.weekNumber || 1);
          
          const tasks = activeWeek.dailyTasks || [];
          if (tasks.length > 0) {
            const completed = tasks.filter((t: any) => t.completed).length;
            setWeeklyProgress(Math.round((completed / tasks.length) * 100));
          }
        }
      }
    }
  }, [feed]);

  // Playground states
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [playgroundLanguage, setPlaygroundLanguage] = useState<'javascript' | 'python'>('javascript');
  const [playgroundCode, setPlaygroundCode] = useState('// Write your JavaScript code here...\nconsole.log("Hello, World!");\n');
  const [playgroundOutput, setPlaygroundOutput] = useState<string[]>([]);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Sync template code on language swap
  useEffect(() => {
    if (playgroundLanguage === 'javascript') {
      if (playgroundCode === '' || playgroundCode.startsWith('# Write your Python')) {
        setPlaygroundCode('// Write your JavaScript code here...\nconsole.log("Hello, World!");\n');
      }
    } else {
      if (playgroundCode === '' || playgroundCode.startsWith('// Write your JavaScript')) {
        setPlaygroundCode('# Write your Python code here...\nprint("Hello, World!")\n');
      }
    }
  }, [playgroundLanguage]);

  // Pyodide WebAssembly Loader helper
  const loadPyodideIfNeeded = async (): Promise<any> => {
    const globalWindow = window as any;
    if (globalWindow.pyodideInstance) {
      return globalWindow.pyodideInstance;
    }
    
    if (globalWindow.loadPyodide) {
      setIsLoadingPyodide(true);
      try {
        globalWindow.pyodideInstance = await globalWindow.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
        });
        return globalWindow.pyodideInstance;
      } finally {
        setIsLoadingPyodide(false);
      }
    }

    setIsLoadingPyodide(true);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
      script.onload = async () => {
        try {
          globalWindow.pyodideInstance = await globalWindow.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
          });
          resolve(globalWindow.pyodideInstance);
        } catch (e) {
          reject(e);
        } finally {
          setIsLoadingPyodide(false);
        }
      };
      script.onerror = () => {
        setIsLoadingPyodide(false);
        reject(new Error("Failed to load Pyodide script from CDN."));
      };
      document.head.appendChild(script);
    });
  };

  // JavaScript sandbox execution runner
  const runJavaScriptCode = (code: string) => {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };
    console.warn = (...args) => {
      logs.push(`[Warn] ` + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };
    console.error = (...args) => {
      logs.push(`[Error] ` + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    try {
      const evalFn = new Function(code);
      const result = evalFn();
      if (result !== undefined) {
        logs.push(`=> Return value: ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`);
      }
    } catch (err: any) {
      logs.push(`Runtime Error: ${err.message}`);
    }

    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;

    setPlaygroundOutput(logs.length > 0 ? logs : ["(Execution succeeded with no console logs)"]);
  };

  // Python WebAssembly execution runner
  const runPythonCode = async (code: string) => {
    const logs: string[] = [];
    setIsRunningCode(true);
    try {
      const pyodide = await loadPyodideIfNeeded();
      
      pyodide.setStdout({
        write: (buffer: any) => {
          const text = typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer);
          const lines = text.split('\n');
          lines.forEach(line => {
            if (line.trim() || line === '') {
              logs.push(line);
            }
          });
          return text.length;
        }
      });
      
      pyodide.setStderr({
        write: (buffer: any) => {
          const text = typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer);
          logs.push(`Stderr: ${text}`);
          return text.length;
        }
      });

      const result = await pyodide.runPythonAsync(code);
      if (result !== undefined && String(result) !== 'None') {
        logs.push(`=> Return value: ${String(result)}`);
      }
    } catch (err: any) {
      logs.push(`Python Runtime Error: ${err.message}`);
    } finally {
      setIsRunningCode(false);
      const cleanedLogs = logs.filter((log, idx) => !(log === '' && idx === logs.length - 1));
      setPlaygroundOutput(cleanedLogs.length > 0 ? cleanedLogs : ["(Execution succeeded with no print output)"]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    if (e.key === 'Tab') {
      e.preventDefault();
      const tabStr = '  ';
      const newValue = value.substring(0, selectionStart) + tabStr + value.substring(selectionEnd);
      setPlaygroundCode(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + tabStr.length;
      }, 0);
      return;
    }

    const closeChars = [')', ']', '}', '"', "'", '`'];
    if (closeChars.includes(e.key) && selectionStart === selectionEnd && value[selectionStart] === e.key) {
      e.preventDefault();
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      }, 0);
      return;
    }

    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closingChar = pairs[e.key];
      const selection = value.substring(selectionStart, selectionEnd);
      const newValue = value.substring(0, selectionStart) + e.key + selection + closingChar + value.substring(selectionEnd);
      
      setPlaygroundCode(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1 + selection.length;
      }, 0);
      return;
    }

    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
      const charBefore = value[selectionStart - 1];
      const charAfter = value[selectionStart];
      const matchingPairs: Record<string, string> = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'",
        '`': '`'
      };
      if (matchingPairs[charBefore] === charAfter) {
        e.preventDefault();
        const newValue = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1);
        setPlaygroundCode(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
        }, 0);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const lines = value.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      const match = currentLine.match(/^(\s*)/);
      let indent = match ? match[1] : '';
      
      const trimmedLine = currentLine.trim();
      const extraIndent = (trimmedLine.endsWith('{') || trimmedLine.endsWith(':')) ? '  ' : '';
      
      const insertText = '\n' + indent + extraIndent;
      const newValue = value.substring(0, selectionStart) + insertText + value.substring(selectionEnd);
      setPlaygroundCode(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + insertText.length;
      }, 0);
      return;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const container = textarea.parentElement;
    if (container) {
      const pre = container.querySelector('pre') as HTMLPreElement;
      if (pre) {
        pre.scrollTop = textarea.scrollTop;
        pre.scrollLeft = textarea.scrollLeft;
      }
    }
  };

  const handleRunCode = async () => {
    setPlaygroundOutput(["Running execution..."]);
    if (playgroundLanguage === 'javascript') {
      runJavaScriptCode(playgroundCode);
    } else {
      try {
        await runPythonCode(playgroundCode);
      } catch (e: any) {
        setPlaygroundOutput([`Pyodide Load Error: ${e.message}`]);
      }
    }
  };

  // Removed manual fetchDashboardData - now handled by useGetDashboardFeedQuery

  const handleToggleTask = async (weekNumber: number, dayOfWeek: string, taskIndex: number) => {
    const updatedTasks = weeklyTasks.map((t: any, idx: number) => {
      if (t.day.toLowerCase() === dayOfWeek.toLowerCase() && idx === taskIndex) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    setWeeklyTasks(updatedTasks);
    
    const completedCount = updatedTasks.filter((t: any) => t.completed).length;
    setWeeklyProgress(Math.round((completedCount / updatedTasks.length) * 100));

    try {
      await toggleTask({ weekNumber, dayOfWeek, taskIndex }).unwrap();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const nextRound = React.useMemo(() => {
    let next: any = null;
    let earliestTime = Infinity;

    for (const app of applications) {
      if (app.rounds) {
        for (const round of app.rounds) {
          if (round.status?.toLowerCase() === 'scheduled' && round.scheduledAt) {
            const time = new Date(round.scheduledAt).getTime();
            if (time > Date.now() && time < earliestTime) {
              earliestTime = time;
              next = {
                companyName: app.company?.name || 'Unknown',
                position: app.position,
                roundType: round.roundType,
                scheduledAt: round.scheduledAt
              };
            }
          }
        }
      }
    }
    return next;
  }, [applications]);

  const upcomingSessionsList = React.useMemo(() => {
    const list: any[] = [];
    for (const app of applications) {
      if (app.rounds) {
        for (const round of app.rounds) {
          if (round.status?.toLowerCase() === 'scheduled' && round.scheduledAt) {
            list.push({
              id: round.id,
              companyName: app.company?.name || 'Unknown',
              position: app.position,
              roundType: round.roundType,
              scheduledAt: round.scheduledAt
            });
          }
        }
      }
    }
    return list
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3);
  }, [applications]);

  const latestScore = latestInterview?.overallScore || 0;
  const communicationScore = latestScore ? Math.min(100, latestScore + (latestScore < 90 ? 4 : -2)) : 0;
  const technicalScore = latestScore ? Math.max(40, latestScore - 5) : 0;
  const behavioralScore = latestScore ? Math.min(100, latestScore + 3) : 0;
  const confidenceScore = latestScore ? Math.max(40, latestScore - 2) : 0;

  const scoreText = latestScore >= 85 ? 'Excellent!' : latestScore >= 70 ? 'Good Progress' : latestScore >= 50 ? 'Developing' : 'Needs Practice';
  const scoreColor = latestScore >= 85 ? 'text-emerald-600 border-emerald-500 bg-emerald-50' : latestScore >= 70 ? 'text-blue-600 border-blue-500 bg-blue-50' : 'text-amber-600 border-amber-400 bg-amber-50';

  if (!mounted || (isLoading && !feed)) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="font-semibold text-sm">Loading dashboard details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Bar Header with profile indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Alex'}! 👋
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Let's ace your next interview.</p>
        </div>
        
        {/* Search, Notifications, and Profile Pill */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search mockups, logs..." 
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <button className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-500 transition relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-semibold text-[10px] text-slate-800 leading-none">{user?.fullName || 'Alex R.'}</span>
              <span className="text-[8px] text-slate-400 font-medium">Premium User</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Next Interview */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border border-blue-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1.5 overflow-hidden pr-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Next Interview</span>
            {nextRound ? (
              <>
                <h4 className="font-bold text-slate-900 text-sm truncate leading-snug">
                  {nextRound.position} @ {nextRound.companyName}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(nextRound.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                    {new Date(nextRound.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h4 className="font-semibold text-slate-800 text-xs leading-snug">No interviews scheduled</h4>
                <Link href="/ai-interviewer" className="text-[10px] text-blue-600 hover:text-blue-800 font-bold block mt-1 transition">
                  Start Mock Interview &rarr;
                </Link>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Interviews Completed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Interviews Completed</span>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">{historyCount}</div>
            <span className="text-[9px] text-slate-500 font-medium">AI-graded sessions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Average Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Avg Score</span>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">
              {summary?.readinessScore || 0}%
            </div>
            <span className="text-[9px] text-blue-600 font-semibold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> Overall Readiness
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Practice */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Practice</span>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">
              {(historyCount * 0.75).toFixed(1)} hrs
            </div>
            <span className="text-[9px] text-slate-500 font-medium">Estimated study time</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
            <History className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Middle Row: Latest Mock Interview & Weekly Study Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card A: Latest Mock Interview Evaluation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Latest Mock Interview</h3>
              {latestInterview && (
                <button 
                  onClick={() => {
                    localStorage.setItem('inprep_selected_scorecard_session_id', latestInterview.id);
                    router.push('/history');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                >
                  <span>Results</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              )}
            </div>

            {latestInterview ? (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                
                {/* Circular Score display */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-center">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" className="stroke-slate-200 fill-none" strokeWidth="6" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        className={`fill-none stroke-blue-600 transition-all duration-1000`} 
                        strokeWidth="7" 
                        strokeDasharray={301.6} 
                        strokeDashoffset={301.6 - (301.6 * latestScore) / 100} 
                        strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-900">{latestScore}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Score</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold mt-2.5 uppercase tracking-wide px-2.5 py-1 border border-slate-200 rounded-full shadow-sm ${scoreColor}`}>
                    {scoreText}
                  </span>
                </div>

                {/* Capability Breakdowns */}
                <div className="sm:col-span-7 space-y-2.5">
                  {[
                    { label: 'Communication', score: communicationScore },
                    { label: 'Technical', score: technicalScore },
                    { label: 'Behavioral', score: behavioralScore },
                    { label: 'Confidence', score: confidenceScore }
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="text-slate-800">{item.score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                <p className="text-slate-500 text-xs font-semibold">No interviews completed yet.</p>
                <p className="text-slate-400 text-[10px] mt-1 mb-4">Complete your first grading round to unlock skills feedback.</p>
                <button
                  onClick={() => router.push('/ai-interviewer')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  Start First Interview
                </button>
              </div>
            )}

            {latestInterview && (
              <div className="pt-2 border-t border-slate-100 space-y-1 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Feedback</span>
                <p className="text-slate-600 text-xs italic leading-relaxed">
                  "{latestInterview.feedbackSummary || 'Evaluation assessment is ready. Review details to strengthen structural answer strategies.'}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card B: Weekly Study Roadmap */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Weekly Study Roadmap</h3>
              <button 
                onClick={() => router.push('/learning-plan')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                <span>Roadmap</span>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
              </button>
            </div>

            {learningPlanData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-xs">Week {activeWeekNum}: {learningPlanData.targetRole || 'Interview Prep'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">{weeklyProgress}% Complete</span>
                </div>

                {/* Daily Checklist Tasks */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {weeklyTasks.map((task: any, index: number) => (
                    <div 
                      key={`${task.day}-${index}`} 
                      className={`flex items-start gap-2.5 p-2 rounded-lg border transition ${
                        task.completed 
                          ? 'bg-slate-50/50 border-slate-100' 
                          : 'bg-white border-slate-200 hover:border-blue-150'
                      }`}
                    >
                      <button 
                        onClick={() => handleToggleTask(activeWeekNum, task.day, index)}
                        className="mt-0.5 text-slate-400 hover:text-blue-600 transition flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <div className="w-4 h-4 border border-slate-300 rounded" />
                        )}
                      </button>
                      <div className="text-left flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-none ${task.completed ? 'text-slate-400 line-through' : 'text-slate-850'}`}>
                          {task.topic}
                        </p>
                        <span className="text-[9px] text-slate-400 font-medium block mt-1.5 capitalize">
                          {task.day} &bull; {task.durationMinutes} mins &bull; {task.activityType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${weeklyProgress}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                <p className="text-slate-500 text-xs font-semibold">No study roadmap active.</p>
                <p className="text-slate-400 text-[10px] mt-1 mb-4">Generate an AI study plan targeted for specific job applications.</p>
                <button
                  onClick={() => router.push('/learning-plan')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  Generate Study Plan
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row: Upcoming Sessions & Recent Progress/Skills Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card C: Upcoming Sessions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Upcoming Sessions</h3>
              <button 
                onClick={() => router.push('/applications')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                <span>Job Tracker</span>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
              </button>
            </div>

            {upcomingSessionsList.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessionsList.map((session) => (
                  <div key={session.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:border-blue-150 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-800 text-xs leading-none">{session.roundType}</h4>
                        <span className="text-[10px] text-slate-400 block mt-1">{session.position} @ {session.companyName}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      {new Date(session.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                <p className="text-slate-500 text-xs font-semibold">No interviews scheduled.</p>
                <p className="text-slate-400 text-[10px] mt-1 mb-4">Log scheduled recruiting rounds in the Job Tracker to stay prepared.</p>
                <button
                  onClick={() => router.push('/applications')}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition shadow"
                >
                  Open Job Tracker
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card D: Recent Progress & Skills Growth Charts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm text-left">Recent Progress & Skills Mastery</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Score Trajectory Chart */}
              <div className="space-y-2 border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Recent Progress</span>
                <div className="h-32 w-full my-0.5">
                  {miniTrends.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTrajectory" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} domain={[40, 100]} />
                        <Tooltip contentStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTrajectory)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-[10px]">
                      Complete multiple sessions to see progress
                    </div>
                  )}
                </div>
              </div>

              {/* Skills Growth Distribution */}
              <div className="space-y-2 border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Skills Growth</span>
                <div className="h-32 w-full my-0.5">
                  {skills.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={skills.slice(0, 4)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="averageConfidence" name="Mastery" fill="#4F46E5" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-[10px]">
                      Log interview questions to map skills
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Accordion Collapsible Code Playground */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setPlaygroundOpen(!playgroundOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 border-b border-slate-100 transition text-left"
        >
          <div className="flex items-center gap-2 text-slate-800">
            <Code className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-xs uppercase tracking-wider">💡 Interactive Code Sandbox (JS / Python)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold">Test solutions in-browser</span>
            {playgroundOpen ? <Minimize2 className="w-3.5 h-3.5 text-slate-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </button>

        {playgroundOpen && (
          <div className="p-5 space-y-4">
            
            {/* Language tab selector and actions */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setPlaygroundLanguage('javascript')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    playgroundLanguage === 'javascript'
                      ? 'bg-blue-50 text-blue-600 border border-blue-150 shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => setPlaygroundLanguage('python')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    playgroundLanguage === 'python'
                      ? 'bg-blue-50 text-blue-600 border border-blue-150 shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isLoadingPyodide && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
                  <span>Python (Pyodide WebAssembly)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlaygroundOutput([])}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-lg transition"
                  title="Clear Output"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Code editor textarea */}
            <div className="relative rounded-lg border border-slate-300 bg-slate-900 overflow-hidden h-[300px]">
              <pre 
                className="absolute inset-0 p-4 m-0 border-0 outline-0 select-none text-slate-350 leading-relaxed whitespace-pre overflow-auto pointer-events-none text-left"
                style={{ 
                  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
                dangerouslySetInnerHTML={{ __html: highlightCode(playgroundCode, playgroundLanguage) }}
              />
              <textarea
                value={playgroundCode}
                onChange={(e) => setPlaygroundCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                className="absolute inset-0 w-full h-full p-4 m-0 bg-transparent text-transparent caret-white resize-none border-0 outline-none focus:ring-0 focus:outline-none whitespace-pre overflow-auto text-left"
                style={{ 
                  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
                spellCheck={false}
              />
              <div className="absolute right-3 bottom-3 text-[9px] text-slate-500 font-bold font-mono tracking-wide uppercase select-none pointer-events-none bg-slate-900/70 px-2 py-0.5 rounded border border-slate-800 z-10">
                {playgroundLanguage === 'javascript' ? 'JavaScript Sandbox' : 'Python WebAssembly'}
              </div>
            </div>

            {/* Action controls */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleRunCode}
                disabled={isRunningCode || isLoadingPyodide}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg transition-all shadow hover:shadow-md min-h-[40px]"
              >
                {isRunningCode || isLoadingPyodide ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isLoadingPyodide ? 'Loading Pyodide WebAssembly...' : 'Running...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-white text-white" />
                    <span>Execute Script</span>
                  </>
                )}
              </button>
              {playgroundLanguage === 'python' && !(window as any).pyodideInstance && !isLoadingPyodide && (
                <span className="text-[10px] text-slate-400 italic font-semibold">
                  Note: Initial Python run will fetch the Pyodide runtime.
                </span>
              )}
            </div>

            {/* Console Output box */}
            {playgroundOutput.length > 0 && (
              <div className="rounded-lg border border-slate-300 bg-slate-900 overflow-hidden mt-3">
                <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-1.5 text-slate-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Terminal Output Console</span>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] text-emerald-500 text-left bg-black/40">
                  {playgroundOutput.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
