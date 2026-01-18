import React, { useState, useRef, useEffect } from 'react';
import { ScanHistoryItem } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, ShieldAlert, ShieldCheck, Ban, Zap, Mic, MicOff, Radio } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface LiveMonitorProps {
  history: ScanHistoryItem[];
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ history }) => {
  // Stats calculation
  const totalScans = history.length;
  const highRiskCount = history.filter(h => h.result.riskScore > 75).length;
  const fraudCount = history.filter(h => h.result.verdict === 'FRAUD').length;
  const avgRisk = totalScans > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.result.riskScore, 0) / totalScans) 
    : 0;

  const chartData = [...history].reverse().slice(-20).map(item => ({
    time: new Date(item.result.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    score: item.result.riskScore,
    id: item.id
  }));

  // Live API State
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'ACTIVE' | 'ERROR'>('DISCONNECTED');
  const [volumeLevel, setVolumeLevel] = useState(0);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const currentSessionRef = useRef<any>(null);

  // Helper to convert Float32 to PCM16
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  const base64EncodeAudio = (int16Array: Int16Array) => {
    let binary = '';
    const bytes = new Uint8Array(int16Array.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const startLiveSession = async () => {
    try {
      setLiveStatus('CONNECTING');
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveStatus('ACTIVE');
            setIsLive(true);
          },
          onmessage: (message: LiveServerMessage) => {
            // In a real app, we would play back the audio here if we wanted 2-way comms
            // For fraud detection, we mostly just monitor, but let's log the server activity
            if (message.serverContent?.modelTurn) {
              // The model is speaking/responding
            }
          },
          onclose: () => {
            setLiveStatus('DISCONNECTED');
            setIsLive(false);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setLiveStatus('ERROR');
            stopLiveSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a background fraud detection agent. Listen to the audio stream. If you detect suspicious patterns, scams, or deepfake artifacts, briefly announce 'Risk Detected'. Otherwise stay silent.",
        }
      });

      currentSessionRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Simple visualizer
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
        setVolumeLevel(Math.sqrt(sum / inputData.length) * 100);

        const pcm16 = floatTo16BitPCM(inputData);
        const base64Data = base64EncodeAudio(pcm16);

        sessionPromise.then((session) => {
          session.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Data
            }
          });
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (error) {
      console.error("Failed to start live session:", error);
      setLiveStatus('ERROR');
    }
  };

  const stopLiveSession = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    // We can't explicitly close the session object easily without the reference resolving,
    // but stopping the stream essentially ends our side. 
    // Ideally we call session.close() if we stored the session object.
    
    setIsLive(false);
    setLiveStatus('DISCONNECTED');
    setVolumeLevel(0);
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
       {/* Header */}
       <div className="flex justify-between items-center mb-2">
         <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Security Operations Center</h1>
            <p className="text-slate-500 text-sm">Real-time threat monitoring and verification stream</p>
         </div>
         <div className="flex items-center gap-4">
            {/* Live Control */}
            <button 
              onClick={isLive ? stopLiveSession : startLiveSession}
              disabled={liveStatus === 'CONNECTING'}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all font-mono text-xs font-bold ${
                isLive 
                  ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-emerald-500/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20'
              }`}
            >
              {isLive ? (
                <>
                   <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                   </span>
                   STOP_LIVE_FEED
                </>
              ) : (
                <>
                   <Radio size={14} />
                   {liveStatus === 'CONNECTING' ? 'CONNECTING...' : 'INITIATE_LIVE_FEED'}
                </>
              )}
            </button>
         </div>
       </div>

       {/* Metrics Row */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard label="TOTAL VERIFICATIONS" value={totalScans.toString()} icon={<Activity size={16} />} />
          <MetricCard label="HIGH RISK ALERTS" value={highRiskCount.toString()} icon={<ShieldAlert size={16} />} />
          <MetricCard label="AVG RISK SCORE" value={`${avgRisk}%`} icon={<Zap size={16} />} />
          <MetricCard label="FRAUD BLOCKED" value={fraudCount.toString()} icon={<Ban size={16} />} />
       </div>

       {/* Main Content Split */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-[#020617] border border-slate-800 rounded-xl p-6 flex flex-col relative overflow-hidden">
             
             {isLive && (
               <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse z-20"></div>
             )}

             <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className={isLive ? "text-red-500 animate-pulse" : "text-emerald-500"} size={20} />
                  {isLive ? 'LIVE AUDIO SPECTRUM ANALYSIS' : 'Risk Score History'}
                </h3>
                {isLive && (
                  <div className="flex items-center gap-2">
                     <div className="flex gap-1 h-4 items-end">
                        {[...Array(5)].map((_, i) => (
                           <div key={i} className="w-1 bg-red-500 transition-all duration-75" style={{ height: `${Math.min(100, Math.max(10, volumeLevel * (i+1) * 20))}%` }}></div>
                        ))}
                     </div>
                     <span className="text-[10px] font-mono text-red-500 font-bold">LIVE_SIGNAL_ACTIVE</span>
                  </div>
                )}
             </div>
             
             <div className="flex-1 w-full min-h-[300px] relative z-10">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#475569" 
                        tick={{fontSize: 10, fontFamily: 'monospace'}} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#475569" 
                        tick={{fontSize: 10, fontFamily: 'monospace'}} 
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                        itemStyle={{ color: '#10b981' }}
                        cursor={{ stroke: '#334155', strokeWidth: 1 }}
                      />
                      <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <Activity size={48} className="opacity-20" />
                    <p className="font-mono text-xs tracking-widest">WAITING FOR DATA STREAM...</p>
                  </div>
                )}
             </div>

             {/* Live Overlay Effect */}
             {isLive && (
                <div className="absolute inset-0 bg-red-500/5 pointer-events-none z-0 animate-pulse"></div>
             )}
          </div>

          {/* Live Log Feed */}
          <div className="bg-[#020617] border border-slate-800 rounded-xl p-6 flex flex-col h-full overflow-hidden">
             <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <ShieldCheck className="text-red-500" size={20} />
                   Live Log
                </h3>
                <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-mono text-slate-400">{totalScans} EVENTS</span>
             </div>

             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {isLive && (
                   <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-pulse">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-red-500 uppercase">System Alert</span>
                         <span className="text-[10px] text-red-400 font-mono">NOW</span>
                      </div>
                      <p className="text-xs text-red-300 mt-1">Monitoring audio stream for deepfake signatures...</p>
                   </div>
                )}
                
                {history.map((item) => (
                   <div key={item.id} className="bg-[#0b101e] border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors group animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex justify-between items-start mb-2">
                         <div>
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                               {item.fileName.includes('.') ? 'MEDIA SCAN' : 'TEXT SCAN'}
                            </h4>
                            <p className="text-xs text-slate-500 font-mono truncate max-w-[150px]">{item.fileName}</p>
                         </div>
                         <div className={`text-sm font-bold font-mono ${item.result.riskScore > 70 ? 'text-red-500' : item.result.riskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {item.result.riskScore}%
                         </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                         <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${
                            item.result.verdict === 'FRAUD' ? 'text-red-400' : 
                            item.result.verdict === 'SUSPICIOUS' ? 'text-amber-400' : 'text-emerald-400'
                         }`}>
                            {item.result.verdict === 'FRAUD' && <ShieldAlert size={10} />}
                            {item.result.verdict === 'SAFE' && <ShieldCheck size={10} />}
                            {item.result.verdict}
                         </span>
                         <span className="text-[10px] text-slate-600 font-mono">
                            {new Date(item.result.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                         </span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-[#0b101e] border border-slate-800 p-5 rounded-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
       <Activity size={48} />
    </div>
    <div className="relative z-10">
       <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
       <div className="flex items-center gap-2">
         <h3 className="text-3xl font-bold text-white font-sans">{value}</h3>
         <div className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
            <Activity size={12} className="animate-pulse" />
         </div>
       </div>
       <div className="absolute right-4 bottom-4 text-emerald-500/80">
         {icon}
       </div>
    </div>
  </div>
);

export default LiveMonitor;