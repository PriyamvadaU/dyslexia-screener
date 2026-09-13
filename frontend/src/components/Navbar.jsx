import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChild } from '../context/ChildContext';
import { 
  Sparkles, 
  BookOpen, 
  ClipboardCheck, 
  LayoutDashboard, 
  PenTool, 
  Users, 
  LogOut, 
  Plus, 
  ChevronDown, 
  ShieldCheck,
  Sliders
} from 'lucide-react';

export function Navbar({ onOpenChildModal }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { activeChild, childrenList, selectChild } = useChild();
  const location = useLocation();
  const navigate = useNavigate();
  const [childDropdownOpen, setChildDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-indigo-950 dark:text-white flex items-center gap-1">
                  Lexi<span className="text-indigo-600">Screen</span>
                </span>
                <span className="hidden sm:block text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider uppercase -mt-1">
                  Multimodal Learning Screener
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1.5 ml-4">
                <Link
                  to="/learn"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive('/learn')
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Learn (Practice)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-normal">
                    0 Score
                  </span>
                </Link>

                <Link
                  to="/test"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive('/test')
                      ? 'bg-indigo-100 text-indigo-950 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                  <span>Test (Assessment)</span>
                </Link>

                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive('/dashboard')
                      ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/handwriting-preview"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${
                    isActive('/handwriting-preview') ? 'text-indigo-600 font-bold' : ''
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Handwriting (Phase 2)</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Active Child Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setChildDropdownOpen(!childDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-xs font-medium transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 max-w-[120px] truncate">
                      {activeChild ? activeChild.name : 'Select Child'}
                    </span>
                    {activeChild && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                        Gr {activeChild.grade}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {childDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Child Profiles ({childrenList.length})
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {childrenList.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              selectChild(c);
                              setChildDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                              activeChild?.id === c.id
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-bold flex items-center justify-center text-[10px]">
                                {c.name.charAt(0)}
                              </span>
                              <div>
                                <div>{c.name}</div>
                                <div className="text-[10px] text-zinc-400 font-normal">
                                  Age {c.age} • Grade {c.grade}
                                </div>
                              </div>
                            </div>
                            {c.consentConfirmed && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" title="Consent Confirmed" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                        <button
                          onClick={() => {
                            setChildDropdownOpen(false);
                            if (onOpenChildModal) onOpenChildModal();
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-zinc-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Child Profile</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User & Logout */}
                <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-3">
                  <div className="hidden lg:block text-right">
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{user?.name}</div>
                    <div className="text-[10px] text-zinc-400 capitalize">{user?.role || 'Educator'}</div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/auth');
                    }}
                    className="p-2 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?tab=register"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
