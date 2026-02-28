export type AppMode = 'PROJECT_GEN' | 'DEBUGGER';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  level: 'Başlangıç' | 'Orta' | 'İleri';
  totalQuestions: number;
  isPremium?: boolean;
}

export interface HistoryItem {
  id: string;
  mode: AppMode;
  title: string;
  timestamp: number;
  content: string;
}
