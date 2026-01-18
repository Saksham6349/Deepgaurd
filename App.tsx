import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Analyzer from './components/Analyzer';
import LiveMonitor from './components/LiveMonitor';
import CaseLogs from './components/CaseLogs';
import LoginScreen from './components/LoginScreen';
import { ViewState, ScanHistoryItem } from './types';
import { saveScanResult, subscribeToHistory, auth, logout } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Key, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.ANALYZER);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyChecked, setApiKeyChecked] = useState(false);

  // Check for API Key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          // If window.aistudio is not available, we assume the environment is configured correctly 
          // or we can't do anything about it.
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasApiKey(true); // Fallback to avoid blocking if check fails
      } finally {
        setApiKeyChecked(true);
      }
    };
    checkApiKey();
  }, []);

  // Handle Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time updates from Firebase (Only when logged in)
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    const unsubscribe = subscribeToHistory((items) => {
      setHistory(items);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAnalysisComplete = async (item: ScanHistoryItem) => {
    // Save to Firestore - the subscription will automatically update the UI state
    await saveScanResult(item);
  };

  const handleLogout = async () => {
    await logout();
    // User state is updated automatically by onAuthStateChanged
  };

  const handleSelectKey = async () => {
    if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
       await (window as any).aistudio.openSelectKey();
       // Assume success as per instructions to avoid race conditions
       setHasApiKey(true);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.ANALYZER:
        return <Analyzer onAnalysisComplete={handleAnalysisComplete} />;
      case ViewState.LIVE_MONITOR:
        return <LiveMonitor history={history} />;
      case ViewState.CASE_LOGS:
        return <CaseLogs history={history} />;
      default:
        return <Analyzer onAnalysisComplete={handleAnalysisComplete} />;
    }
  };

  if (!apiKeyChecked || authLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-500 font-mono text-sm tracking-widest animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
         </div>
      </div>
    );
  }

  // API Key Selection Screen
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]"></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:30px_30px]"></div>

        <div className="max-w-md w-full bg-[#0b101e] border border-slate-800 rounded-xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-500">
           {/* Top Bar */}
           <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-800 via-amber-500 to-slate-800 shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>
           
           <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-amber-500/10 rounded-xl blur-sm animate-pulse"></div>
                 <Key size={32} className="text-amber-500 relative z-10" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-white font-sans tracking-widest mb-2">SYSTEM INITIALIZATION</h1>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Security Protocol: API Key Required</p>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg">
                <p className="text-sm text-slate-300 leading-relaxed">
                   DeepFraud requires a valid Gemini API key for forensic analysis operations. Please connect your project key to proceed.
                </p>
              </div>

              <button 
                onClick={handleSelectKey}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 group"
              >
                <Key size={18} />
                <span className="tracking-wider text-sm">AUTHENTICATE KEY</span>
              </button>
              
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-mono"
              >
                VIEW BILLING DOCUMENTATION <ExternalLink size={10} />
              </a>
           </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 font-sans tracking-wide">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userEmail={user.email || (user.isAnonymous ? 'ANONYMOUS_OP' : 'UNKNOWN_OP')}
        onLogout={handleLogout}
      />
      
      <main className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} p-8 min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f19] to-[#0b0f19]`}>
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 h-[calc(100vh-4rem)]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;