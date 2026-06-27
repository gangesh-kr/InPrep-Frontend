import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { logout } from './store/authSlice';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Applications } from './pages/Applications';
import { Questions } from './pages/Questions';
import { Revision } from './pages/Revision';
import { Learning } from './pages/Learning';
import { Journal } from './pages/Journal';
import { AIInterviewer } from './pages/AIInterviewer';
import { InterviewHistory } from './pages/InterviewHistory';
import { Analytics } from './pages/Analytics';
import { WeaknessAnalysis } from './pages/WeaknessAnalysis';
import { CompanyPacks } from './pages/CompanyPacks';
import { LearningPlan } from './pages/LearningPlan';
import { ScorecardDetail } from './pages/ScorecardDetail';
import { 
  LayoutDashboard, 
  Briefcase, 
  Database, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Mic,
  Clock,
  TrendingUp,
  AlertTriangle,
  Layers,
  Compass
} from 'lucide-react';

const App: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('inprep_active_tab') || 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedScorecardSessionId, setSelectedScorecardSessionId] = useState<string | null>(() => {
    return localStorage.getItem('inprep_selected_scorecard_session_id');
  });

  useEffect(() => {
    localStorage.setItem('inprep_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedScorecardSessionId) {
      localStorage.setItem('inprep_selected_scorecard_session_id', selectedScorecardSessionId);
    } else {
      localStorage.removeItem('inprep_selected_scorecard_session_id');
    }
  }, [selectedScorecardSessionId]);

  const isPublicScorecardRoute = window.location.pathname.startsWith('/scorecard/');

  if (!isAuthenticated && !isPublicScorecardRoute) {
    return <Login />;
  }

  if (isPublicScorecardRoute) {
    const publicToken = window.location.pathname.split('/scorecard/')[1];
    return <ScorecardDetail publicToken={publicToken} isPublicView={true} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'ai-interviewer', label: 'AI Mock Interview', icon: Mic },
    { id: 'history', label: 'Interview History', icon: Clock },
    { id: 'analytics', label: 'Improvement Trends', icon: TrendingUp },
    { id: 'weaknesses', label: 'Weak Topics', icon: AlertTriangle },
    { id: 'company-packs', label: 'Company Packs', icon: Layers },
    { id: 'learning-plan', label: 'Study Plan', icon: Compass },
    { id: 'questions', label: 'Question Bank', icon: Database },
    { id: 'revision', label: 'Revision Center', icon: BookOpen },
    { id: 'learning', label: 'Learning Tracker', icon: GraduationCap },
    { id: 'journal', label: 'Experience Journal', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'applications':
        return <Applications />;
      case 'ai-interviewer':
        return <AIInterviewer />;
      case 'history':
        return (
          <InterviewHistory 
            onViewScorecard={(sessionId) => {
              setSelectedScorecardSessionId(sessionId);
              setActiveTab('scorecard-detail');
            }} 
          />
        );
      case 'analytics':
        return <Analytics setActiveTab={setActiveTab} />;
      case 'weaknesses':
        return <WeaknessAnalysis setActiveTab={setActiveTab} />;
      case 'company-packs':
        return <CompanyPacks setActiveTab={setActiveTab} />;
      case 'learning-plan':
        return <LearningPlan />;
      case 'scorecard-detail':
        return (
          <ScorecardDetail 
            sessionId={selectedScorecardSessionId} 
            setActiveTab={setActiveTab} 
          />
        );
      case 'questions':
        return <Questions />;
      case 'revision':
        return <Revision />;
      case 'learning':
        return <Learning />;
      case 'journal':
        return <Journal />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
            In
          </div>
          <span className="font-bold text-slate-950 tracking-tight text-lg">InPrep</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-600 hover:text-slate-900"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out flex flex-col justify-between
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col">
          {/* Sidebar Brand Header */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              In
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-950 tracking-tight text-base leading-none">InPrep</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Preparation Hub</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-semibold border transition duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent hover:border-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profiler & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-slate-900 text-xs truncate">{user?.fullName}</span>
              <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('inprep_active_tab');
              localStorage.removeItem('inprep_selected_scorecard_session_id');
              dispatch(logout());
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-600 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {renderContent()}
      </main>

    </div>
  );
};

export default App;
