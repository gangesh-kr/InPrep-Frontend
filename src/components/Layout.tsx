import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';
import { 
  LayoutDashboard, 
  Briefcase, 
  Mic, 
  Database, 
  Compass,
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Clock,
  TrendingUp,
  Layers,
  BookOpen,
  GraduationCap,
  FileText,
  ChevronDown 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [extendedOpen, setExtendedOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Authenticated route protection
  useEffect(() => {
    if (mounted && !isAuthenticated && router.pathname !== '/login' && !router.pathname.startsWith('/scorecard/')) {
      router.replace('/login');
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted || (!isAuthenticated && router.pathname !== '/login' && !router.pathname.startsWith('/scorecard/'))) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const coreNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ai-interviewer', label: 'Mock Interviews', icon: Mic },
    { href: '/learning-plan', label: 'Study Roadmap', icon: Compass },
    { href: '/weaknesses', label: 'Skills Lab', icon: Database },
    { href: '/applications', label: 'Job Tracker', icon: Briefcase },
  ];

  const extendedNavItems = [
    { href: '/history', label: 'Interview History', icon: Clock },
    { href: '/analytics', label: 'Improvement Trends', icon: TrendingUp },
    { href: '/company-packs', label: 'Company Packs', icon: Layers },
    { href: '/questions', label: 'Question Bank', icon: Database },
    { href: '/revision', label: 'Revision Center', icon: BookOpen },
    { href: '/learning', label: 'Learning Tracker', icon: GraduationCap },
    { href: '/journal', label: 'Experience Journal', icon: FileText },
  ];

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
        <div className="flex flex-col h-full max-h-[calc(100vh-130px)]">
          {/* Sidebar Brand Header */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50 flex-shrink-0">
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              In
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-950 tracking-tight text-base leading-none">InPrep</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Preparation Hub</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1 select-none">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-semibold border transition duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent hover:border-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Collapsible More Tools */}
            <div className="pt-2">
              <button
                onClick={() => setExtendedOpen(!extendedOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition border border-transparent"
              >
                <span>More Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 transform transition-transform duration-200 ${extendedOpen ? 'rotate-185' : ''}`} />
              </button>

              {extendedOpen && (
                <div className="mt-1 space-y-1 pl-2 border-l border-slate-100">
                  {extendedNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = router.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold border transition duration-150 ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-transparent hover:border-slate-100'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Footer Profiler & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-slate-900 text-xs truncate">{user?.fullName || 'User'}</span>
              <span className="text-[10px] text-slate-400 truncate">{user?.email || ''}</span>
            </div>
          </div>

          <button
            onClick={() => {
              dispatch(logout());
              router.push('/login');
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
        {children}
      </main>
    </div>
  );
};
