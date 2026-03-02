export type AppMode = 'PROJECT_GEN' | 'DEBUGGER' | 'AI_OPTIMIZER' | 'ROADMAP_GEN' | 'COMPONENT_LIB' | 'COMMUNITY_PROJS' | 'EXPERT_MENTOR' | 'LIVE_VOICE';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO';

export interface UserProfile {
  name: string;
  level: 'Başlangıç' | 'Orta' | 'İleri';
  totalQuestions: number;
  subscriptionTier: SubscriptionTier;
  isPremium?: boolean; // Keep for backward compatibility or remove if not needed
  lastLogin?: number;
  deviceId?: string;
  securityVerified?: boolean;
  email?: string;
  achievements?: string[];
  stats?: {
    projectsGenerated: number;
    bugsFixed: number;
    codeOptimized: number;
  };
}

export interface HistoryItem {
  id: string;
  mode: AppMode;
  title: string;
  timestamp: number;
  content: string;
}
