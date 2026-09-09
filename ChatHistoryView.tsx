import React, { useState } from 'react';
import {
  History,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Download,
  Calendar,
  Sparkles,
  Tag,
  ArrowRight,
  ExternalLink,
  Edit2,
  Check,
  X,
  FileText
} from 'lucide-react';
import type { Conversation } from '../types';

interface ChatHistoryViewProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
  onExportConversation: (conv: Conversation) => void;
  onOpenInChat: (id: string) => void;
}

export const ChatHistoryView: React.FC<ChatHistoryViewProps> = ({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onTogglePin,
  onRenameConversation,
  onExportConversation,
  onOpenInChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(
    conversations.length > 0 ? conversations[0].id : null
  );
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  // Collect all unique tags
  const allTags = Array.from(
    new Set(conversations.flatMap((c) => c.tags || ['#general', '#goals']))
  );

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages?.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag ? c.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  const activeConv = conversations.find((c) => c.id === activePreviewId) || null;

  const startRename = (c: Conversation) => {
    setEditingTitleId(c.id);
    setEditingTitleText(c.title);
  };

  const saveRename = async (id: string) => {
    if (editingTitleText.trim()) {
      await onRenameConversation(id, editingTitleText.trim());
    }
    setEditingTitleId(null);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-zinc-50/50 dark:bg-zinc-950">
      {/* Left Column: Search & Conversations List */}
      <div className="w-full md:w-96 flex flex-col border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60">
        {/* Header & Search */}
        <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Chat History
              </h1>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              {conversations.length} sessions
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              id="history-search-input"
              type="text"
              placeholder="Search past conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-2 pl-9 pr-3 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Tag Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-2.5 py-0.5 font-medium transition-colors shrink-0 ${
                selectedTag === null
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              All
            </button>
            {allTags.slice(0, 5).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors shrink-0 ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* List of Conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No conversations found matching your search.
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = c.id === activePreviewId;
              const dateStr = new Date(c.updatedAt || c.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={c.id}
                  id={`history-item-${c.id}`}
                  onClick={() => setActivePreviewId(c.id)}
                  className={`p-3.5 cursor-pointer text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${
                    isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {c.isPinned && <Pin className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />}
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {c.title}
                      </h3>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">{dateStr}</span>
                  </div>

                  <p className="mt-1 text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {c.preview || 'No preview available'}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{c.messages?.length || 0} messages</span>
                    </span>

                    <div className="flex items-center gap-2 opacity-80">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(c.id);
                        }}
                        title="Pin / Unpin"
                        className="hover:text-amber-500"
                      >
                        <Pin className={`h-3 w-3 ${c.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(c.id);
                        }}
                        title="Delete session"
                        className="hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Full Conversation Transcript Preview */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
        {activeConv ? (
          <>
            {/* Preview Header */}
            <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                {editingTitleId === activeConv.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingTitleText}
                      onChange={(e) => setEditingTitleText(e.target.value)}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      onClick={() => saveRename(activeConv.id)}
                      className="p-1 text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingTitleId(null)}
                      className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {activeConv.title}
                    </h2>
                    <button
                      onClick={() => startRename(activeConv)}
                      title="Rename conversation"
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-export-chat"
                  onClick={() => onExportConversation(activeConv)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                </button>

                <button
                  id="btn-open-in-chat"
                  onClick={() => onOpenInChat(activeConv.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
                >
                  <span>Resume Chat</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Transcript scroll area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {activeConv.messages?.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs text-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-xs'
                          : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-xs text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="text-[10px] text-zinc-400 font-medium mb-1">
                        {isUser ? 'You' : 'Savean AI'} •{' '}
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
            <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Select a conversation
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Click on any past session from the list on the left to inspect its full transcript and history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
