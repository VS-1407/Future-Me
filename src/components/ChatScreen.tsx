import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, User, BrainCircuit } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatScreenProps {
  key?: string;
  goal: string;
  progress: number;
  hours: number;
  onBack: () => void;
}

export default function ChatScreen({ goal, progress, hours, onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message from Dart source
  useEffect(() => {
    setMessages([
      {
        id: 'initial-welcome',
        isAi: true,
        text: `🔮 I CHECKED YOUR FUTURE FOR '${goal.toUpperCase()}'. WHAT IS STOPPING YOU RIGHT NOW?`,
        timestamp: new Date(),
      },
    ]);
  }, [goal]);

  // Scroll to bottom on new messages or typing state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Offline reply generator based on keywords from Dart source (fallback)
  const generateReply = (userInput: string): string => {
    const q = userInput.toLowerCase();

    if (q.includes('tired')) {
      return "DON'T FINISH EVERYTHING TODAY. FINISH ONE IMPORTANT CRITICAL TASK.";
    }
    if (q.includes('exam')) {
      return 'STUDY THE HIGHEST SCORING REPEATED CHAPTER FIRST.';
    }
    if (q.includes('project')) {
      return 'REDUCE YOUR PROJECT SCOPE AND DELIVER ONE ROBUST FEATURE NOW.';
    }
    if (q.includes('deadline')) {
      return 'IGNORE SECONDARY CHECKS AND EXECUTE ONLY THE CORE CRITICAL PATH.';
    }
    if (q.includes('motivation')) {
      return 'START NOW FOR JUST 10 MINUTES. MOMENTUM ACCELERATES AFTER INITIATING.';
    }
    if (q.includes('interview')) {
      return 'PRACTICE INTRODUCTION ➔ KEY QUESTIONS ➔ FINAL CONFIDENCE ROUNDS.';
    }

    return 'FUTURE YOU PREDICTS HIGHER VELOCITY AND STABILITY IF YOU BEGIN RIGHT NOW.';
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // 1. Add User Message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      isAi: false,
      text: trimmedInput,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    let finalReply = '';

    try {
      // 2. Fetch from Gemini server-side endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          progress,
          hours,
          messages: updatedMessages.map((msg) => ({
            isAi: msg.isAi,
            text: msg.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error status');
      }

      const data = await response.json();
      if (data && data.reply) {
        finalReply = data.reply;
      } else {
        throw new Error('Invalid reply format');
      }
    } catch (err) {
      console.warn('Gemini chat request failed, using offline fallback prediction engine:', err);
      // Wait for the simulated experience delay (900ms)
      await new Promise((resolve) => setTimeout(resolve, 900));
      finalReply = generateReply(trimmedInput);
    }

    // 3. Add AI Message
    const aiMessage: ChatMessage = {
      id: `msg-${Date.now()}-ai`,
      isAi: true,
      text: finalReply,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsTyping(false);
  };

  // Helper to render message text with code blocks, bold text, and inline code elements
  const renderMessageText = (text: string) => {
    // Split message by code blocks ```
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeLines = part.slice(3, -3).trim().split('\n');
        // If the first line is a language, e.g. python, html, js, etc., display it nicely
        let language = '';
        let codeContent = codeLines.join('\n');
        if (codeLines.length > 0 && /^[a-zA-Z0-9+#-]+$/.test(codeLines[0])) {
          language = codeLines[0].toUpperCase();
          codeContent = codeLines.slice(1).join('\n');
        }
        return (
          <div key={index} className="my-3 border border-zinc-800 bg-black/60 rounded-none overflow-hidden font-mono text-[11px] leading-relaxed select-text lowercase-none">
            {language && (
              <div className="bg-zinc-950 px-3 py-1.5 border-b border-zinc-900 text-zinc-500 text-[9px] uppercase tracking-wider font-bold flex justify-between items-center select-none">
                <span>{language}</span>
                <span className="text-[8px] text-neon/60">SECURE SHELL</span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto text-zinc-300 whitespace-pre scrollbar-thin">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Split text by lines to support bold and inline code
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1.5">
          {lines.map((line, lineIdx) => {
            // Format line for bold **text** and inline code `code`
            const formattedLine = line.split(/(\*\*.*?\*\*|`.*?`)/g).map((subPart, subIdx) => {
              if (subPart.startsWith('**') && subPart.endsWith('**')) {
                return <strong key={subIdx} className="text-white font-bold">{subPart.slice(2, -2)}</strong>;
              }
              if (subPart.startsWith('`') && subPart.endsWith('`')) {
                return <code key={subIdx} className="bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 text-neon font-mono text-[10px]">{subPart.slice(1, -1)}</code>;
              }
              return subPart;
            });

            return (
              <p key={lineIdx} className="min-h-[1em] whitespace-pre-wrap leading-relaxed">
                {formattedLine}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-4xl mx-auto px-6 py-6 h-[calc(100vh-4rem)] flex flex-col text-white"
    >
      {/* Structural Header */}
      <div className="flex items-center gap-4 py-4 border-b border-zinc-800 shrink-0">
        <button
          id="btn-back-to-prediction"
          onClick={onBack}
          className="p-2.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-white active:scale-95 transition-all duration-150 cursor-pointer focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4 text-neon" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-950 border border-zinc-800 text-neon">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[9px] tracking-[0.25em] font-bold text-zinc-500 uppercase">COMMUNICATION LINK ACTIVE</div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">TALK TO FUTURE YOU</h2>
          </div>
        </div>
      </div>

      {/* Chat Messages Panel */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex items-start gap-4 max-w-[85%] ${
                msg.isAi ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
              }`}
            >
              {/* Square Avatar */}
              <div
                className={`p-2 border shrink-0 hidden sm:block ${
                  msg.isAi
                    ? 'bg-zinc-950 border-zinc-800 text-neon'
                    : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              >
                {msg.isAi ? <BrainCircuit className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Stark Text Bubble */}
              <div
                className={`p-5 border text-xs font-mono tracking-wider leading-relaxed ${
                  msg.isAi
                    ? 'bg-[#0C0C0C] border-zinc-800 text-zinc-100'
                    : 'bg-neon text-black border-neon font-black shadow-md'
                }`}
              >
                <div className="leading-relaxed text-left">
                  {renderMessageText(msg.text)}
                </div>
                <span
                  className={`text-[9px] font-mono block text-right mt-2 select-none ${
                    msg.isAi ? 'text-zinc-500' : 'text-zinc-800'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-4 max-w-[80%]"
          >
            <div className="p-2 bg-zinc-950 border border-zinc-800 text-neon shrink-0 hidden sm:block">
              <BrainCircuit className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 bg-[#0C0C0C] border border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
              </span>
              FUTURE ME IS PROCESSING PARAMS...
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Form with sharp edges */}
      <form onSubmit={handleSend} className="py-4 border-t border-zinc-800 bg-dark-bg flex items-center gap-4 shrink-0">
        <input
          id="chat-input-field"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ENTER TRANSMISSION FOR FUTURE ME..."
          className="flex-1 px-4 py-3.5 bg-[#0C0C0C] border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-neon text-xs font-mono uppercase tracking-wider transition-colors duration-150"
        />
        <button
          id="btn-chat-send"
          type="submit"
          disabled={!input.trim()}
          className="px-6 py-4 bg-neon text-black hover:bg-white hover:text-black font-black text-xs uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}
