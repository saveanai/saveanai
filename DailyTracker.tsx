import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Smile,
  Brain,
  Zap,
  Lock,
  Unlock,
  Calendar,
  Plus,
  ArrowRight,
  Flame,
  Lightbulb,
  Save,
  Check,
  RotateCcw,
  Sliders
} from 'lucide-react';
import type { DailyLog, HabitItem, Goal } from '../types';

interface DailyTrackerProps {
  currentStreak: number;
  todayLog: DailyLog;
  pastLogs: DailyLog[];
  onSaveDailyLog: (log: DailyLog) => Promise<void>;
  onOrganizeThoughtsAPI: (thoughts: string) => Promise<any>;
  onAddGoalFromOrganized: (goalData: any) => Promise<void>;
  isVaultUnlocked: boolean;
  onUnlockVaultModal: () => void;
}

const MOODS: Array<{ label: DailyLog['mood']; emoji: string; color: string }> = [
  { label: 'Energized', emoji: '⚡', color: 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  { label: 'Focused', emoji: '🎯', color: 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' },
  { label: 'Calm', emoji: '🌿', color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
  { label: 'Reflective', emoji: '🌙', color: 'border-violet-400 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' },
  { label: 'Anxious', emoji: '🌪️', color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300' },
  { label: 'Overwhelmed', emoji: '🌊', color: 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' },
];

export const DailyTracker: React.FC<DailyTrackerProps> = ({
  currentStreak,
  todayLog,
  pastLogs,
  onSaveDailyLog,
  onOrganizeThoughtsAPI,
  onAddGoalFromOrganized,
  isVaultUnlocked,
  onUnlockVaultModal
}) => {
  const [log, setLog] = useState<DailyLog>(todayLog);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizedResult, setOrganizedResult] = useState<any>(todayLog.aiInsights || null);
  const [newHabitName, setNewHabitName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  const habits = log.habits || [];
  const completedHabitsCount = habits.filter((h) => h.completed).length;
  const habitCompletionPercent = habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;

  const handleMoodSelect = (mood: DailyLog['mood']) => {
    const updated = { ...log, mood };
    setLog(updated);
    onSaveDailyLog(updated);
  };

  const handleClarityChange = (score: number) => {
    const updated = { ...log, clarityScore: score };
    setLog(updated);
  };

  const handleHabitToggle = (habitId: string) => {
    const updatedHabits = habits.map((h) =>
      h.id === habitId ? { ...h, completed: !h.completed } : h
    );
    const updated = { ...log, habits: updatedHabits };
    setLog(updated);
    onSaveDailyLog(updated);
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const newHabit: HabitItem = {
      id: `h_${Date.now()}`,
      name: newHabitName.trim(),
      completed: false
    };
    const updated = { ...log, habits: [...habits, newHabit] };
    setLog(updated);
    setNewHabitName('');
    onSaveDailyLog(updated);
  };

  const handleOrganizeBrainDump = async () => {
    if (!log.brainDump.trim()) return;
    setIsOrganizing(true);
    try {
      const result = await onOrganizeThoughtsAPI(log.brainDump);
      if (result) {
        setOrganizedResult(result);
        const updated = { ...log, aiInsights: result };
        setLog(updated);
        await onSaveDailyLog(updated);
      }
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleSaveAll = async () => {
    await onSaveDailyLog(log);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 bg-zinc-50/50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Daily Progress & Thought Sieve
              </h1>
              <div className="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 px-3 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>{currentStreak} Days</span>
              </div>
            </div>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {todayFormatted} — Check in with your mindset, habits, and mental bandwidth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'today' ? 'history' : 'today')}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {activeTab === 'today' ? 'Past History' : 'Back to Today'}
            </button>

            <button
              id="btn-save-daily-progress"
              onClick={handleSaveAll}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Log</span>
                </>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'today' ? (
          <>
            {/* Section 1: Mood & Mental Clarity Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mood Selector */}
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Current Mindset State
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-500">{log.mood}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map((m) => {
                    const isSelected = log.mood === m.label;
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => handleMoodSelect(m.label)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? `${m.color} ring-2 ring-indigo-500/30 scale-[1.02] shadow-xs`
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="text-xl mb-1">{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mental Clarity Slider (1-10) */}
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-emerald-500" />
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Mental Clarity Index
                      </h2>
                    </div>
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {log.clarityScore} / 10
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">
                    How clear and unclouded does your thinking feel today?
                  </p>

                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={log.clarityScore}
                    onChange={(e) => handleClarityChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-400 mt-2">
                    <span>1 (Total Brain Fog)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Crystal Clear)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span>Clarity status:</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {log.clarityScore >= 8
                      ? 'High Focus Window'
                      : log.clarityScore >= 5
                      ? 'Steady Mental Flow'
                      : 'High Cognitive Clutter (Recommended: Thought Sieve)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Daily Habits Routine */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Daily Micro-Habits ({completedHabitsCount}/{habits.length})
                  </h2>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {habitCompletionPercent}% Done
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${habitCompletionPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => handleHabitToggle(habit.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                      habit.completed
                        ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        habit.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {habit.completed && <Check className="h-3 w-3" />}
                    </div>
                    <span className={habit.completed ? 'line-through opacity-80' : ''}>
                      {habit.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add custom habit input */}
              <form onSubmit={handleAddHabit} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new daily habit..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-medium hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Section 3: Savean Thought Sieve (Brain Dump to Structured Goals) */}
            <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-zinc-900 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Savean Thought Sieve
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Dump unedited, racing thoughts. Savean AI will untangle, categorize, and extract goals.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-organize-thoughts"
                  type="button"
                  onClick={handleOrganizeBrainDump}
                  disabled={isOrganizing || !log.brainDump.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-all self-start sm:self-auto"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isOrganizing ? 'Sieving thoughts...' : 'Organize with Savean'}</span>
                </button>
              </div>

              {/* Textarea for brain dump */}
              <textarea
                rows={4}
                value={log.brainDump}
                onChange={(e) => setLog({ ...log, brainDump: e.target.value })}
                placeholder="Write whatever is currently bouncing around in your mind without filtering: doubts, project ideas, chores, things causing anxiety, or personal wishes..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-3 text-xs md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              />

              {/* Organized Output Card if available */}
              {organizedResult && (
                <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-zinc-900 p-4 space-y-3.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                    <Sparkles className="h-4 w-4" />
                    <span>Structured Insights from Savean AI</span>
                  </div>

                  {organizedResult.summary && (
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 italic bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 rounded-lg border-l-2 border-indigo-500">
                      &ldquo;{organizedResult.summary}&rdquo;
                    </div>
                  )}

                  {/* Key themes */}
                  {organizedResult.keyThemes && (
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Identified Core Themes
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {organizedResult.keyThemes.map((theme: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Immediate Action */}
                  {organizedResult.immediateAction && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 p-2.5 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2">
                      <Zap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Recommended 5-Minute De-clutter Step:</strong>{' '}
                        {organizedResult.immediateAction}
                      </div>
                    </div>
                  )}

                  {/* Suggested Goals */}
                  {organizedResult.suggestedGoals && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Suggested Goals Extracted from Thoughts
                      </span>
                      <div className="space-y-2">
                        {organizedResult.suggestedGoals.map((sg: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {sg.title}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {sg.category} • {sg.timeframe} • {sg.milestones?.length || 0} milestones
                              </div>
                            </div>
                            <button
                              onClick={() => onAddGoalFromOrganized(sg)}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Add to Goals</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 4: Encrypted Daily Reflection Journal */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Encrypted Evening Reflection & Journal
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  AES-256 Vault Protected
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                What went well today? What caused mental resistance? What is the main intention for tomorrow?
              </p>

              <textarea
                rows={3}
                value={log.reflection}
                onChange={(e) => setLog({ ...log, reflection: e.target.value })}
                placeholder="Write your private reflection here. This text is encrypted with your master key before leaving your device..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 p-3 text-xs md:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </>
        ) : (
          /* Past Logs History View */
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Past Daily Progress Records
            </h2>
            {pastLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center text-xs text-zinc-500">
                No past daily records saved yet. Today is your day 1!
              </div>
            ) : (
              pastLogs.map((pLog) => (
                <div
                  key={pLog.date}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {pLog.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                        Mood: {pLog.mood}
                      </span>
                      <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] text-indigo-700 dark:text-indigo-400">
                        Clarity: {pLog.clarityScore}/10
                      </span>
                    </div>
                  </div>

                  {pLog.reflection && (
                    <p className="text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg">
                      {pLog.reflection}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
