import React from 'react';
import { ScanHistoryItem } from '../types';
import { Search, Filter, FileImage, Calendar, AlertTriangle, ShieldCheck, Download, Trash2 } from 'lucide-react';

interface CaseLogsProps {
  history: ScanHistoryItem[];
}

const CaseLogs: React.FC<CaseLogsProps> = ({ history }) => {
  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score < 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 space-y-6 animate-in fade-in duration-500">
        <div className="p-8 bg-[#020617] border border-slate-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Filter size={48} className="text-slate-700 group-hover:text-emerald-500/50 transition-colors" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-widest font-mono">NO_CASES_LOGGED</h2>
          <p className="text-slate-400 max-w-md">The archive is empty. Initiate a scan in the Forensic Lab to generate case files.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Calendar className="text-emerald-500" size={20} />
          </div>
          <div>
             <h2 className="text-xl font-bold text-white font-mono tracking-wide">CASE_ARCHIVE</h2>
             <p className="text-xs text-slate-400 font-mono">{history.length} RECORDS FOUND</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH_CASE_ID..." 
              className="w-full bg-[#020617] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button className="p-2 bg-[#020617] border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-6 pr-2 custom-scrollbar">
        {history.map((item) => (
          <div key={item.id} className="bg-[#020617] border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Card Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/30">
               <div className="flex items-center gap-2">
                 <FileImage size={14} className="text-slate-500" />
                 <span className="font-mono text-xs text-slate-400 truncate max-w-[150px]">{item.fileName}</span>
               </div>
               <span className="font-mono text-[10px] text-slate-600 bg-slate-900 px-2 py-1 rounded">
                 {item.id}
               </span>
            </div>

            <div className="flex p-4 gap-4">
              {/* Thumbnail */}
              <div className="w-24 h-24 bg-black rounded-lg border border-slate-800 overflow-hidden shrink-0 relative">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="Evidence" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <FileImage size={24} />
                  </div>
                )}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${item.result.riskScore > 70 ? 'bg-red-500' : item.result.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-start mb-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRiskColor(item.result.riskScore)}`}>
                       {item.result.verdict}
                     </span>
                     <span className="text-xs text-slate-500 font-mono">
                        {new Date(item.result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                   </div>
                   
                   <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-500">Risk Score</span>
                        <span className={`font-mono font-bold ${item.result.riskScore > 70 ? 'text-red-400' : item.result.riskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {item.result.riskScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.result.riskScore > 70 ? 'bg-red-500' : item.result.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${item.result.riskScore}%` }}
                        ></div>
                      </div>
                   </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                   <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-400 transition-colors">
                     <Download size={14} />
                   </button>
                   <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors">
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseLogs;