export type AppMode = 'PROJECT_GEN' | 'DEBUGGER' | 'AI_OPTIMIZER' | 'ROADMAP_GEN' | 'COMPONENT_LIB' | 'EXPERT_MENTOR' | 'LIVE_VOICE' | 'IMAGE_GEN' | 'SUBSCRIPTION' | 'FAQ' | 'TERMS' | 'PRIVACY' | 'DAILY_CHALLENGE' | 'TECH_NEWS' | 'QUIZ' | 'SHOWCASE' | 'LEADERBOARD' | 'REPORT_GEN' | 'CIRCUIT_ASSISTANT' | 'CODE_CONVERTER' | 'CHAT';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isTyping?: boolean;
}

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO';

export interface UserSession {
  id: string;
  deviceName: string;
  location: string;
  ip: string;
  lastActive: number;
  isCurrent?: boolean;
}

export interface UserProfile {
  name: string;
  level: 'Başlangıç' | 'Orta' | 'İleri';
  totalQuestions: number;
  subscriptionTier: SubscriptionTier;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'REPRESENTATIVE';
  isPremium?: boolean; // Keep for backward compatibility or remove if not needed
  lastLogin?: number;
  deviceId?: string;
  securityVerified?: boolean;
  email?: string;
  city?: string;
  institution?: string;
  twoFAEnabled?: boolean;
  twoFASecret?: string;
  kvkkAccepted?: boolean;
  achievements?: string[];
  sessions?: UserSession[];
  newLoginDetected?: boolean;
  isBanned?: boolean;
  banReason?: string;
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
