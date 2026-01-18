import React, { useState } from 'react';
import { ScanFace, Lock, Mail, Fingerprint, HelpCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { loginWithGoogle, registerWithEmail, loginWithEmail } from '../services/firebase';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Access Denied: Google Authentication Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
       // Do not console.error(err) to keep console clean for expected auth errors
       if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setError('Invalid Credentials. Access Denied.');
       } else if (err.code === 'auth/email-already-in-use') {
         setError('Operator ID already active. Please switch to Login.');
       } else if (err.code === 'auth/weak-password') {
         setError('Security Alert: Password too weak (min 6 chars).');
       } else {
         setError(isRegistering ? 'Registration Sequence Failed' : 'Authentication Failed');
       }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]"></div>
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:30px_30px]"></div>

      {/* Main Card */}
      <div className="w-full max-w-[450px] bg-[#0b101e]/80 backdrop-blur-md border border-slate-800 rounded-xl relative shadow-2xl animate-in fade-in zoom-in-95 duration-700">
        
        {/* Top Glowing Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-500 ${isRegistering ? 'from-slate-800 via-amber-500 to-slate-800 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'from-slate-800 via-emerald-500 to-slate-800'}`}></div>

        <div className="p-8 pt-12">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-10 space-y-4">
            <div className={`w-16 h-16 bg-[#020617] border rounded-xl flex items-center justify-center relative group transition-colors duration-500 ${isRegistering ? 'border-amber-500/30' : 'border-emerald-500/30'}`}>
              <div className={`absolute inset-0 rounded-xl blur-sm group-hover:blur-md transition-all ${isRegistering ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}></div>
              {isRegistering ? (
                 <UserPlus size={32} className="text-amber-500 relative z-10" />
              ) : (
                 <ScanFace size={32} className="text-emerald-500 relative z-10" />
              )}
              {/* Corner accents */}
              <div className={`absolute top-1 left-1 w-2 h-2 border-l border-t ${isRegistering ? 'border-amber-500' : 'border-emerald-500'}`}></div>
              <div className={`absolute bottom-1 right-1 w-2 h-2 border-r border-b ${isRegistering ? 'border-amber-500' : 'border-emerald-500'}`}></div>
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-[0.2em] text-white font-sans">
                {isRegistering ? (
                  <>NEW <span className="text-amber-500">OPERATOR</span></>
                ) : (
                  <>DEEP<span className="text-emerald-500">FRAUD</span></>
                )}
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 mt-2">
                {isRegistering ? 'Registration Protocol' : 'Secure Access Terminal'}
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleStandardLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                Email Address
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors ${isRegistering ? 'group-focus-within:text-amber-500' : 'group-focus-within:text-emerald-500'}`}>
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-[#020617] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm font-mono text-white focus:outline-none focus:ring-1 transition-all placeholder-slate-700 ${isRegistering ? 'focus:border-amber-500 focus:ring-amber-500/50' : 'focus:border-emerald-500 focus:ring-emerald-500/50'}`}
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                Password
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors ${isRegistering ? 'group-focus-within:text-amber-500' : 'group-focus-within:text-emerald-500'}`}>
                  <Lock size={16} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-[#020617] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm font-mono text-white focus:outline-none focus:ring-1 transition-all placeholder-slate-700 ${isRegistering ? 'focus:border-amber-500 focus:ring-amber-500/50' : 'focus:border-emerald-500 focus:ring-emerald-500/50'}`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/20 p-2 rounded flex items-center justify-center animate-pulse">
                 {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all group relative overflow-hidden ${
                isRegistering 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              {isLoading ? (
                 <span className="font-mono animate-pulse">PROCESSING...</span>
              ) : (
                <>
                  {isRegistering ? <UserPlus size={20} /> : <Fingerprint size={20} />}
                  <span className="tracking-widest text-sm">{isRegistering ? 'REGISTER OPERATOR' : 'VERIFY IDENTITY'}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] text-slate-600 font-mono">OR AUTHENTICATE VIA</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {/* Social Actions */}
          <div className="w-full">
             <button 
               onClick={handleGoogleLogin}
               disabled={isLoading}
               className="w-full flex items-center justify-center gap-2 bg-[#020617] border border-slate-700 hover:border-slate-500 hover:bg-slate-800 py-2.5 rounded-lg text-slate-300 text-sm font-medium transition-all"
             >
               <svg className="w-4 h-4" viewBox="0 0 24 24">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                 <path d="M5.84 14.17c-.22-.66-.35-1.36-.35-2.17s.13-1.51.35-2.17V7.05H2.18C.77 9.84 0 12 0 12s.77 4.16 2.18 6.95l3.66-2.78z" fill="#FBBC05"></path>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.78c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
               </svg>
               Google
             </button>
          </div>

          {/* Footer */}
          <div className="mt-10 flex flex-col items-center gap-4">
             <button 
                onClick={toggleMode}
                className="text-xs text-slate-500 hover:text-white transition-colors font-mono flex items-center gap-1 group"
             >
               {isRegistering ? (
                 <>
                   <ArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" /> 
                   RETURN TO LOGIN
                 </>
               ) : (
                 <>
                   INITIALIZE NEW OPERATOR <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                 </>
               )}
             </button>
             
             <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
               <HelpCircle size={10} />
               <span className="underline cursor-pointer hover:text-slate-400">Connection Status</span>
             </div>
          </div>
        </div>

        {/* Legal Text Bottom */}
        <div className="bg-[#020617] border-t border-slate-800 p-4">
           <p className="text-[9px] text-slate-700 text-center font-mono uppercase tracking-wide leading-relaxed">
             Unauthorized access is a federal offense. <br/> Session monitored by Sec-Ops.
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;