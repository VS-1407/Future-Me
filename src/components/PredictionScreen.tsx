import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Activity,
  CheckCircle,
  Clock,
  Zap,
  Flame,
  LineChart as LineChartIcon,
  Brain,
  Award,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ListCollapse,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  History,
  TrendingUp
} from 'lucide-react';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import { HistoryEntry } from '../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#050505] border border-zinc-800 p-3 shadow-xl font-mono text-[10px] rounded-none">
        <p className="text-zinc-500 mb-1.5 uppercase tracking-wider font-bold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-4 justify-between">
            <span className="uppercase text-zinc-400">{entry.name}:</span>
            <span style={{ color: entry.color }} className="font-bold">
              {entry.value}{entry.name === 'PROGRESS' ? '%' : 'h'}
            </span>
          </div>
        ))}
        {payload[0]?.payload?.goal && (
          <p className="text-[#00FF5F] mt-1.5 border-t border-zinc-900 pt-1.5 line-clamp-1 italic text-[9px] uppercase font-bold max-w-[180px]">
            &ldquo;{payload[0].payload.goal}&rdquo;
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface PredictionScreenProps {
  key?: string;
  goal: string;
  progress: number;
  hours: number;
  onBack: () => void;
  onStartChat: () => void;
  onRestoreEntry?: (goal: string, progress: number, hours: number) => void;
  history: HistoryEntry[];
  isHistoryLoading: boolean;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
  onSavePrediction: (entry: Omit<HistoryEntry, 'id'>) => void;
}

export default function PredictionScreen({
  goal,
  progress,
  hours,
  onBack,
  onStartChat,
  onRestoreEntry,
  history,
  isHistoryLoading,
  onDeleteEntry,
  onClearHistory,
  onSavePrediction,
}: PredictionScreenProps) {
  const score = Math.round(Math.min(100, Math.max(0, progress * 0.6 + hours * 4)));

  // Process history sorted oldest-to-newest for visualization trends
  const chartData = [...history]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((entry, index) => {
      const d = new Date(entry.createdAt);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      return {
        name: `R-${index + 1}`,
        dateTime: `${dateStr} ${timeStr}`,
        progress: entry.progress,
        hours: entry.hours,
        goal: entry.goal,
      };
    });

  const getRisk = (score: number) => {
    if (score >= 80) return { label: 'Safe', color: 'text-neon bg-neon/10 border-neon/30', icon: ShieldCheck };
    if (score >= 50) return { label: 'Medium Risk', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: AlertCircle };
    return { label: 'Critical', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: Flame };
  };

  const getPrediction = (score: number) => {
    if (score >= 80) return 'YOU ARE PROGRESSING SECURELY.';
    if (score >= 50) return 'TIMELINE RECOVERY PATH DETECTED.';
    return 'IMMEDIATE MITIGATION REQUIRED.';
  };

  const getPlan = (goal: string) => {
    const g = goal.toLowerCase();
    if (g.includes('interview')) {
      return ['Research company history & stack', 'Practice introduction elevator pitch', 'Prepare final 3 confidence questions'];
    }
    if (g.includes('exam')) {
      return ['Revise the highest-scoring chapters first', 'Solve one complete time-bound mock test', 'Review critical formula & patterns'];
    }
    if (g.includes('project')) {
      return ['Isolate and complete core feature', 'Validate local data & mock logic', 'Record responsive video demo'];
    }
    return ['Initiate microtask immediately', 'Purge nearby digital distractions', 'Record interval progress metrics'];
  };

  const getTimeline = () => {
    return [
      'Now ➔ Initiate core task',
      '+30 Min ➔ Complete milestone 1',
      '+1 Hr ➔ Run system checkpoint',
      'Final ➔ Deploy with validation',
    ];
  };

  const getEmergencyMode = (score: number) => {
    if (score >= 70) {
      return {
        title: 'STABLE PACING',
        time: '0 MINS DELAY',
        action: 'Maintain target trajectory and record updates.',
      };
    }
    if (score >= 40) {
      return {
        title: 'RECOVERY INITIATED',
        time: '45 MIN DEEP WORK',
        action: 'Lock focus window and ignore all non-core tasks.',
      };
    }
    return {
      title: 'EMERGENCY SHUTDOWN',
      time: '25 MIN SPRINTS',
      action: 'Mute alerts and execute only the immediate task.',
    };
  };

  const getNextBestAction = (score: number, hours: number) => {
    if (score < 40) return 'COMMIT TO ONE COMPONENT IMMEDIATELY. IGNORE SECONDARY SCOPE.';
    if (hours < 3) return 'MAXIMIZE ALL REMAINING MINUTES FOR THE KEY CRITICAL PATH.';
    if (score < 70) return 'SEGMENT WORK INTO UNINTERRUPTED 30-MINUTE BLOCKS.';
    return 'MAINTAIN DISCIPLINED PACE AND DEPLOY AHEAD OF THE TIMELINE.';
  };

  const getFutureImpact = (score: number) => {
    if (score >= 80) return 'Maintaining this velocity ensures completion prior to the official deadline trigger.';
    if (score >= 50) return 'Permitting further delay today risks compromising delivery window parameters.';
    return 'Skipping this critical cycle creates structural friction for meeting the timeline.';
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

  const getRescueTask = (goal: string, score: number) => {
    const g = goal.toLowerCase();
    if (g.includes('exam')) return 'Master repeated patterns and core topics first';
    if (g.includes('project')) return 'Lock down one end-to-end user route immediately';
    if (g.includes('interview')) return 'Complete 5 quick practice speech rounds right now';
    if (score < 50) return 'Execute one microtask within the next 5 minutes';
    return 'Execute the single highest-priority milestone';
  };

  const getAutoSchedule = (hours: number) => {
    if (hours <= 2) {
      return [
        '00–25 MIN ➔ DEEP ENGAGEMENT',
        '25–30 MIN ➔ SYSTEM CALIBRATION',
        '30–60 MIN ➔ SECURE KEY DELIVERABLE',
      ];
    }
    if (hours <= 5) {
      return [
        'HOUR 1 ➔ CORE PRIORITY DEFINITION',
        'HOUR 2 ➔ INTENSE CYCLE EXECUTION',
        'HOUR 3 ➔ METRIC REVIEW & REPAIR',
        'HOUR 4 ➔ BUFFER & DEPLOYMENT PREP',
      ];
    }
    return [
      'CYCLE A ➔ INITIAL RECON & BUILD',
      'CYCLE B ➔ PACKAGING & REFINEMENT',
      'CYCLE C ➔ TIMELINE CONSOLIDATION',
    ];
  };

  const getAiInsights = (score: number, hours: number) => {
    const focus = Math.round(Math.min(100, Math.max(0, score + hours * 5)));
    let result = '';
    if (focus >= 85) result = 'OPTIMAL OUTCOME GUARANTEED AT THIS INTENSITY';
    else if (focus >= 60) result = 'MODERATE RISKS DETECTED IN WORK HOURS BUFFER';
    else result = 'HIGH TIMELINE EXHAUSTION THRESHOLD REACHED';

    return { focus, result };
  };

  const getFinalVerdict = (score: number) => {
    if (score >= 85) return 'COMPLETION HIGHLY PROBABLE.';
    if (score >= 65) return 'TRAJECTORY STABLE WITH CORRECTION.';
    if (score >= 40) return 'RECOVERY FEASIBLE VIA IMMEDATE INTERVENTION.';
    return 'CRITICAL DEADLINE FAILURE RISK DETECTED.';
  };

  const [aiReport, setAiReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const savePrediction = async () => {
    const userId = auth.currentUser?.uid || 'sandbox_user';
    const currentScore = Math.round(Math.min(100, Math.max(0, progress * 0.6 + hours * 4)));
    const currentRisk = getRisk(currentScore).label;
    const currentVerdict = aiReport?.verdict ? aiReport.verdict : getFinalVerdict(currentScore);

    const newEntry = {
      userId,
      goal,
      progress,
      hours,
      score: currentScore,
      riskLabel: currentRisk,
      verdict: currentVerdict,
      createdAt: Date.now()
    };

    onSavePrediction(newEntry);
  };

  // Auto-run save on load completion
  useEffect(() => {
    if (!isGenerating) {
      savePrediction();
    }
  }, [isGenerating]);

  const initialSeconds = Math.round(hours * 3600);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [particles, setParticles] = useState<{ id: number; x: number; size: number; delay: number; duration: number; char: string }[]>([]);

  // Generate cyber particles when score reaches safe threshold
  useEffect(() => {
    if (score >= 70) {
      const chars = ['+', '•', '1', '0', 'Δ', '◇', '⚡︎', '✔', '★'];
      const pArray = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 10 + 8,
        delay: Math.random() * 6,
        duration: Math.random() * 5 + 4,
        char: chars[Math.floor(Math.random() * chars.length)]
      }));
      setParticles(pArray);
    } else {
      setParticles([]);
    }
  }, [score]);

  // Sync with hours if hours prop changes
  useEffect(() => {
    setSecondsLeft(Math.round(hours * 3600));
  }, [hours]);

  useEffect(() => {
    if (!isTimerActive || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, secondsLeft]);

  // Format hours:minutes:seconds
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      hoursStr: String(h).padStart(2, '0'),
      minutesStr: String(m).padStart(2, '0'),
      secondsStr: String(s).padStart(2, '0'),
    };
  };

  const { hoursStr, minutesStr, secondsStr } = formatTime(secondsLeft);
  const percentRemaining = initialSeconds > 0 ? (secondsLeft / initialSeconds) * 100 : 0;

  // Loading steps animation
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    let active = true;
    const fetchPrognosis = async () => {
      try {
        setIsGenerating(true);
        const response = await fetch('/api/prognosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, progress, hours })
        });
        if (!response.ok) {
          throw new Error('API server reported error');
        }
        const data = await response.json();
        if (active) {
          setAiReport(data);
        }
      } catch (err) {
        console.warn('Prognosis API failed, using highly precise client heuristics:', err);
      } finally {
        if (active) {
          setIsGenerating(false);
        }
      }
    };
    fetchPrognosis();
    return () => {
      active = false;
    };
  }, [goal, progress, hours]);

  if (isGenerating) {
    const loadingTexts = [
      "CONNECTING TO THE FUTURE TEMPORAL NODE...",
      "EVALUATING PACING SPEED AND SYSTEM LATENCY...",
      "GENERATING PERSONALIZED TIMELINE DRAFT...",
      "COMPILED DYNAMIC TIMELINE SUCCESS PROJECTION..."
    ];
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-6 font-mono text-center">
        <div className="w-full max-w-md bg-[#0C0C0C] border border-zinc-800 p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-neon animate-pulse"></div>
          
          <div className="relative mb-8 flex justify-center">
            <span className="relative flex h-10 w-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon/30 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-10 w-10 bg-neon/10 border border-neon flex items-center justify-center text-neon">
                <Brain className="w-5 h-5 animate-spin" />
              </span>
            </span>
          </div>

          <h3 className="text-sm font-bold tracking-[0.25em] text-neon uppercase mb-2">PROGNOSIS ENGINE</h3>
          <h2 className="text-xl font-black uppercase mb-6 tracking-tight">RUNNING TELEMETRY</h2>

          {/* Progress bar animation */}
          <div className="w-full h-1.5 bg-zinc-950 border border-zinc-900 overflow-hidden mb-6">
            <motion.div 
              className="h-full bg-neon" 
              initial={{ width: "0%" }}
              animate={{ width: `${(loadingStep + 1) * 25}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>

          <div className="text-[10px] tracking-widest text-zinc-400 uppercase leading-relaxed font-bold h-12 flex items-center justify-center">
            {loadingTexts[loadingStep]}
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-between text-[8px] text-zinc-600 tracking-wider">
            <span>SECURE LINK: YES</span>
            <span>NODE: WATCHFUL-CHARGER</span>
          </div>
        </div>
      </div>
    );
  }

  const risk = getRisk(score);
  const prediction = aiReport?.verdict ? aiReport.verdict : getPrediction(score);
  const plan = aiReport?.plan ? aiReport.plan : getPlan(goal);
  const timeline = aiReport?.timeline ? aiReport.timeline : getTimeline();
  const emergency = aiReport?.emergencyMode ? aiReport.emergencyMode : getEmergencyMode(score);
  const nextAction = aiReport?.nextAction ? aiReport.nextAction : getNextBestAction(score, hours);
  const impact = aiReport?.impact ? aiReport.impact : getFutureImpact(score);
  const rescueTask = aiReport?.rescueTask ? aiReport.rescueTask : getRescueTask(goal, score);
  const schedule = aiReport?.schedule ? aiReport.schedule : getAutoSchedule(hours);
  const insights = {
    focus: getAiInsights(score, hours).focus,
    result: aiReport?.aiInsightsResult ? aiReport.aiInsightsResult : getAiInsights(score, hours).result
  };
  const verdict = aiReport?.verdict ? aiReport.verdict : getFinalVerdict(score);

  const RiskIcon = risk.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-5xl mx-auto px-6 py-12 text-white"
    >
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-800 pb-6 mb-8">
        <button
          id="btn-back-to-home"
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 px-4 py-2 border border-zinc-800 text-[10px] uppercase font-bold tracking-widest text-zinc-400 hover:text-white hover:border-white transition-colors duration-150 cursor-pointer focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4 text-neon" />
          <span>← Back</span>
        </button>

        <div className="text-left sm:text-right">
          <div className="text-[10px] tracking-[0.3em] font-bold text-neon uppercase flex items-center sm:justify-end gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />
            Rescue Analysis Active
          </div>
          <h2 className="text-base font-mono text-zinc-500 uppercase mt-1 flex flex-wrap items-center sm:justify-end gap-2">
            <span>PROGNOSIS ENGINE v2.4</span>
            {aiReport && (
              <span className="text-[9px] px-1.5 py-0.5 font-bold tracking-widest text-black bg-neon select-none">
                AI ENHANCED
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Hero Header Card with Circular Dial */}
      <div className="p-8 bg-[#0C0C0C] border border-zinc-800 shadow-2xl mb-8 flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-neon z-20"></div>

        {/* Subtle Positive Prognosis Pulse & Cyber Confetti */}
        {score >= 70 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
            {/* Soft, rhythmic breathing neon radial pulse */}
            <motion.div
              initial={{ opacity: 0.1, scale: 0.95 }}
              animate={{
                opacity: [0.06, 0.20, 0.06],
                scale: [0.98, 1.03, 0.98]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.1)_0%,transparent_70%)] rounded-3xl"
            />
            
            {/* Cyber Confetti Stream */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  opacity: 0,
                  y: "110%",
                  x: `${p.x}%`,
                  scale: 0.4,
                  rotate: 0
                }}
                animate={{
                  opacity: [0, 0.8, 0.8, 0],
                  y: "-10%",
                  scale: [0.4, 1.1, 0.9, 0.5],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute font-mono font-bold text-neon select-none"
                style={{
                  fontSize: `${p.size}px`,
                  bottom: 0
                }}
              >
                {p.char}
              </motion.div>
            ))}
          </div>
        )}

        <div className="space-y-4 max-w-xl relative z-10">
          <div className="text-[10px] tracking-[0.3em] font-bold text-zinc-500 uppercase">
            TARGET EVALUATION REPORT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none text-white">
            GOAL: &ldquo;{goal}&rdquo;
          </h1>
          
          {/* Real-time Countdown Timer Widget */}
          <div className="p-4 bg-[#050505] border border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 mt-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-neon/10 border border-neon/20 text-neon shrink-0 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[8px] font-mono tracking-[0.25em] text-zinc-500 uppercase">TEMPORAL DEADLINE COUNTDOWN</div>
                <div className="text-2xl font-black font-mono tracking-widest text-white flex items-center">
                  <span className="text-neon">{hoursStr}</span>
                  <span className="animate-pulse mx-1 text-zinc-600">:</span>
                  <span>{minutesStr}</span>
                  <span className="animate-pulse mx-1 text-zinc-600">:</span>
                  <span className="text-rose-500">{secondsStr}</span>
                </div>
                {/* Micro progress indicator */}
                <div className="w-28 h-0.5 bg-zinc-950 mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-neon transition-all duration-1000" 
                    style={{ width: `${percentRemaining}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsTimerActive(!isTimerActive)}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border transition-all duration-150 cursor-pointer focus:outline-none ${
                  isTimerActive 
                    ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black' 
                    : 'border-neon/30 text-neon hover:bg-neon hover:text-black'
                }`}
              >
                {isTimerActive ? 'PAUSE' : 'RESUME'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecondsLeft(initialSeconds);
                  setIsTimerActive(true);
                }}
                className="px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all duration-150 cursor-pointer focus:outline-none"
              >
                RESET
              </button>
            </div>
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed font-light">
            Engine run parameters: Progress score <strong className="text-neon font-mono font-bold">{progress}%</strong> with <strong className="text-neon font-mono font-bold">{hours} available hours</strong>. Automated schedule matching and focus pacing limits calculated successfully.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className={`inline-flex items-center gap-2 px-3 py-1 border text-[10px] font-bold uppercase tracking-wider ${risk.color}`}>
              <RiskIcon className="w-3.5 h-3.5 shrink-0 text-neon" />
              <span>Risk: {risk.label}</span>
            </span>
            {score >= 70 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neon/10 border border-neon/30 text-neon text-[10px] font-bold uppercase tracking-widest font-mono select-none"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-neon shrink-0" />
                <span>TIMELINE STABLE • CELESTIAL ALIGNMENT ACTIVE</span>
              </motion.span>
            )}
          </div>
        </div>

        {/* Dynamic Score Ring Dial styled beautifully */}
        <div className="relative z-10 flex items-center justify-center shrink-0 w-36 h-36">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="62"
              className="stroke-zinc-900 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="72"
              cy="72"
              r="62"
              className={`fill-none transition-all duration-1000 ${
                score >= 80 ? 'stroke-neon' : score >= 50 ? 'stroke-amber-400' : 'stroke-rose-400'
              }`}
              strokeWidth="8"
              strokeDasharray="390"
              strokeDashoffset={390 - (390 * score) / 100}
              strokeLinecap="square"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black tracking-tighter">
              {score}%
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              Score
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout - sharp flat border cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Prediction */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center gap-2.5 mb-4">
            <Activity className="w-4 h-4 text-neon" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Predictive Analysis</h3>
          </div>
          <p className="text-white text-xs font-mono tracking-wider mb-2 font-bold uppercase">
            {prediction}
          </p>
          <p className="text-zinc-500 text-xs leading-relaxed font-light">
            Current system pacing confirms deployment operations fall inside a {risk.label.toLowerCase()} zone. Action recommended.
          </p>
        </div>

        {/* Card 2: Rescue Plan */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center gap-2.5 mb-4">
            <CheckCircle className="w-4 h-4 text-neon" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Rescue Plan</h3>
          </div>
          <ul className="space-y-3">
            {plan.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-xs text-zinc-300 font-light">
                <span className="text-neon font-mono font-bold shrink-0 mt-0.5">0{index+1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 3: Timeline */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center gap-2.5 mb-4">
            <Clock className="w-4 h-4 text-neon" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Milestones</h3>
          </div>
          <ul className="space-y-3">
            {timeline.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-xs font-mono">
                <span className="text-neon font-bold tracking-wider shrink-0 bg-zinc-950 px-1.5 py-0.5 border border-zinc-900 text-[10px]">
                  {item.split(' ➔ ')[0]}
                </span>
                <span className="text-zinc-600">➔</span>
                <span className="text-zinc-300 uppercase tracking-wide text-[10px] font-bold">{item.split(' ➔ ')[1]}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 4: Emergency Mode */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200 relative">
          <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="flex items-center gap-2.5 mb-4">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-rose-400 uppercase">Emergency Profile</h3>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase flex items-center justify-between">
              <span className="tracking-wide font-mono">{emergency.title}</span>
              <span className="px-2 py-0.5 border border-rose-500/30 text-[9px] text-rose-400 font-mono bg-rose-500/5">
                {emergency.time}
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-light italic">
              &ldquo;{emergency.action}&rdquo;
            </p>
          </div>
        </div>

        {/* Card 5: Next Best Action */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center gap-2.5 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Optimized Decision</h3>
          </div>
          <div className="p-4 bg-[#050505] border border-zinc-800 text-xs text-amber-300 font-mono font-bold uppercase tracking-wider leading-relaxed">
            {nextAction}
          </div>
        </div>

        {/* Card 6: Future Impact */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center gap-2.5 mb-4">
            <LineChartIcon className="w-4 h-4 text-neon" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Impact Assessment</h3>
          </div>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-light">
            {impact}
          </p>
          <div className="w-full h-1.5 bg-zinc-950 border border-zinc-900 overflow-hidden">
            <div
              className="h-full bg-neon transition-all duration-1000"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Card 7: Instant Rescue */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center gap-2.5 mb-4">
            <HelpCircle className="w-4 h-4 text-neon" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Priority Pivot</h3>
          </div>
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase tracking-wider">
              CRITICAL NEXT TASK:
            </span>
            <div className="p-4 bg-[#050505] border border-zinc-800 text-xs font-semibold text-white uppercase tracking-wider">
              {rescueTask}
            </div>
          </div>
        </div>

        {/* Card 8: Auto Rescue Schedule */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center gap-2.5 mb-4">
            <ListCollapse className="w-4 h-4 text-neon" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Dynamic Pacing</h3>
          </div>
          <ul className="space-y-2 text-[10px] font-mono">
            {schedule.map((item, index) => (
              <li key={index} className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-900 text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-neon shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 9: AI Insights */}
        <div className="p-6 bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center gap-2.5 mb-3">
            <Brain className="w-4 h-4 text-neon" />
            <h3 className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 uppercase">Pacing Buffer</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-mono mb-1.5 uppercase tracking-wider text-zinc-500">
                <span>Concentration Index</span>
                <span className="text-neon font-bold">{insights.focus}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-950 border border-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-neon transition-all duration-1000"
                  style={{ width: `${insights.focus}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] font-bold font-mono tracking-wide text-neon uppercase">
              {insights.result}
            </p>
          </div>
        </div>
      </div>

      {/* Final Outcome Callout Banner */}
      <div className="p-8 bg-[#0C0C0C] border border-zinc-800 shadow-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-zinc-950 border border-zinc-800 text-neon shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] font-bold text-zinc-500 uppercase mb-1">FINAL DECISION PROJECTION</div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              {verdict}
            </h3>
          </div>
        </div>

        {/* Completion Probability bar indicator */}
        <div className="w-full sm:w-72 space-y-2">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            <span>Velocity Index</span>
            <span className="font-bold text-neon">{score}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-950 border border-zinc-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                score >= 80 ? 'bg-neon' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Temporal Progress & Hours Trend Section */}
      <div className="bg-[#0C0C0C] border border-zinc-800 shadow-xl mb-8 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-neon" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white font-sans">
                Temporal Trend Analytics
              </h3>
              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5 font-bold">
                Chronological Progress Velocity vs Allocation Profile
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 border border-zinc-800 bg-zinc-950 text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
            {history.length} runs logged
          </span>
        </div>

        {history.length < 2 ? (
          <div className="py-12 border border-dashed border-zinc-900 flex flex-col items-center justify-center text-center px-4">
            <Activity className="w-8 h-8 text-zinc-700 mb-3 animate-pulse" />
            <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-bold max-w-sm leading-relaxed">
              Insufficient temporal data. Run at least 2 timeline predictions to generate predictive velocity trend graphics.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-mono text-zinc-500 uppercase font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#00FF5F] border border-[#00FF5F]/30" />
                <span>Progress Index (0 - 100%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#00E5FF] border border-[#00E5FF]/30" />
                <span>Allocated Hours (h)</span>
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF5F" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#00FF5F" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#18181b" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="dateTime" 
                    stroke="#52525b" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#52525b" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#52525b" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="progress" 
                    name="PROGRESS" 
                    stroke="#00FF5F" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorProgress)" 
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="hours" 
                    name="HOURS" 
                    stroke="#00E5FF" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorHours)" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Timeline History Section */}
      <div className="bg-[#0C0C0C] border border-zinc-800 shadow-xl mb-8 overflow-hidden">
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
                NO TEMPORAL LOGS DETECTED. COMPLETE A TIMELINE RUN TO SAVE AN ENTRY.
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
                            {isActive ? 'CURRENT ACTIVE TIMELINE' : 'GOAL RUN RECORDED'}
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
                              if (onRestoreEntry) {
                                onRestoreEntry(entry.goal, entry.progress, entry.hours);
                              }
                            }}
                            className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-neon hover:text-neon text-[9px] font-mono font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer focus:outline-none flex items-center gap-1.5"
                            title="Restore this timeline prediction"
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

      {/* Action Navigation Button */}
      <div className="flex justify-center pt-4">
        <button
          id="btn-execute-rescue"
          onClick={onStartChat}
          className="w-full max-w-md py-5 text-xs font-black tracking-[0.3em] uppercase bg-neon text-black hover:bg-white hover:text-black transition-all duration-150 cursor-pointer focus:outline-none"
        >
          Execute My Rescue Plan ➔
        </button>
      </div>
    </motion.div>
  );
}
