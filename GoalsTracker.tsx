import React, { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
  BookOpen,
  HeartPulse,
  Briefcase,
  DollarSign,
  Compass,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import type { Goal, Milestone } from '../types';

interface GoalsTrackerProps {
  goals: Goal[];
  onSaveGoal: (goal: Goal) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onGenerateAIGoal: (idea: string, category: string, timeframe: string) => Promise<Partial<Goal> | null>;
  isVaultUnlocked: boolean;
  onUnlockVaultModal: () => void;
}

const CATEGORIES = [
  { name: 'All', icon: Compass },
  { name: 'Career', icon: Briefcase, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40' },
  { name: 'Health & Wellness', icon: HeartPulse, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40' },
  { name: 'Mindset', icon: Sparkles, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40' },
  { name: 'Learning', icon: BookOpen, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40' },
  { name: 'Finance', icon: DollarSign, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40' },
  { name: 'Personal', icon: Award, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40' },
];

export const GoalsTracker: React.FC<GoalsTrackerProps> = ({
  goals,
  onSaveGoal,
  onDeleteGoal,
  onGenerateAIGoal,
  isVaultUnlocked,
  onUnlockVaultModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // New Goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState<Goal['category']>('Personal');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalDailyHabit, setGoalDailyHabit] = useState('');
  const [goalMilestones, setGoalMilestones] = useState<string[]>(['', '', '']);
  const [goalNotes, setGoalNotes] = useState('');
  const [encryptNotes, setEncryptNotes] = useState(true);

  // AI prompt helper in modal
  const [aiIdeaPrompt, setAiIdeaPrompt] = useState('');

  const filteredGoals = goals.filter((g) =>
    selectedCategory === 'All' ? true : g.category === selectedCategory
  );

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.progress === 100 || g.status === 'completed').length;
  const totalMilestones = goals.reduce((acc, g) => acc + (g.milestones?.length || 0), 0);
  const completedMilestones = goals.reduce(
    (acc, g) => acc + (g.milestones?.filter((m) => m.completed).length || 0),
    0
  );
  const averageProgress = totalGoals > 0
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / totalGoals)
    : 0;

  const toggleExpand = (id: string) => {
    setExpandedGoalIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMilestoneToggle = async (goal: Goal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const newProgress = updatedMilestones.length > 0
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : 0;

    const updatedGoal: Goal = {
      ...goal,
      milestones: updatedMilestones,
      progress: newProgress,
      status: newProgress === 100 ? 'completed' : 'active'
    };

    await onSaveGoal(updatedGoal);
  };

  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const milestones: Milestone[] = goalMilestones
      .filter((m) => m.trim().length > 0)
      .map((m, idx) => ({
        id: `ms_${Date.now()}_${idx}`,
        title: m.trim(),
        completed: false
      }));

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title: goalTitle.trim(),
      description: goalDescription.trim(),
      category: goalCategory,
      targetDate: goalTargetDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      progress: 0,
      milestones,
      dailyHabit: goalDailyHabit.trim(),
      status: 'active',
      isEncrypted: encryptNotes,
      notes: goalNotes.trim(),
      createdAt: Date.now()
    };

    await onSaveGoal(newGoal);
    setIsCreatingModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setGoalTitle('');
    setGoalDescription('');
    setGoalCategory('Personal');
    setGoalTargetDate('');
    setGoalDailyHabit('');
    setGoalMilestones(['', '', '']);
    setGoalNotes('');
    setAiIdeaPrompt('');
  };

  const handleRunAIAssist = async () => {
    if (!aiIdeaPrompt.trim()) return;
    setIsAIGenerating(true);
    try {
      const generated = await onGenerateAIGoal(aiIdeaPrompt, goalCategory, '30 days');
      if (generated) {
        if (generated.title) setGoalTitle(generated.title);
        if (generated.description) setGoalDescription(generated.description);
        if (generated.dailyHabit) setGoalDailyHabit(generated.dailyHabit);
        if (generated.milestones && Array.isArray(generated.milestones)) {
          setGoalMilestones(generated.milestones.map((m: any) => typeof m === 'string' ? m : m.title));
        }
      }
    } finally {
      setIsAIGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 bg-zinc-50/50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Personal Goals & Milestones
              </h1>
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                {totalGoals} active
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Structure long-term ambitions into verifiable micro-habits and daily milestones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-create-goal-modal"
              onClick={() => {
                resetForm();
                setIsCreatingModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-4 py-2.5 text-xs md:text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Goal</span>
            </button>
          </div>
        </div>

        {/* Progress Metrics Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-xs">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Average Progress</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{averageProgress}%</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">across all goals</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-xs">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Milestones Checked</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{completedMilestones}</span>
              <span className="text-xs text-zinc-400">/ {totalMilestones} steps</span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              Micro-actions completed
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-xs">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Completed Goals</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedGoals}</span>
              <span className="text-xs text-zinc-400">/ {totalGoals}</span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              100% finished goals
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-xs">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Privacy Encryption</div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                {isVaultUnlocked ? "Unlocked (AES)" : "Encrypted"}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              Zero-knowledge notes
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/50">
            <Target className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              No goals in {selectedCategory} yet
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Savean can help you translate any raw thought or ambition into a structured goal with achievable milestones.
            </p>
            <button
              onClick={() => setIsCreatingModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create with Savean AI</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGoals.map((goal) => {
              const isExpanded = expandedGoalIds[goal.id] ?? true;
              return (
                <div
                  key={goal.id}
                  id={`goal-card-${goal.id}`}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  {/* Goal Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {goal.category}
                        </span>
                        {goal.isEncrypted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                            <Lock className="h-2.5 w-2.5" />
                            <span>Vault Protected</span>
                          </span>
                        )}
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Target: {goal.targetDate}</span>
                        </span>
                      </div>

                      <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {goal.title}
                      </h2>

                      {goal.description && (
                        <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(goal.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Toggle Milestones"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Delete Goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-500">Progress</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{goal.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily Habit Pill */}
                  {goal.dailyHabit && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                      <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                      <span><strong>Daily Habit:</strong> {goal.dailyHabit}</span>
                    </div>
                  )}

                  {/* Expandable Milestones Section */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Milestones ({goal.milestones?.filter((m) => m.completed).length || 0} of {goal.milestones?.length || 0})
                      </div>
                      <div className="space-y-1.5">
                        {goal.milestones?.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleMilestoneToggle(goal, m.id)}
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <button
                              type="button"
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                m.completed
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-zinc-300 dark:border-zinc-700'
                              }`}
                            >
                              {m.completed && <Check className="h-3 w-3" />}
                            </button>
                            <span
                              className={`flex-1 ${
                                m.completed
                                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                                  : 'text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {m.title}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Goal private notes */}
                      {goal.notes && (
                        <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-600 dark:text-zinc-400">
                          <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                            {goal.isEncrypted ? <Lock className="h-3 w-3 text-emerald-500" /> : null}
                            <span>Personal Journal & Strategy Notes</span>
                          </div>
                          <p>{goal.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create Goal */}
        {isCreatingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Create Personal Goal
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreatingModalOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  ✕
                </button>
              </div>

              {/* AI Auto-Generate helper box */}
              <div className="mt-4 rounded-xl border border-indigo-200/70 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Savean AI Goal Strategist</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Have a rough ambition? Type it here and Savean will generate SMART milestones and habit routines for you.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Read 12 books this year, run a 5k, learn Spanish..."
                    value={aiIdeaPrompt}
                    onChange={(e) => setAiIdeaPrompt(e.target.value)}
                    className="flex-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRunAIAssist}
                    disabled={isAIGenerating || !aiIdeaPrompt.trim()}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isAIGenerating ? 'Structuring...' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateGoalSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="What do you want to accomplish?"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Category
                    </label>
                    <select
                      value={goalCategory}
                      onChange={(e) => setGoalCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Career">Career</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="Mindset">Mindset</option>
                      <option value="Learning">Learning</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={goalTargetDate}
                      onChange={(e) => setGoalTargetDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Daily Micro-Habit (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Read 15 mins every morning with coffee"
                    value={goalDailyHabit}
                    onChange={(e) => setGoalDailyHabit(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Sequential Milestones (3-4 Steps)
                  </label>
                  <div className="space-y-2">
                    {goalMilestones.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-zinc-400 text-xs w-4">{idx + 1}.</span>
                        <input
                          type="text"
                          placeholder={`Milestone ${idx + 1}`}
                          value={m}
                          onChange={(e) => {
                            const copy = [...goalMilestones];
                            copy[idx] = e.target.value;
                            setGoalMilestones(copy);
                          }}
                          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoalMilestones([...goalMilestones, ''])}
                    className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + Add another milestone
                  </button>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Encrypted Strategy & Reflections Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Private notes, obstacles to watch for..."
                    value={goalNotes}
                    onChange={(e) => setGoalNotes(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="encrypt-checkbox"
                    checked={encryptNotes}
                    onChange={(e) => setEncryptNotes(e.target.checked)}
                    className="rounded border-zinc-300 text-indigo-600"
                  />
                  <label htmlFor="encrypt-checkbox" className="text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    Encrypt notes with AES-256 in Savean Vault
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsCreatingModalOpen(false)}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
