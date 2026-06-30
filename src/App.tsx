import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import WelcomeDialog from './components/WelcomeDialog';
import HomeScreen from './components/HomeScreen';
import PredictionScreen from './components/PredictionScreen';
import ChatScreen from './components/ChatScreen';
import AuthScreen from './components/AuthScreen';
import { LogOut, User as UserIcon } from 'lucide-react';
import { HistoryEntry } from './types';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'prediction' | 'chat'>('home');
  const [goal, setGoal] = useState('');
  const [progress, setProgress] = useState(20); // default 20.0 in main.dart
  const [hours, setHours] = useState(2); // default 2.0 in main.dart
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Load history from Firestore + localStorage hybrid
  const loadHistory = async () => {
    setIsHistoryLoading(true);
    const userId = auth.currentUser?.uid || user?.uid || 'sandbox_user';
    const localHistoryRaw = localStorage.getItem(`futureme_history_${userId}`);
    let loaded: HistoryEntry[] = [];
    if (localHistoryRaw) {
      try {
        loaded = JSON.parse(localHistoryRaw);
      } catch (e) {
        console.error("Error parsing local history:", e);
      }
    }

    if (auth.currentUser || user?.uid) {
      const currentUid = auth.currentUser?.uid || user?.uid;
      try {
        const q = query(
          collection(db, 'predictions'),
          where('userId', '==', currentUid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const firestoreEntries: HistoryEntry[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          firestoreEntries.push({
            id: doc.id,
            userId: data.userId || currentUid || 'sandbox_user',
            goal: data.goal || '',
            progress: typeof data.progress === 'number' ? data.progress : 0,
            hours: typeof data.hours === 'number' ? data.hours : 0,
            score: typeof data.score === 'number' ? data.score : 0,
            riskLabel: data.riskLabel || '',
            verdict: data.verdict || '',
            createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (typeof data.createdAt === 'number' ? data.createdAt : Date.now())
          });
        });
        if (firestoreEntries.length > 0) {
          loaded = firestoreEntries;
        }
      } catch (err) {
        console.warn('Could not read from Firestore, using local history storage fallback:', err);
      }
    }
    setHistory(loaded.sort((a, b) => b.createdAt - a.createdAt));
    setIsHistoryLoading(false);
  };

  const deleteEntry = async (entryId: string) => {
    const userId = auth.currentUser?.uid || user?.uid || 'sandbox_user';
    const userIdKey = `futureme_history_${userId}`;
    
    const localRaw = localStorage.getItem(userIdKey);
    if (localRaw) {
      try {
        let localList: HistoryEntry[] = JSON.parse(localRaw);
        localList = localList.filter(entry => entry.id !== entryId);
        localStorage.setItem(userIdKey, JSON.stringify(localList));
      } catch (e) {}
    }

    if ((auth.currentUser || user?.uid) && !entryId.startsWith('local_')) {
      try {
        await deleteDoc(doc(db, 'predictions', entryId));
      } catch (err) {
        console.warn('Could not delete from Firestore:', err);
      }
    }

    loadHistory();
  };

  const clearAllHistory = async () => {
    const userId = auth.currentUser?.uid || user?.uid || 'sandbox_user';
    localStorage.removeItem(`futureme_history_${userId}`);

    if (auth.currentUser || user?.uid) {
      const currentUid = auth.currentUser?.uid || user?.uid;
      try {
        const q = query(
          collection(db, 'predictions'),
          where('userId', '==', currentUid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
          try {
            await deleteDoc(doc(db, 'predictions', document.id));
          } catch (e) {}
        });
      } catch (err) {
        console.warn('Could not clear Firestore history:', err);
      }
    }

    setHistory([]);
  };

  const savePrediction = async (newEntry: Omit<HistoryEntry, 'id'>) => {
    const userId = auth.currentUser?.uid || user?.uid || 'sandbox_user';
    const duplicateCheck = (entry: HistoryEntry) => 
      entry.goal === newEntry.goal && 
      entry.progress === newEntry.progress && 
      entry.hours === newEntry.hours && 
      entry.score === newEntry.score;

    const userIdKey = `futureme_history_${userId}`;
    const localRaw = localStorage.getItem(userIdKey);
    let localList: HistoryEntry[] = [];
    if (localRaw) {
      try {
        localList = JSON.parse(localRaw);
      } catch (e) {}
    }

    if (localList.some(duplicateCheck)) {
      loadHistory();
      return;
    }

    const localId = `local_${Date.now()}`;
    const entryWithId: HistoryEntry = { ...newEntry, id: localId };
    localList.unshift(entryWithId);
    localStorage.setItem(userIdKey, JSON.stringify(localList));

    if (auth.currentUser || user?.uid) {
      try {
        await addDoc(collection(db, 'predictions'), {
          ...newEntry,
          createdAt: new Date()
        });
      } catch (err) {
        console.warn('Could not save prediction to Firestore:', err);
      }
    }

    loadHistory();
  };

  // Load history when user is available or changed
  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [user]);

  // Monitor Authentication state
  useEffect(() => {
    const cachedBypass = localStorage.getItem('futureme_bypass_user');
    if (cachedBypass) {
      try {
        setUser(JSON.parse(cachedBypass));
        setAuthChecking(false);
        return;
      } catch (e) {
        localStorage.removeItem('futureme_bypass_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // If there's a cached bypass user, don't overwrite it with null
      if (localStorage.getItem('futureme_bypass_user')) return;
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Trigger welcome dialog on mount for authenticated users
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setIsWelcomeOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('futureme_bypass_user');
      await signOut(auth);
      setUser(null);
      setCurrentScreen('home');
    } catch (err) {
      console.error('Failed to log out:', err);
      localStorage.removeItem('futureme_bypass_user');
      setUser(null);
      setCurrentScreen('home');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex flex-col items-center justify-center font-sans">
        <div className="space-y-4 text-center">
          <span className="relative flex h-3 w-3 mx-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon"></span>
          </span>
          <div className="text-[10px] tracking-[0.3em] font-mono font-bold text-zinc-500 uppercase">
            CONNECTING TO TIMELINE...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-dark-bg text-white flex flex-col font-sans selection:bg-neon/30 selection:text-white">
      
      {/* Dynamic Header Overlay if User is Logged In */}
      {user && (
        <div className="w-full max-w-5xl mx-auto px-6 pt-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-none text-[10px] font-mono tracking-wider text-zinc-400">
            <UserIcon className="w-3.5 h-3.5 text-neon" />
            <span className="uppercase font-bold">
              OPERATOR: {user.displayName || user.email?.split('@')[0]}
            </span>
          </div>

          <button
            id="btn-logout"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 border border-zinc-800 hover:border-rose-500/30 hover:text-rose-400 text-[10px] font-mono tracking-widest uppercase transition-all duration-150 cursor-pointer focus:outline-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      )}

      {/* Welcome Dialog Modal */}
      <WelcomeDialog isOpen={isWelcomeOpen} onClose={() => setIsWelcomeOpen(false)} />

      {/* Screen Router */}
      <main className="flex-1 flex flex-col justify-center py-4">
        <AnimatePresence mode="wait">
          {!user ? (
            <AuthScreen
              key="auth-screen"
              onSuccess={() => {}}
              onBypass={(mockUser) => {
                localStorage.setItem('futureme_bypass_user', JSON.stringify(mockUser));
                setUser(mockUser);
              }}
            />
          ) : (
            <>
              {currentScreen === 'home' && (
                <HomeScreen
                  key="home-screen"
                  goal={goal}
                  setGoal={setGoal}
                  progress={progress}
                  setProgress={setProgress}
                  hours={hours}
                  setHours={setHours}
                  onPredict={() => setCurrentScreen('prediction')}
                  history={history}
                  isHistoryLoading={isHistoryLoading}
                  onDeleteEntry={deleteEntry}
                  onClearHistory={clearAllHistory}
                />
              )}

              {currentScreen === 'prediction' && (
                <PredictionScreen
                  key="prediction-screen"
                  goal={goal}
                  progress={progress}
                  hours={hours}
                  onBack={() => setCurrentScreen('home')}
                  onStartChat={() => setCurrentScreen('chat')}
                  onRestoreEntry={(newGoal, newProgress, newHours) => {
                    setGoal(newGoal);
                    setProgress(newProgress);
                    setHours(newHours);
                  }}
                  history={history}
                  isHistoryLoading={isHistoryLoading}
                  onDeleteEntry={deleteEntry}
                  onClearHistory={clearAllHistory}
                  onSavePrediction={savePrediction}
                />
              )}

              {currentScreen === 'chat' && (
                <ChatScreen
                  key="chat-screen"
                  goal={goal}
                  progress={progress}
                  hours={hours}
                  onBack={() => setCurrentScreen('prediction')}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
