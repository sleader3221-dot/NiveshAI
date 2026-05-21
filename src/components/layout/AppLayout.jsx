const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, TrendingUp, Briefcase,
  User, LogOut, Menu, Star, ChevronRight, Zap, Clock, Bot, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";

import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/stocks', icon: TrendingUp, label: 'Stock Signals' },
  { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { path: '/recommendations', icon: Zap, label: 'AI Picks' },
  { path: '/watchlist', icon: Star, label: 'Watchlist' },
  { path: '/time-machine', icon: Clock, label: 'Time Machine' },
  { path: '/trading-bot', icon: Bot, label: 'Trading Bot' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col border-r border-white/5
      `} style={{ background: 'rgba(5,11,24,0.97)' }}>
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-space font-bold text-base text-cyan">NIVESH</span>
                <span className="font-space font-bold text-base text-violet">AI</span>
              </div>
              <p className="text-[10px] text-white/30 tracking-wider uppercase">AI Portfolio Manager</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'text-background font-semibold shadow-[0_0_20px_rgba(0,212,255,0.2)]' 
                    : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                  }
                `}
                style={isActive ? { background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' } : {}}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-background" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white/80">{user?.full_name || 'Investor'}</p>
              <p className="text-xs text-white/30 truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start mt-1.5 text-white/30 hover:text-coral hover:bg-coral/10 text-xs"
            onClick={() => db.auth.logout()}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-white/5 px-4 py-3" style={{ background: 'rgba(5,11,24,0.9)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-white/60">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' }}>
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-space font-bold text-cyan">NIVESH</span>
              <span className="font-space font-bold text-violet">AI</span>
            </div>
            <Link to="/profile" className="p-2 -mr-2 rounded-lg hover:bg-white/5">
              <User className="w-5 h-5 text-white/40" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}