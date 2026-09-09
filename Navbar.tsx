import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  User,
  Menu,
  CheckCircle2,
  Flame,
  KeyRound
} from 'lucide-react';
import type { ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserProfile | null;
  isVaultUnlocked: boolean;
  onToggleVaultModal: () => void;
  onOpenAuthModal: () => void;
  onToggleSidebar: () => void;
  currentStreak: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  isVaultUnlocked,
  onToggleVaultModal,
  onOpenAuthModal,
  onToggleSidebar,
  currentStreak
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 px-4 md:px-6 backdrop-blur-md transition-colors">
      {/* Left section: Sidebar toggle & Logo */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div
          id="brand-logo"
          onClick={() => setActiveTab('chat')}
          className="flex cursor-pointer items-center gap-2.5 group"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-sky-400 shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Savean
              </span>
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                AI
              </span>
            </div>
            <span className="hidden sm:inline text-[10px] text-zinc-500 dark:text-zinc-400 -mt-0.5">
              Thought Organizer & Goal Companion
            </span>
          </div>
        </div>
      </div>

      {/* Center navigation tabs (desktop) */}
      <nav className="hidden md:flex items-center gap-1 rounded-full bg-zinc-100/90 dark:bg-zinc-900/90 p-1 border border-zinc-200/60 dark:border-zinc-800/60">
        <button
          id="nav-tab-chat"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Sparkles className="h-4 w-4 text-indigo-500" />
          Chat
        </button>

        <button
          id="nav-tab-daily"
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === 'daily'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Daily Progress
        </button>

        <button
          id="nav-tab-goals"
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === 'goals'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Flame className="h-4 w-4 text-amber-500" />
          Goals
        </button>

        <button
          id="nav-tab-history"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          History
        </button>
      </nav>

      {/* Right controls: Streak, Vault status & User profile */}
      <div className="flex items-center gap-2.5">
        {/* Daily streak indicator */}
        <div
          id="streak-badge"
          title={`${currentStreak} day thought organization streak`}
          className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400"
        >
          <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span>{currentStreak}d streak</span>
        </div>

        {/* Encrypted Vault Button */}
        <button
          id="btn-vault-status"
          onClick={onToggleVaultModal}
          title={isVaultUnlocked ? "Vault is Unlocked (AES-256)" : "Vault is Locked (AES-256)"}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
            isVaultUnlocked
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-zinc-300 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300'
          }`}
        >
          {isVaultUnlocked ? (
            <>
              <Unlock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Encrypted Vault</span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Vault Locked</span>
            </>
          )}
        </button>

        {/* User profile / login avatar */}
        {user && !user.isAnonymous ? (
          <button
            id="btn-user-profile"
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 p-1 pr-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-xs font-bold text-white uppercase shadow-sm">
              {user.displayName ? user.displayName[0] : 'U'}
            </div>
            <span className="max-w-[90px] truncate text-xs font-medium text-zinc-800 dark:text-zinc-200 hidden sm:inline">
              {user.displayName || user.email.split('@')[0]}
            </span>
            {user.mfa?.enabled && (
              <span title="MFA Protected">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              </span>
            )}
          </button>
        ) : (
          <button
            id="btn-open-login"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity"
          >
            <User className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
