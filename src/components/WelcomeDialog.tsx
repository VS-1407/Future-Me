import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="welcome-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
          <motion.div
            id="welcome-modal-content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-[#0C0C0C] border border-zinc-800 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-white relative"
          >
            {/* Minimal Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-neon"></div>

            <div className="mb-6">
              <div className="text-[10px] tracking-[0.3em] font-bold text-neon uppercase mb-2 flex items-center gap-2">
                <span>System Initialized</span>
                <span className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
                FUTURE<br/>_ME
              </h2>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed mb-6 font-light">
              Predict your deadline risk and generate an automated, high-intensity rescue schedule to recover your timeline before it's too late.
            </p>

            <div className="flex items-center gap-2.5 mb-8 p-3 bg-white/5 border border-zinc-800 text-[10px] tracking-wider uppercase font-semibold text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-neon shrink-0" />
              <span>PREDICT • PRIORITIZE • EXECUTE</span>
            </div>

            <div>
              <button
                id="btn-welcome-start"
                onClick={onClose}
                className="w-full py-4 text-xs font-black tracking-[0.2em] uppercase bg-neon text-black hover:bg-white hover:text-black transition-all duration-150 cursor-pointer focus:outline-none"
              >
                Start Prediction
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
