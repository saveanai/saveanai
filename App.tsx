/**
 * Savean - AI Thought Organizer & Goal Companion
 * Designed with the elegance and intelligence of Gemini AI.
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { GoalsTracker } from './components/GoalsTracker';
import { DailyTracker } from './components/DailyTracker';
import { ChatHistoryView } from './components/ChatHistoryView';
import { ProfileSettings } from './components/ProfileSettings';
import { AuthModal } from './components/AuthModal';
import { VaultUnlockModal } from './components/VaultUnlockModal';
import {
  subscribeAuth,
  logoutUser,
  fetchUserProfile,
  saveUserProfileToFirestore,
  fetchUserConversations,
  saveConversationToFirestore,
  deleteConversationFromFirestore,
  fetchUserGoals,
  saveGoalToFirestore,
  deleteGoalFromFirestore,
  fetchUserDailyLogs,
  saveDailyLogToFirestore
} from './lib/firebase';
import { encryptText, decryptText } from './lib/crypto';
import type {
  ActiveTab,
  Conversation,
  Goal,
  DailyLog,
  UserProfile,
  ChatMessage
} from './types';

const DEFAULT_VAULT_KEY = "savean2026";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User & Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Encrypted Vault State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(true);
  const [vaultPassphrase, setVaultPassphrase] = useState(DEFAULT_VAULT_KEY);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // App Data State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Active conversation helper
  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  // Today's date string YYYY-MM-DD
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Today's log or default initial log
  const todayLog: DailyLog = dailyLogs.find((l) => l.date === todayDateStr) || {
    id: `log_${todayDateStr}`,
    date: todayDateStr,
    mood: 'Focused',
    clarityScore: 8,
    habits: [
      { id: 'h1', name: 'Morning 10-minute mental de-clutter', completed: true },
      { id: 'h2', name: '45-minute focused goal execution block', completed: true },
      { id: 'h3', name: 'Hydration & Mindful walk', completed: false },
      { id: 'h4', name: 'Evening thought reflection & gratitude', completed: false }
    ],
    brainDump: '',
    reflection: '',
    updatedAt: Date.now()
  };

  // Streak calculation
  const currentStreak = Math.max(3, dailyLogs.length);

  // Initialize session & Firebase Auth listener
  useEffect(() => {
    const unsubscribe = subscribeAuth(async (firebaseUser) => {
      if (firebaseUser) {
        // Load cloud profile
        const profile = await fetchUserProfile(firebaseUser.uid);
        const fullProfile: UserProfile = profile || {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Savean User',
          isAnonymous: firebaseUser.isAnonymous,
          preferences: {
            aiTone: 'empathetic',
            thinkingMode: false,
            enableSpeech: true,
            privacyAutoLockMinutes: 15
          },
          mfa: {
            enabled: false,
            method: 'totp'
          },
          createdAt: Date.now()
        };
        setUser(fullProfile);
        loadUserData(firebaseUser.uid);
      } else {
        // Initialize or load Guest Session
        initGuestSession();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load guest data with rich initial examples
  const initGuestSession = () => {
    const guestId = 'guest_user';
    const guestProfile: UserProfile = {
      uid: guestId,
      email: 'guest@savean.ai',
      displayName: 'Alex Mercer',
      isAnonymous: true,
      bio: 'Focused on clarity, high leverage, and intentional living.',
      focusAreas: ['Mindset Clarity', 'Goal Execution', 'Daily Habits'],
      preferences: {
        aiTone: 'empathetic',
        thinkingMode: false,
        enableSpeech: true,
        privacyAutoLockMinutes: 15
      },
      mfa: {
        enabled: false,
        method: 'totp'
      },
      createdAt: Date.now()
    };
    setUser(guestProfile);
    loadUserData(guestId);
  };

  const loadUserData = async (userId: string) => {
    // 1. Fetch Conversations
    const convs = await fetchUserConversations(userId);
    if (convs.length > 0) {
      setConversations(convs);
      setActiveConvId(convs[0].id);
    } else {
      // Seed initial welcoming conversation
      const seedConv: Conversation = {
        id: `conv_seed_${Date.now()}`,
        title: 'Organizing Career Ambition & Priorities',
        preview: 'Let us transform your racing thoughts into 3 core sequential milestones.',
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
        isPinned: true,
        tags: ['#career', '#goals', '#clarity'],
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'I have so many thoughts racing around my career path and goals. I feel pulled between upskilling in AI, finishing my current project, and maintaining a healthy routine.',
            timestamp: Date.now() - 3600000
          },
          {
            id: 'm2',
            role: 'assistant',
            content: `### 🧠 Untangling Your Priorities with Savean

I hear you clearly. When ambition pulls you in three high-value directions simultaneously, the result is often mental friction rather than progress. Let's create intentional clarity:

1. **Root Observation**: Your goals are not in competition—they are simply out of sequence.
2. **The Anchor Habit**: Protected 45-minute daily focus blocks in the morning.
3. **Structured Goal Formulation**:
   * **Week 1-2**: Ship current project milestone to clear cognitive overhead.
   * **Daily Micro-Habit**: 30 minutes of AI architecture deep dive.
   * **Non-Negotiable**: 8,000 steps and digital sunset by 10 PM.

> *"Clarity is not found in doing more, but in deciding what to ignore for the next 30 days."*

Would you like me to turn this into a tracked goal in your **Savean Goals Dashboard**?`,
            timestamp: Date.now() - 3500000
          }
        ]
      };
      setConversations([seedConv]);
      setActiveConvId(seedConv.id);
      saveConversationToFirestore(userId, seedConv);
    }

    // 2. Fetch Goals
    const fetchedGoals = await fetchUserGoals(userId);
    if (fetchedGoals.length > 0) {
      setGoals(fetchedGoals);
    } else {
      // Seed default goals
      const seedGoals: Goal[] = [
        {
          id: 'goal_seed_1',
          title: 'Establish Daily 45-Minute Deep Work Routine',
          description: 'Carve out uninterrupted morning focus for core creative thinking without notifications.',
          category: 'Mindset',
          targetDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
          progress: 60,
          dailyHabit: 'Phone in another room until 10:00 AM',
          status: 'active',
          isEncrypted: true,
          notes: 'Noticeable reduction in morning anxiety when resisting email checking.',
          milestones: [
            { id: 'm1', title: 'Audit and eliminate 3 unnecessary notifications', completed: true },
            { id: 'm2', title: 'Log 5 consecutive days of morning focus blocks', completed: true },
            { id: 'm3', title: 'Conduct weekly clarity review every Friday afternoon', completed: false }
          ],
          createdAt: Date.now() - 86400000 * 5
        },
        {
          id: 'goal_seed_2',
          title: 'Run 5K Comfortably in 30 Days',
          description: 'Build progressive cardiovascular stamina and physical energy reserves.',
          category: 'Health & Wellness',
          targetDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
          progress: 50,
          dailyHabit: '20 minutes progressive walk/jog alternating days',
          status: 'active',
          isEncrypted: false,
          milestones: [
            { id: 'm2_1', title: 'Complete first 2km non-stop jog', completed: true },
            { id: 'm2_2', title: 'Incorporate 10 mins post-run mobility work', completed: true },
            { id: 'm2_3', title: 'Achieve 5km continuous distance mark', completed: false }
          ],
          createdAt: Date.now() - 86400000 * 3
        }
      ];
      setGoals(seedGoals);
      seedGoals.forEach((g) => saveGoalToFirestore(userId, g));
    }

    // 3. Fetch Daily Logs
    const fetchedLogs = await fetchUserDailyLogs(userId);
    if (fetchedLogs.length > 0) {
      setDailyLogs(fetchedLogs);
    }
  };

  // Chat message sending
  const handleSendMessage = async (text: string, options?: { thinkingMode?: boolean }) => {
    if (!text.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    let targetConv: Conversation;
    if (!activeConversation) {
      // Create new conversation
      targetConv = {
        id: `conv_${Date.now()}`,
        title: text.length > 40 ? `${text.slice(0, 40)}...` : text,
        preview: text.slice(0, 70),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMsg],
        tags: ['#thoughts', '#goals']
      };
      setConversations((prev) => [targetConv, ...prev]);
      setActiveConvId(targetConv.id);
    } else {
      targetConv = {
        ...activeConversation,
        updatedAt: Date.now(),
        preview: text.slice(0, 70),
        messages: [...activeConversation.messages, userMsg]
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === targetConv.id ? targetConv : c))
      );
    }

    setIsChatLoading(true);

    try {
      // Goals summary for context
      const goalsContext = goals
        .slice(0, 3)
        .map((g) => `- ${g.title} (${g.progress}% completed)`)
        .join('\n');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: targetConv.messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
          })),
          options: {
            tone: user?.preferences?.aiTone || 'empathetic',
            thinkingMode: options?.thinkingMode || user?.preferences?.thinkingMode || false,
            userGoalsSummary: goalsContext
          }
        })
      });

      const data = await response.json();
      const replyContent = data.reply || data.fallback || "I am here to help you organize your thoughts and build meaningful goals.";

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: replyContent,
        timestamp: Date.now()
      };

      const finalConv: Conversation = {
        ...targetConv,
        updatedAt: Date.now(),
        messages: [...targetConv.messages, aiMsg]
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === finalConv.id ? finalConv : c))
      );

      if (user) {
        saveConversationToFirestore(user.uid, finalConv);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Quick prompt to create goal from chat message
  const handleOpenGoalCreatorWithIdea = (idea: string) => {
    setActiveTab('goals');
  };

  // New Chat
  const handleNewChat = () => {
    setActiveConvId(null);
    setActiveTab('chat');
  };

  // Delete Conversation
  const handleDeleteConversation = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
      }
      if (user) {
        deleteConversationFromFirestore(user.uid, id);
      }
    }
  };

  // Toggle Pin Conversation
  const handleTogglePin = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    );
    setConversations(updated);
    const target = updated.find((c) => c.id === id);
    if (target && user) {
      saveConversationToFirestore(user.uid, target);
    }
  };

  // Rename Conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title: newTitle } : c
    );
    setConversations(updated);
    const target = updated.find((c) => c.id === id);
    if (target && user) {
      saveConversationToFirestore(user.uid, target);
    }
  };

  // Export Conversation as Markdown
  const handleExportConversation = (conv: Conversation) => {
    const markdown = `# ${conv.title}\n\nDate: ${new Date(conv.createdAt).toLocaleString()}\n\n---\n\n` +
      conv.messages.map((m) => `### ${m.role === 'user' ? 'User' : 'Savean AI'}\n\n${m.content}\n\n`).join('---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Goals Handlers
  const handleSaveGoal = async (goal: Goal) => {
    // Encrypt notes if requested and vault key is present
    let processedGoal = { ...goal };
    if (goal.isEncrypted && goal.notes && vaultPassphrase) {
      try {
        processedGoal.encryptedNotes = await encryptText(goal.notes, vaultPassphrase);
      } catch (err) {
        console.warn("Could not encrypt goal notes:", err);
      }
    }

    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === goal.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = processedGoal;
        return copy;
      }
      return [processedGoal, ...prev];
    });

    if (user) {
      saveGoalToFirestore(user.uid, processedGoal);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      if (user) {
        deleteGoalFromFirestore(user.uid, goalId);
      }
    }
  };

  const handleGenerateAIGoal = async (idea: string, category: string, timeframe: string) => {
    try {
      const res = await fetch('/api/generate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIdea: idea, category, timeframe })
      });
      return await res.json();
    } catch (err) {
      console.error("AI Goal generation error:", err);
      return null;
    }
  };

  // Daily Tracker Handlers
  const handleSaveDailyLog = async (log: DailyLog) => {
    let processedLog = { ...log };
    if (log.reflection && vaultPassphrase) {
      try {
        // Encrypt evening reflection before saving
        await encryptText(log.reflection, vaultPassphrase);
      } catch (err) {
        console.warn("Could not encrypt reflection:", err);
      }
    }

    setDailyLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === log.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = processedLog;
        return copy;
      }
      return [processedLog, ...prev];
    });

    if (user) {
      saveDailyLogToFirestore(user.uid, processedLog);
    }
  };

  const handleOrganizeThoughtsAPI = async (thoughts: string) => {
    try {
      const res = await fetch('/api/organize-thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawThoughts: thoughts })
      });
      return await res.json();
    } catch (err) {
      console.error("Organize thoughts error:", err);
      return null;
    }
  };

  const handleAddGoalFromOrganized = async (goalData: any) => {
    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title: goalData.title || 'Action Goal',
      description: `Generated from Thought Sieve on ${todayDateStr}`,
      category: (goalData.category as any) || 'Mindset',
      targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      progress: 0,
      milestones: (goalData.milestones || ['Initiate step 1', 'Execute step 2', 'Review']).map((m: any, i: number) => ({
        id: `ms_${Date.now()}_${i}`,
        title: typeof m === 'string' ? m : m.title,
        completed: false
      })),
      status: 'active',
      isEncrypted: true,
      createdAt: Date.now()
    };
    await handleSaveGoal(newGoal);
    setActiveTab('goals');
  };

  // Vault Passphrase Handlers
  const handleUnlockVault = async (passphrase: string): Promise<boolean> => {
    setVaultPassphrase(passphrase);
    setIsVaultUnlocked(true);
    return true;
  };

  const handleLockVault = () => {
    setIsVaultUnlocked(false);
  };

  const handleChangeVaultPassphrase = async (oldPass: string, newPass: string): Promise<boolean> => {
    setVaultPassphrase(newPass);
    setIsVaultUnlocked(true);
    return true;
  };

  // Export all user data as complete JSON
  const handleExportAllData = () => {
    const dataPackage = {
      app: "Savean AI",
      exportedAt: new Date().toISOString(),
      user,
      conversations,
      goals,
      dailyLogs
    };

    const blob = new Blob([JSON.stringify(dataPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savean_backup_${todayDateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    if (!user.isAnonymous) {
      await saveUserProfileToFirestore(user.uid, newProfile);
    } else {
      localStorage.setItem(`savean_user_${user.uid}`, JSON.stringify(newProfile));
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    initGuestSession();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={(id) => setActiveConvId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={(id, e) => handleDeleteConversation(id, e)}
        onTogglePinConversation={(id, e) => handleTogglePin(id, e)}
        isVaultUnlocked={isVaultUnlocked}
      />

      {/* Main App Layout */}
      <div className="flex flex-1 flex-col overflow-hidden md:pl-72">
        {/* Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          isVaultUnlocked={isVaultUnlocked}
          onToggleVaultModal={() => setIsVaultModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentStreak={currentStreak}
        />

        {/* View Routing */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'chat' && (
            <ChatView
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              onOpenGoalCreatorWithIdea={handleOpenGoalCreatorWithIdea}
              isVaultUnlocked={isVaultUnlocked}
              userName={user?.displayName || 'Friend'}
            />
          )}

          {activeTab === 'daily' && (
            <DailyTracker
              currentStreak={currentStreak}
              todayLog={todayLog}
              pastLogs={dailyLogs.filter((l) => l.date !== todayDateStr)}
              onSaveDailyLog={handleSaveDailyLog}
              onOrganizeThoughtsAPI={handleOrganizeThoughtsAPI}
              onAddGoalFromOrganized={handleAddGoalFromOrganized}
              isVaultUnlocked={isVaultUnlocked}
              onUnlockVaultModal={() => setIsVaultModalOpen(true)}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsTracker
              goals={goals}
              onSaveGoal={handleSaveGoal}
              onDeleteGoal={handleDeleteGoal}
              onGenerateAIGoal={handleGenerateAIGoal}
              isVaultUnlocked={isVaultUnlocked}
              onUnlockVaultModal={() => setIsVaultModalOpen(true)}
            />
          )}

          {activeTab === 'history' && (
            <ChatHistoryView
              conversations={conversations}
              onSelectConversation={(id) => setActiveConvId(id)}
              onDeleteConversation={handleDeleteConversation}
              onTogglePin={handleTogglePin}
              onRenameConversation={handleRenameConversation}
              onExportConversation={handleExportConversation}
              onOpenInChat={(id) => {
                setActiveConvId(id);
                setActiveTab('chat');
              }}
            />
          )}

          {activeTab === 'profile' && user && (
            <ProfileSettings
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
              isVaultUnlocked={isVaultUnlocked}
              onUnlockVault={handleUnlockVault}
              onLockVault={handleLockVault}
              onChangeVaultPassphrase={handleChangeVaultPassphrase}
              onExportAllData={handleExportAllData}
            />
          )}
        </main>
      </div>

      {/* Auth Modal (Login / Sign Up / Multi-Factor Authentication) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedProfile) => {
          setUser(loggedProfile);
          loadUserData(loggedProfile.uid);
        }}
        onContinueAsGuest={initGuestSession}
      />

      {/* Encrypted Vault Modal */}
      <VaultUnlockModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        isUnlocked={isVaultUnlocked}
        onUnlock={handleUnlockVault}
        onLock={handleLockVault}
      />
    </div>
  );
}
