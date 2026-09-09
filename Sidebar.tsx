import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Target,
  History,
  User,
  Trash2,
  Pin,
  Lock,
  Search,
  ChevronRight,
  Shield,
  X
} from 'lucide-react';
import type { ActiveTab, Conversation } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  conversations: Conversation[];
  activeConvId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onTogglePinConversation: (id: string, e: React.MouseEvent) => void;
  isVaultUnlocked: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onTogglePinConversation,
  isVaultUnlocked
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredConversations.filter((c) => c.isPinned);
  const recentChats = filteredConversations.filter((c) => !c.isPinned);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleChatClick = (id: string) => {
    onSelectConversation(id);
    setActiveTab('chat');
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: New Chat button & close for mobile */}
        <div className="p-3 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2">
          <button
            id="btn-new-chat"
            onClick={() => {
              onNewChat();
              setActiveTab('chat');
              if (window.innerWidth < 768) onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-indigo-500 hover:to-violet-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
            <Sparkles className="h-3.5 w-3.5 opacity-80" />
          </button>

          <button
            onClick={onClose}
            aria-label="Close Sidebar"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Chats Input */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Primary Views Navigation */}
        <div className="px-3 py-2 space-y-0.5 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <button
            id="side-tab-chat"
            onClick={() => handleTabClick('chat')}
            className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>AI Organizer Chat</span>
          </button>

          <button
            id="side-tab-daily"
            onClick={() => handleTabClick('daily')}
            className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
              activeTab === 'daily'
                ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Daily Progress & Mood</span>
          </button>

          <button
            id="side-tab-goals"
            onClick={() => handleTabClick('goals')}
            className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
              activeTab === 'goals'
                ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Target className="h-4 w-4 text-amber-500" />
            <span>Goals & Milestones</span>
          </button>

          <button
            id="side-tab-history"
            onClick={() => handleTabClick('history')}
            className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <History className="h-4 w-4 text-sky-500" />
            <span>Chat History & Search</span>
          </button>

          <button
            id="side-tab-profile"
            onClick={() => handleTabClick('profile')}
            className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <User className="h-4 w-4 text-violet-500" />
            <span>User Profile & 2FA</span>
          </button>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Pinned Chats */}
          {pinnedChats.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <Pin className="h-3 w-3" />
                <span>Pinned Chats</span>
              </div>
              <div className="space-y-0.5">
                {pinnedChats.map((c) => (
                  <div
                    key={c.id}
                    id={`chat-item-${c.id}`}
                    onClick={() => handleChatClick(c.id)}
                    className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                      activeConvId === c.id && activeTab === 'chat'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      <span className="truncate">{c.title || 'Untitled Session'}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => onTogglePinConversation(c.id, e)}
                        title="Unpin conversation"
                        className="rounded p-1 text-zinc-400 hover:text-amber-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
                      >
                        <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
                      </button>
                      <button
                        onClick={(e) => onDeleteConversation(c.id, e)}
                        title="Delete conversation"
                        className="rounded p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Chats */}
          <div>
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Recent Conversations
            </div>
            {recentChats.length === 0 && pinnedChats.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-zinc-400">
                No past chats yet. Start by tapping &ldquo;New Chat&rdquo; above!
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentChats.map((c) => (
                  <div
                    key={c.id}
                    id={`chat-item-${c.id}`}
                    onClick={() => handleChatClick(c.id)}
                    className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                      activeConvId === c.id && activeTab === 'chat'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{c.title || 'Untitled Session'}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => onTogglePinConversation(c.id, e)}
                        title="Pin conversation"
                        className="rounded p-1 text-zinc-400 hover:text-amber-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
                      >
                        <Pin className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => onDeleteConversation(c.id, e)}
                        title="Delete conversation"
                        className="rounded p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Privacy Status Banner */}
        <div className="p-3 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  AES-256 Storage
                </span>
                <span className="text-[10px] text-zinc-500">
                  {isVaultUnlocked ? 'Vault unlocked' : 'Zero-knowledge enabled'}
                </span>
              </div>
            </div>
            <div className={`h-2 w-2 rounded-full ${isVaultUnlocked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
        </div>
      </aside>
    </>
  );
};
