export type AppMode = 'PROJECT_GEN' | 'DEBUGGER' | 'AI_OPTIMIZER' | 'ROADMAP_GEN' | 'COMPONENT_LIB' | 'COMMUNITY_PROJS' | 'EXPERT_MENTOR';

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
  lastLogin?: number;
  deviceId?: string;
  securityVerified?: boolean;
}

export interface HistoryItem {
  id: string;
  mode: AppMode;
  title: string;
  timestamp: number;
  content: string;
}
