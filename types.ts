export type ActiveTab = 'chat' | 'history' | 'goals' | 'daily' | 'profile';

export type AIMode = 'fast' | 'thinking' | 'coach';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isEncrypted?: boolean;
  extractedGoals?: GoalSuggestion[];
}

export interface GoalSuggestion {
  title: string;
  category: string;
  timeframe: string;
  milestones: string[];
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  isPinned?: boolean;
  tags?: string[];
  isEncrypted?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'Career' | 'Health & Wellness' | 'Mindset' | 'Learning' | 'Finance' | 'Personal';
  targetDate: string;
  progress: number; // 0 to 100
  milestones: Milestone[];
  dailyHabit?: string;
  isEncrypted?: boolean;
  encryptedNotes?: string;
  notes?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: number;
}

export interface HabitItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 'Energized' | 'Calm' | 'Focused' | 'Anxious' | 'Overwhelmed' | 'Reflective';
  clarityScore: number; // 1 to 10
  habits: HabitItem[];
  brainDump: string;
  reflection: string;
  isEncrypted?: boolean;
  aiInsights?: {
    summary: string;
    keyThemes: string[];
    clarityInsights: string[];
    immediateAction: string;
  };
  updatedAt: number;
}

export interface UserPreferences {
  aiTone: 'empathetic' | 'direct' | 'socratic' | 'strategic';
  thinkingMode: boolean;
  enableSpeech: boolean;
  dailyReminderTime?: string;
  privacyAutoLockMinutes: number;
}

export interface MFASettings {
  enabled: boolean;
  method: 'totp' | 'email';
  secret?: string; // base32 TOTP secret
  backupCodes?: string[];
  verifiedAt?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  focusAreas?: string[];
  isAnonymous?: boolean;
  preferences: UserPreferences;
  mfa: MFASettings;
  encryptionSalt?: string;
  isVaultConfigured?: boolean;
  createdAt: number;
}
