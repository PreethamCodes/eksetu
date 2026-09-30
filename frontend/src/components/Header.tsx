import React, { useEffect, useState } from 'react';
import { checkGatewayHealth } from '../services/api';
import { ShieldCheck, Activity, Server, Menu, X, FileText } from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [gatewayOnline, setGatewayOnline] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    checkGatewayHealth()
      .then(() => setGatewayOnline(true))
      .catch(() => setGatewayOnline(false));
  }, []);

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top Government Banner */}
      <div className="bg-[#0F2642] text-white text-xs py-1.5 px-3 sm:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <span className="font-semibold tracking-wider text-[11px] sm:text-xs">NATIONAL DIGITAL INFRASTRUCTURE</span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline text-xs">INTEROPERABILITY GATEWAY</span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-400/30">
            DEMO ENV
          </span>
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                gatewayOnline === true
                  ? 'bg-emerald-400 animate-pulse'
                  : gatewayOnline === false
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 hidden sm:inline">
              Gateway {gatewayOnline === true ? 'Active' : gatewayOnline === false ? 'Offline' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between">
        <div 
          onClick={() => handleNavClick('/')}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0F2642] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1A4472] transition-colors flex-shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0F2642]">EkSetu</h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Government Interoperability Platform</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => onNavigate('/')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              currentPath === '/'
                ? 'bg-slate-100 text-[#0F2642] font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('/scholarship')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
              currentPath === '/scholarship'
                ? 'bg-[#0F2642] text-white shadow-sm'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Scholarship Portal</span>
          </button>
          <button
            onClick={() => onNavigate('/transparency')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
              currentPath === '/transparency'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>My Data Usage</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/operations')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
              currentPath === '/admin/operations'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Operations</span>
          </button>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => handleNavClick('/')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 transition-colors ${
              currentPath === '/'
                ? 'bg-slate-100 text-[#0F2642] font-bold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => handleNavClick('/scholarship')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 transition-colors ${
              currentPath === '/scholarship'
                ? 'bg-[#0F2642] text-white font-bold shadow-sm'
                : 'bg-sky-50/80 text-sky-900 hover:bg-sky-100 border border-sky-100'
            }`}
          >
            <Activity className="w-4 h-4 text-sky-500" />
            <div className="flex-1 flex items-center justify-between">
              <span>Scholarship Portal</span>
              <span className="text-[10px] bg-sky-200/60 text-sky-900 px-1.5 py-0.5 rounded font-semibold">Active Demo</span>
            </div>
          </button>

          <button
            onClick={() => handleNavClick('/transparency')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 transition-colors ${
              currentPath === '/transparency'
                ? 'bg-emerald-800 text-white font-bold shadow-sm'
                : 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 border border-emerald-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div className="flex-1 flex items-center justify-between">
              <span>My Data Usage</span>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded font-semibold">Privacy</span>
            </div>
          </button>

          <button
            onClick={() => handleNavClick('/admin/operations')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 transition-colors ${
              currentPath === '/admin/operations'
                ? 'bg-purple-900 text-white font-bold shadow-sm'
                : 'bg-purple-50/80 text-purple-900 hover:bg-purple-100 border border-purple-100'
            }`}
          >
            <Server className="w-4 h-4 text-purple-500" />
            <div className="flex-1 flex items-center justify-between">
              <span>Operations & Registry</span>
              <span className="text-[10px] bg-purple-200/60 text-purple-900 px-1.5 py-0.5 rounded font-semibold">Admin</span>
            </div>
          </button>
        </div>
      )}
    </header>
  );
};
