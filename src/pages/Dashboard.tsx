import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import type { AnalyticsSummary, Weakness, SkillDistribution, HeatmapItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
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
  ChevronRight
} from 'lucide-react';

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
      if (string) return `<span class="text-emerald-400">${match}</span>`;
      if (keyword) return `<span class="text-pink-400 font-semibold">${match}</span>`;
      if (builtin) return `<span class="text-sky-400 font-semibold">${match}</span>`;
      if (number) return `<span class="text-amber-400">${match}</span>`;
      if (func) return `<span class="text-violet-400">${match}</span>`;
      return match;
    });
  } else {
    const tokenRegex = /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:def|class|return|if|elif|else|for|while|break|continue|in|is|not|and|or|import|from|as|try|except|finally|raise|with|lambda|pass|global|nonlocal|assert|yield)\b)|(\b(?:print|len|range|str|int|float|list|dict|set|tuple|sum|min|max|abs)\b)|(\b\d+\b)|(\b\w+(?=\s*\())/g;

    html = html.replace(tokenRegex, (match, comment, string, keyword, builtin, number, func) => {
      if (comment) return `<span class="text-slate-500 italic">${match}</span>`;
      if (string) return `<span class="text-emerald-400">${match}</span>`;
      if (keyword) return `<span class="text-pink-400 font-semibold">${match}</span>`;
      if (builtin) return `<span class="text-sky-400 font-semibold">${match}</span>`;
      if (number) return `<span class="text-amber-400">${match}</span>`;
      if (func) return `<span class="text-violet-400">${match}</span>`;
      return match;
    });
  }
  return html;
};

export const Dashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [skills, setSkills] = useState<SkillDistribution[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Right menu collapser state
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

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
      // Strip empty trailing log elements
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumData, weakData, skillsData, heatData] = await Promise.all([
          apiRequest('/analytics/summary'),
          apiRequest('/intelligence/weaknesses'),
          apiRequest('/analytics/skills-distribution'),
          apiRequest('/analytics/activity-heatmap'),
        ]);
        setSummary(sumData);
        setWeaknesses(weakData);
        setSkills(skillsData);
        setHeatmap(heatData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 animate-pulse font-medium">Loading intelligence insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 text-sm">Every interview is training data. Here is your current readiness.</p>
        </div>
        <button
          onClick={() => setActiveTab('revision')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition shadow-sm"
        >
          <Play className="w-4 h-4 fill-current" />
          Start Daily Revision
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Readiness Score</span>
            <div className="text-3xl font-bold text-slate-900">{summary?.readinessScore}%</div>
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Self-improving
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Applications</span>
            <div className="text-3xl font-bold text-slate-900">{summary?.totalApplications}</div>
            <span className="text-xs text-slate-500">Active job searches</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Response Rate</span>
            <div className="text-3xl font-bold text-slate-900">{summary?.responseRate}%</div>
            <span className="text-xs text-slate-500">Excluding initial applied state</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Offers Secured</span>
            <div className="text-3xl font-bold text-slate-900">{summary?.totalOffers}</div>
            <span className="text-xs text-green-600 font-semibold">Current active wins</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative items-stretch">
        
        {/* Left Side: Charts and Playground */}
        <div className={`space-y-6 transition-all duration-300 ${isRightPanelOpen ? 'lg:w-2/3' : 'lg:w-full'}`}>
          
          {/* Skills Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Mastery Levels & Recall Strength by Skill</h3>
            <div className="h-64 w-full">
              {skills.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Add interview questions to populate skill distributions.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart key={skills.length} data={skills} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0F172A' }}
                    />
                    <Bar dataKey="questionsCount" name="Questions Logged" fill="#0F172A" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="averageConfidence" name="Average Mastery Level (1-10)" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Velocity Area Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Preparation Velocity (Last 30 Days)</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heatmap} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                  />
                  <Area type="monotone" dataKey="count" name="Activities Logged" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* INTERACTIVE CODE PLAYGROUND CARD */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setPlaygroundOpen(!playgroundOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 border-b border-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2 text-slate-800">
                <Code className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs uppercase tracking-wider">💡 Interactive Code Sandbox (JS / Python)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold">Test snippets & solutions in-browser</span>
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
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      JavaScript
                    </button>
                    <button
                      onClick={() => setPlaygroundLanguage('python')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        playgroundLanguage === 'python'
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isLoadingPyodide && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                      <span>Python (Pyodide WebAssembly)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlaygroundOutput([])}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
                      title="Clear Output"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Code editor textarea with custom syntax highlighting overlay */}
                <div className="relative rounded-lg border border-slate-800 bg-slate-950 overflow-hidden h-[300px]">
                  {/* Highlighter layer */}
                  <pre 
                    className="absolute inset-0 p-4 m-0 border-0 outline-0 select-none text-slate-300 leading-relaxed whitespace-pre overflow-auto pointer-events-none text-left"
                    style={{ 
                      fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      boxSizing: 'border-box'
                    }}
                    dangerouslySetInnerHTML={{ __html: highlightCode(playgroundCode, playgroundLanguage) }}
                  />
                  {/* Real interactive textarea */}
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
                  <div className="absolute right-3 bottom-3 text-[9px] text-slate-500 font-bold font-mono tracking-wide uppercase select-none pointer-events-none bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800 z-10">
                    {playgroundLanguage === 'javascript' ? 'JavaScript Sandbox' : 'Python WebAssembly'}
                  </div>
                </div>

                {/* Action controls */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunningCode || isLoadingPyodide}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg transition-all shadow hover:shadow-md"
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
                      Note: Initial Python run will fetch the 6MB Pyodide runtime.
                    </span>
                  )}
                </div>

                {/* Console Output box */}
                {playgroundOutput.length > 0 && (
                  <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden mt-3">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-1.5 text-slate-400">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Terminal Output Console</span>
                    </div>
                    <div className="p-4 max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] text-emerald-400 text-left bg-black/40">
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

        {/* Collapsible toggle line button */}
        <div className="hidden lg:flex items-center justify-center relative w-2 group cursor-pointer" onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}>
          <div className="absolute inset-y-0 w-0.5 bg-slate-200 group-hover:bg-blue-500 transition-colors" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRightPanelOpen(!isRightPanelOpen);
            }}
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 z-10 transition-all focus:outline-none"
            title={isRightPanelOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isRightPanelOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right Side: Collapsible panel */}
        {isRightPanelOpen && (
          <div className="lg:w-1/3 bg-white border border-slate-200 rounded-lg p-6 h-fit space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-lg">Active Weakness Areas</h3>
            </div>
            <p className="text-slate-500 text-xs">
              These skills average lower recall strength scores. Revisions will prioritize associated questions automatically.
            </p>

            <div className="space-y-4">
              {weaknesses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-md">
                  No major weaknesses surfaced! Log more rounds to test recall strength.
                </div>
              ) : (
                weaknesses.map((w) => (
                  <div key={w.skillId} className="p-4 border border-slate-200 rounded-lg hover:border-blue-600 transition duration-150">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-900 text-sm">{w.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        w.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {w.priority} Priority
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Avg Recall Strength: <strong className="text-slate-900">{w.averageConfidence}/10</strong></span>
                      <span>{w.needsRevisionCount} items flag revision</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${w.priority === 'High' ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${w.averageConfidence * 10}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
