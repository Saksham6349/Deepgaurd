import React from 'react';
import { Shield, Scan, Clock, Zap, LogOut, ChevronRight, ChevronLeft, Square } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  userEmail?: string | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isCollapsed, toggleSidebar, userEmail, onLogout }) => {
  const navItems = [
    { id: ViewState.ANALYZER, label: 'Forensic Lab', icon: <Scan size={20} /> },
    { id: ViewState.LIVE_MONITOR, label: 'Live Signals', icon: <Shield size={20} /> },
    { id: ViewState.CASE_LOGS, label: 'Case Logs', icon: <Clock size={20} /> },
  ];

  // Derive display name from email or default to ID
  const displayName = userEmail ? userEmail.split('@')[0].toUpperCase() : 'OPERATOR_ID';

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#020617] border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 shadow-2xl shadow-black`}>
      
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-12 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 hover:border-emerald-500/50 transition-all z-50 shadow-lg"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Header Logo Section */}
      <div className={`p-6 pb-8 transition-all duration-300 ${isCollapsed ? 'px-2 items-center flex flex-col' : ''}`}>
        <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center mb-6' : ''}`}>
          <div className="relative flex items-center justify-center group">
            <div className="absolute inset-0 bg-emerald-500 blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <Square className="text-emerald-500 fill-emerald-500" size={24} />
            <div className="absolute w-2 h-2 bg-[#020617] rotate-45"></div>
          </div>
          <h1 className={`text-xl font-bold text-white tracking-widest font-sans transition-opacity duration-200 ${isCollapsed ? 'hidden opacity-0 w-0' : 'opacity-100'}`}>
            DEEP<span className="text-emerald-500">FRAUD</span>
          </h1>
        </div>
        
        <div className={`flex items-center gap-2 pl-1 transition-all duration-300 ${isCollapsed ? 'justify-center pl-0' : ''}`}>
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
           <p className={`text-[10px] text-emerald-500 font-bold tracking-[0.2em] uppercase font-mono whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
             System Operational
           </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-6 mx-4"></div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center py-3.5 rounded-lg transition-all duration-200 group relative ${
                isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
              } ${
                isActive
                  ? 'bg-[#1e293b] text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {/* Left Highlight Bar for Active State */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-emerald-500 rounded-r shadow-[0_0_10px_#10b981]"></div>
              )}

              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <span className={`transition-colors ${isActive ? 'text-emerald-500' : 'group-hover:text-emerald-400'}`}>
                  {item.icon}
                </span>
                <span className={`font-medium text-sm tracking-wide font-sans whitespace-nowrap overflow-hidden transition-all duration-200 ${isActive ? 'text-white' : ''} ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                  {item.label}
                </span>
              </div>

              {/* Active Indicator Icon */}
              {isActive && !isCollapsed && (
                <Zap size={14} className="text-emerald-500 fill-emerald-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className={`p-4 mt-auto border-t border-slate-800 bg-[#020617] transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
        <div 
          onClick={onLogout}
          className={`flex items-center group cursor-pointer hover:bg-red-500/10 hover:border-red-500/20 border border-transparent p-2 rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          title="Sign Out"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1e293b] border border-slate-700 rounded flex items-center justify-center text-slate-400 font-bold font-mono text-xs tracking-wider group-hover:border-red-500/50 group-hover:text-red-400 transition-colors shadow-inner shrink-0">
              {displayName.substring(0, 2)}
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <span className="text-sm font-bold text-slate-200 font-mono tracking-wide group-hover:text-white truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest group-hover:text-red-400/80 transition-colors truncate">
                Authorized
              </span>
            </div>
          </div>
          {!isCollapsed && <LogOut size={16} className="text-slate-600 group-hover:text-red-400 transition-colors" />}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;