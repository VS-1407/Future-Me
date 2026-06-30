import { FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  History, 
  TrendingUp, 
  Trash2, 
  Zap, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle, 
  Flame, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';
import { HistoryEntry } from '../types';

interface HomeScreenProps {
  key?: string;
  goal: string;
  setGoal: (goal: string) => void;
  progress: number;
  setProgress: (progress: number) => void;
  hours: number;
  setHours: (hours: number) => void;
  onPredict: () => void;
  history: HistoryEntry[];
  isHistoryLoading: boolean;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export default function HomeScreen({
  goal,
  setGoal,
  progress,
  setProgress,
  hours,
  setHours,
  onPredict,
  history,
  isHistoryLoading,
  onDeleteEntry,
  onClearHistory,
}: HomeScreenProps) {
  const successChance = Math.round(
    Math.min(100, Math.max(0, progress * 0.7 + hours * 4))
  );

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const getRisk = (score: number) => {
    if (score >= 80) return { label: 'Safe', color: 'text-neon bg-neon/10 border-neon/30', icon: ShieldCheck };
    if (score >= 50) return { label: 'Medium Risk', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: AlertCircle };
    return { label: 'Critical', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: Flame };
  };

  const getTrendAnalysis = () => {
    if (history.length < 2) return null;
    const latest = history[0].score;
    const previous = history[1].score;
    const diff = latest - previous;
    if (diff > 0) {
      return {
        label: `PACING VELOCITY IMPROVED BY +${diff}% IN LATEST RECON`,
        color: 'text-neon border-neon/30 bg-neon/10'
      };
    } else if (diff < 0) {
      return {
        label: `REGRESSION DETECTED: PACING DECREASED BY ${Math.abs(diff)}%`,
        color: 'text-rose-500 border-rose-500/30 bg-rose-500/10'
      };
    }
    return {
      label: 'PACING STABLE: CONTINUOUS STEADY TRAJECTORY DETECTED',
      color: 'text-zinc-400 border-zinc-800 bg-zinc-950/40'
    };
  };

  const getGaugeTextClass = (chance: number) => {
    if (chance >= 80) return 'text-neon';
    if (chance >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getBarBgClass = (chance: number) => {
    if (chance >= 80) return 'bg-neon';
    if (chance >= 50) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onPredict();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-5xl mx-auto px-6 py-12"
    >
      {/* Structural Header Rail */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-855/20 border-zinc-800 pb-6 mb-12 gap-4">
        <div>
          <div className="text-[10px] tracking-[0.3em] font-bold text-zinc-500 uppercase mb-1">Source Node</div>
          <div className="text-xs font-semibold text-white tracking-wider font-mono">GITHUB://VS-1407/FUTURE_ME</div>
        </div>
        <div className="sm:text-right">
          <div className="text-[10px] tracking-[0.3em] font-bold text-zinc-500 uppercase mb-1">System Status</div>
          <div className="text-xs font-semibold text-neon tracking-wider uppercase flex items-center gap-2 sm:justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
            Ready_to_predict
          </div>
        </div>
      </div>

      {/* Hero Bold Typography Title Section */}
      <div className="mb-12">
        <div className="text-[10px] tracking-[0.3em] font-bold text-neon uppercase mb-2">Project Identifier</div>
        <h1 className="text-6xl sm:text-8xl md:text-[110px] font-black tracking-tighter leading-[0.8] uppercase mb-6 text-white">
          FUTURE<br/>_ME
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-light max-w-2xl leading-relaxed">
          Predict your success rate and timeline risk with high accuracy. This engine evaluates your goals and hourly input to optimize your rescue schedule dynamically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Parameter Sliders */}
          <div className="space-y-6">
            
            {/* Goal Input Card */}
            <div className="p-6 bg-[#0C0C0C] border border-zinc-800 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon"></div>
              <div className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-neon" />
                <span>Specify Target Goal</span>
              </div>
              <input
                id="goal-input"
                type="text"
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="ENTER GOAL (E.G., EXAM STUDY, INTERVIEW, CODE REFACTOR)"
                className="w-full px-4 py-3 bg-[#050505] border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-neon text-xs font-mono uppercase tracking-wider transition-colors duration-150"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {["SYSTEM DESIGN INTERVIEW", "ALGORITHMS EXAM", "CLOUD REFACTOR", "PRODUCT LAUNCH PLAN"].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setGoal(sug)}
                    className="px-2 py-1 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-[9px] font-mono text-zinc-500 hover:text-neon uppercase tracking-wider transition-all duration-150 cursor-pointer focus:outline-none"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders Container */}
            <div className="p-6 bg-[#0C0C0C] border border-zinc-800 space-y-6">
              
              {/* Progress Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Current Progress</span>
                  <span className="px-2.5 py-0.5 text-xs font-bold font-mono border border-zinc-800 text-neon bg-zinc-950">
                    {Math.round(progress)}%
                  </span>
                </div>
                <input
                  id="progress-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 accent-neon cursor-pointer focus:outline-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-2 uppercase tracking-wider">
                  <span>Starting [0%]</span>
                  <span>Completed [100%]</span>
                </div>
              </div>

              {/* Hours Available Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Available Hours Today</span>
                  <span className="px-2.5 py-0.5 text-xs font-bold font-mono border border-zinc-800 text-neon bg-zinc-950">
                    {Math.round(hours)} HRS
                  </span>
                </div>
                <input
                  id="hours-slider"
                  type="range"
                  min="1"
                  max="12"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 accent-neon cursor-pointer focus:outline-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-2 uppercase tracking-wider">
                  <span>1 Hour</span>
                  <span>12 Hours</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Live Prediction Engine Output */}
          <div className="p-8 bg-[#0C0C0C] border border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] tracking-[0.25em] font-bold text-zinc-500 uppercase mb-4">Pacing Engine Assessment</div>
              
              <div className="mb-6">
                <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold mb-2">Calculated Success Probability</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black tracking-tighter leading-none ${getGaugeTextClass(successChance)}`}>
                    {successChance}%
                  </span>
                  <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest font-bold">Prognosis</span>
                </div>
              </div>

              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6 font-light">
                A dynamic forecast of completing your goals successfully today. Pacing speed is optimized when progress rate matches your available energy buffer.
              </p>
            </div>

            {/* Dynamic visual linear progress track bar */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                <span>Pacing Risk</span>
                <span className={getGaugeTextClass(successChance)}>
                  {successChance >= 80 ? 'Low Risk' : successChance >= 50 ? 'Moderate Risk' : 'Critical Risk'}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-950 border border-zinc-900 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getBarBgClass(successChance)}`}
                  style={{ width: `${successChance}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Predict Action Button */}
        <div className="pt-4">
          <button
            id="btn-predict"
            type="submit"
            className="w-full py-5 text-xs font-black tracking-[0.3em] uppercase bg-neon text-black hover:bg-white hover:text-black transition-all duration-150 cursor-pointer focus:outline-none"
          >
            Predict My Future ➔
          </button>
        </div>

      </form>

      {/* Collapsible Temporal Log History Section */}
      <div className="bg-[#0C0C0C] border border-zinc-800 shadow-xl mt-8 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full px-8 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-zinc-950/40 transition-colors duration-150 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-neon" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Temporal Log History
              </h3>
              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5 font-bold">
                {history.length} Saved Timeline Runs Detected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isHistoryOpen ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </div>
        </button>

        {isHistoryOpen && (
          <div className="px-8 pb-8 pt-2 border-t border-zinc-900">
            {/* Trend Analysis Display */}
            {getTrendAnalysis() && (
              <div className={`p-4 mb-4 border flex items-center gap-2.5 text-xs font-mono font-bold uppercase tracking-wider ${getTrendAnalysis()?.color}`}>
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>{getTrendAnalysis()?.label}</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-900">
              <span className="text-[9px] font-mono tracking-[0.2em] font-bold text-zinc-500 uppercase">
                PREVIOUS TIMELINES RECORDED
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-[9px] font-mono font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest cursor-pointer focus:outline-none"
                >
                  CLEAR ALL RECORDS
                </button>
              )}
            </div>

            {isHistoryLoading ? (
              <div className="text-center py-8 font-mono text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse">
                RETRIEVING TEMPORAL LOGS...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 font-mono text-[10px] text-zinc-500 uppercase tracking-widest border border-dashed border-zinc-900">
                NO TEMPORAL LOGS DETECTED. CHOOSE GOALS AND RUN A TIMELINE PREDICTION TO LOG ENTRIES.
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((entry) => {
                  const entryRisk = getRisk(entry.score);
                  const EntryRiskIcon = entryRisk.icon;
                  const dateFormatted = new Date(entry.createdAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const isActive = entry.goal === goal && entry.progress === progress && entry.hours === hours;

                  return (
                    <div 
                      key={entry.id} 
                      className={`p-4 bg-zinc-950 border transition-colors duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isActive ? 'border-neon/40' : 'border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-zinc-500 uppercase font-bold">
                          <span>{dateFormatted}</span>
                          <span className="text-zinc-800">•</span>
                          <span className={isActive ? 'text-neon font-bold animate-pulse' : 'text-zinc-400 font-bold'}>
                            {isActive ? 'CURRENT FORM PRESET' : 'GOAL RUN RECORDED'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider line-clamp-1">
                          &ldquo;{entry.goal}&rdquo;
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono font-bold">
                          <span className="text-zinc-400">
                            PROGRESS: <strong className="text-neon">{entry.progress}%</strong>
                          </span>
                          <span className="text-zinc-600">/</span>
                          <span className="text-zinc-400">
                            ALLOCATED: <strong className="text-neon">{entry.hours}h</strong>
                          </span>
                          <span className="text-zinc-600">/</span>
                          <span className="text-zinc-400">
                            SCORE: <strong className="text-neon">{entry.score}%</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[9px] font-mono font-bold uppercase tracking-wider ${entryRisk.color}`}>
                          <EntryRiskIcon className="w-3.5 h-3.5 shrink-0 text-neon" />
                          <span>{entryRisk.label}</span>
                        </span>

                        {isActive ? (
                          <span className="px-2.5 py-1 bg-neon/15 border border-neon/30 text-neon text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse select-none">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>ACTIVE</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setGoal(entry.goal);
                              setProgress(entry.progress);
                              setHours(entry.hours);
                            }}
                            className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-neon hover:text-neon text-[9px] font-mono font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer focus:outline-none flex items-center gap-1.5"
                            title="Restore this parameters config"
                          >
                            <Zap className="w-3.5 h-3.5 text-neon" />
                            <span>LOAD</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-1.5 bg-zinc-900 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/20 transition-all duration-150 cursor-pointer focus:outline-none"
                          title="Purge temporal record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

    </motion.div>
  );
}
