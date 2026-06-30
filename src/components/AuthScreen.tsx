import { useState } from 'react';
import { motion } from 'motion/react';
import {
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';
import { Sparkles, AlertCircle, Shield, Radio } from 'lucide-react';

interface AuthScreenProps {
  key?: string;
  onSuccess: () => void;
  onBypass: (mockUser: { displayName: string; email: string }) => void;
}

export default function AuthScreen({ onSuccess, onBypass }: AuthScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      let errorMsg = 'GOOGLE AUTHENTICATION FAILED.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'SIGN-IN POPUP CLOSED BY USER.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'GOOGLE SIGN-IN IS NOT ENABLED IN FIREBASE CONSOLE.';
      } else if (err.message) {
        errorMsg = err.message.toUpperCase();
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-md mx-auto px-6 py-12"
    >
      {/* Auth Container Card */}
      <div className="bg-[#0C0C0C] border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-8">
        {/* Minimal Neon Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-neon"></div>

        <div className="mb-8 text-center animate-fade-in">
          <div className="text-[10px] tracking-[0.3em] font-bold text-neon uppercase mb-2 flex items-center justify-center gap-2">
            <span>Authentication Portal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
            FUTURE<br/>_ME
          </h1>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider mt-3 max-w-xs mx-auto">
            Connect your timeline nodes to store & recall historical objectives and predictions.
          </p>
        </div>

        {/* Display Error if any */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Auth Actions Area */}
        <div className="space-y-4">
          
          {/* Main Google Auth Button */}
          <div>
            <button
              id="btn-google-signin"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 border border-zinc-850 hover:border-neon text-xs font-mono font-bold tracking-[0.2em] uppercase bg-[#111] text-white hover:bg-neon hover:text-black transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none flex items-center justify-center gap-2.5 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              <Radio className="w-4 h-4 text-neon shrink-0 animate-pulse" />
              <span>{loading ? 'CONNECTING...' : 'CONNECT WITH GOOGLE'}</span>
            </button>
          </div>

          {/* Spacer / Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-900"></div>
            <span className="flex-shrink mx-4 text-[8px] font-mono text-zinc-600 uppercase tracking-widest">ALTERNATIVE GATE</span>
            <div className="flex-grow border-t border-zinc-900"></div>
          </div>

          {/* Secure Sandbox Local Bypass */}
          <div>
            <button
              id="btn-dev-bypass"
              type="button"
              onClick={() => {
                onBypass({
                  displayName: 'ADMIN_OPERATOR',
                  email: 'sandbox@futureme.local'
                });
              }}
              className="w-full py-4 border border-dashed border-zinc-800 hover:border-zinc-600 text-[10px] font-mono font-bold tracking-[0.2em] uppercase bg-[#070707] text-zinc-400 hover:text-white transition-all duration-150 cursor-pointer focus:outline-none flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>BYPASS VIA SECURE SANDBOX</span>
            </button>
            <p className="text-[9px] text-zinc-600 font-mono uppercase text-center mt-2.5 tracking-wide leading-relaxed">
              [Instant local bypass for testing and evaluation]
            </p>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-zinc-900 text-center">
          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
            FUTURE_ME SECURE ARCHIVE PLATFORM
          </p>
        </div>
      </div>
    </motion.div>
  );
}
