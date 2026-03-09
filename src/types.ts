export type AppMode = 'PROJECT_GEN' | 'DEBUGGER' | 'AI_OPTIMIZER' | 'ROADMAP_GEN' | 'COMPONENT_LIB' | 'EXPERT_MENTOR' | 'LIVE_VOICE' | 'IMAGE_GEN' | 'SUBSCRIPTION' | 'FAQ' | 'TERMS' | 'PRIVACY' | 'DAILY_CHALLENGE' | 'TECH_NEWS' | 'QUIZ' | 'SHOWCASE' | 'LEADERBOARD';

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
  twoFAEnabled?: boolean;
  twoFASecret?: string;
  kvkkAccepted?: boolean;
  achievements?: string[];
  stats?: {
    projectsGenerated: number;
    bugsFixed: number;
    codeOptimized: number;
    imagesGenerated?: number;
    challengesCompleted?: number;
    quizScore?: number;
    quizCount?: number;
    projectsShared?: number;
  };
}

export interface HistoryItem {
  id: string;
  mode: AppMode;
  title: string;
  timestamp: number;
  content: string;
}
