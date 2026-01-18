import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertOctagon, RefreshCw, FileImage, ShieldCheck, Zap, Activity, Scan, Terminal, Image as ImageIcon, Video, Mic, Type, FileAudio, FileVideo } from 'lucide-react';
import { analyzeFraud } from '../services/geminiService';
import { AnalysisResult, ScanHistoryItem } from '../types';

interface AnalyzerProps {
  onAnalysisComplete: (item: ScanHistoryItem) => void;
}

type TabType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'TEXT';

const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisComplete }) => {
  const [activeTab, setActiveTab] = useState<TabType>('IMAGE');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Text state
  const [textContent, setTextContent] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    clearSelection();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      let valid = false;
      if (activeTab === 'IMAGE' && file.type.startsWith('image/')) valid = true;
      if (activeTab === 'AUDIO' && file.type.startsWith('audio/')) valid = true;
      if (activeTab === 'VIDEO' && file.type.startsWith('video/')) valid = true;

      if (valid) {
        setSelectedFile(file);
        setResult(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert(`Please upload a valid ${activeTab} file.`);
      }
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setTextContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runAnalysis = async () => {
    if (activeTab === 'TEXT' && !textContent.trim()) return;
    if (activeTab !== 'TEXT' && (!previewUrl || !selectedFile)) return;

    setIsAnalyzing(true);
    
    try {
      let contentToAnalyze = '';
      
      if (activeTab === 'TEXT') {
        contentToAnalyze = textContent;
      } else if (previewUrl) {
        // Extract base64 data without prefix
        contentToAnalyze = previewUrl.split(',')[1];
      }

      const analysis = await analyzeFraud(contentToAnalyze, activeTab);
      setResult(analysis);

      // Create history item
      const historyItem: ScanHistoryItem = {
        id: `CASE-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
        fileName: activeTab === 'TEXT' ? 'Text_Snippet.txt' : selectedFile?.name || 'Unknown',
        thumbnail: activeTab === 'IMAGE' ? previewUrl : undefined,
        result: analysis
      };

      // Save to parent history
      onAnalysisComplete(historyItem);

    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please check your API key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-emerald-400';
    if (score < 70) return 'text-amber-400';
    return 'text-red-500';
  };

  const renderInputArea = () => {
    if (activeTab === 'TEXT') {
       return (
         <div className="w-full h-full flex flex-col p-4">
            <textarea 
              value={textContent}
              onChange={(e) => {
                setTextContent(e.target.value);
                setResult(null);
              }}
              placeholder="PASTE SUSPICIOUS TEXT CONTENT HERE FOR ANALYSIS..."
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-emerald-500 resize-none placeholder-slate-600 custom-scrollbar"
            />
            {textContent && (
               <button 
                onClick={clearSelection}
                className="absolute top-6 right-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
               >
                 <X size={16} />
               </button>
            )}
         </div>
       );
    }

    if (!previewUrl) {
      return (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        >
          <div className="w-24 h-24 border border-dashed border-slate-600 rounded flex items-center justify-center mb-6 bg-slate-900/50">
             {activeTab === 'AUDIO' ? <Mic className="text-slate-400" /> : 
              activeTab === 'VIDEO' ? <Video className="text-slate-400" /> :
              <Upload className="text-slate-400" />}
          </div>
          <p className="font-mono text-slate-400 text-sm tracking-widest uppercase mb-4">Awaiting {activeTab} Input</p>
          <button className="px-6 py-2 bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs hover:bg-slate-700 transition-colors">
            [ SELECT SOURCE ]
          </button>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black/40">
         {activeTab === 'IMAGE' && (
           <img src={previewUrl} className="max-h-[450px] max-w-full object-contain" alt="Evidence" />
         )}
         
         {activeTab === 'AUDIO' && (
           <div className="w-full px-12 flex flex-col items-center gap-4">
             <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center animate-pulse">
               <FileAudio size={40} className="text-emerald-500" />
             </div>
             <audio controls src={previewUrl} className="w-full" />
             <p className="font-mono text-xs text-emerald-500">{selectedFile?.name}</p>
           </div>
         )}

         {activeTab === 'VIDEO' && (
           <video controls src={previewUrl} className="max-h-[450px] max-w-full" />
         )}

         {isAnalyzing && (
           <div className="absolute inset-0 bg-emerald-500/10 z-20 animate-pulse flex items-center justify-center pointer-events-none">
              <div className="w-full h-1 bg-emerald-500 absolute top-1/2 -translate-y-1/2 shadow-[0_0_50px_rgba(16,185,129,1)] animate-scan"></div>
           </div>
         )}

         <button 
           onClick={clearSelection}
           className="absolute top-4 right-4 p-2 bg-black/80 text-red-500 border border-red-900/50 hover:bg-red-900/20 transition-colors z-30"
         >
           <X size={16} />
         </button>
      </div>
    );
  };

  const canRunAnalysis = () => {
    if (isAnalyzing) return false;
    if (activeTab === 'TEXT') return textContent.trim().length > 0;
    return !!previewUrl;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-wider">
           <Scan className="text-emerald-500" />
           <span className="font-mono">FORENSIC LAB <span className="text-slate-700 mx-2">//</span> ANALYSIS</span>
        </h2>
        
        <div className="flex bg-slate-900 p-1 rounded-md border border-slate-800">
          {[
            { id: 'IMAGE', icon: <ImageIcon size={14} /> },
            { id: 'AUDIO', icon: <Mic size={14} /> },
            { id: 'VIDEO', icon: <Video size={14} /> },
            { id: 'TEXT', icon: <Type size={14} /> }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => handleTabChange(type.id as TabType)}
              className={`px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === type.id 
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {type.icon} {type.id}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        
        {/* Left Column: Input Stream */}
        <div className="flex flex-col gap-2">
           <div className="relative flex-1 bg-[#020617] border border-slate-800 rounded-lg overflow-hidden flex flex-col group min-h-[400px]">
              <div className="absolute top-0 right-0 bg-slate-900 border-l border-b border-slate-800 px-3 py-1 text-[10px] font-mono text-slate-500 z-20">
                INPUT_STREAM_01 // {activeTab}
              </div>

              {/* Grid Background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none z-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

              {/* Input Area */}
              <div className="flex-1 relative z-10 flex flex-col items-center justify-center">
                 {renderInputArea()}
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept={
                      activeTab === 'IMAGE' ? "image/*" :
                      activeTab === 'AUDIO' ? "audio/*" :
                      activeTab === 'VIDEO' ? "video/*" : ""
                    }
                 />
              </div>
           </div>

           {/* Action Button */}
           <button 
             onClick={runAnalysis}
             disabled={!canRunAnalysis()}
             className={`w-full py-4 font-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all duration-300 border ${
               !canRunAnalysis()
                 ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                 : isAnalyzing
                   ? 'bg-emerald-900/20 text-emerald-500 border-emerald-900/50 cursor-wait'
                   : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-emerald-500/30'
             }`}
           >
             {isAnalyzing ? (
               <><RefreshCw className="animate-spin" size={16} /> PROCESSING_DATA_STREAM...</>
             ) : (
               <><Zap size={16} className={canRunAnalysis() ? "text-emerald-500" : ""} /> INITIATE_SCAN</>
             )}
           </button>
        </div>

        {/* Right Column: Output Log */}
        <div className="bg-[#020617] border border-slate-800 rounded-lg overflow-hidden flex flex-col relative h-[600px] lg:h-auto">
          <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">ANALYSIS_OUTPUT_LOG</span>
            {result && <span className="text-[10px] font-mono text-emerald-500">Log_ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>}
          </div>

          <div className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar">
            {!result ? (
               <div className="h-full flex flex-col items-center justify-center opacity-40">
                 <Activity size={48} className="text-slate-600 mb-4" />
                 <p className="text-slate-500 tracking-widest uppercase text-xs">System Ready</p>
                 <p className="text-slate-700 text-[10px] mt-2">Waiting for data stream...</p>
               </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-slate-500 text-xs uppercase">Confidence Score</span>
                    <span className="text-emerald-500 text-xs">v3.2_MODEL</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className={`text-4xl font-bold ${getRiskColor(result.riskScore)}`}>{result.riskScore}%</span>
                     <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full ${result.riskScore < 30 ? 'bg-emerald-500' : result.riskScore < 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                         style={{ width: `${result.riskScore}%` }}
                       ></div>
                     </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    VERDICT: <span className={`font-bold ${getRiskColor(result.riskScore)}`}>{result.verdict}</span>
                  </div>
                </div>

                <div>
                   <h4 className="text-xs text-slate-500 uppercase mb-3 flex items-center gap-2">
                     <Terminal size={12} /> Analysis Logic
                   </h4>
                   <p className="text-slate-300 leading-relaxed text-xs border-l-2 border-slate-800 pl-3">
                     {`> `}{result.reasoning}
                   </p>
                </div>

                <div>
                   <h4 className="text-xs text-slate-500 uppercase mb-3">Detected Artifacts</h4>
                   <ul className="space-y-2">
                     {result.artifactsFound.map((artifact, i) => (
                       <li key={i} className="bg-slate-900/50 p-2 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                         <AlertOctagon size={10} className="text-amber-500" />
                         {artifact}
                       </li>
                     ))}
                     {result.artifactsFound.length === 0 && (
                        <li className="bg-emerald-900/10 p-2 border border-emerald-900/30 text-xs text-emerald-400 flex items-center gap-2">
                          <CheckCircle size={10} /> No anomalies detected in stream.
                        </li>
                     )}
                   </ul>
                </div>
                
                <div className="pt-8 mt-auto">
                   <p className="text-[10px] text-slate-600 text-center">
                     END OF REPORT // <span className="text-emerald-900">{new Date().toISOString()}</span>
                   </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;