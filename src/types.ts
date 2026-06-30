export interface HistoryEntry {
  id: string;
  userId: string;
  goal: string;
  progress: number;
  hours: number;
  score: number;
  riskLabel: string;
  verdict: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  isAi: boolean;
  text: string;
  timestamp: Date;
}
