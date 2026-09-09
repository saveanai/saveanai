import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Target,
  Brain,
  Lightbulb,
  Compass,
  ArrowRight,
  ShieldCheck,
  Lock,
  PlusCircle,
  Zap,
  RotateCcw
} from 'lucide-react';
import type { Conversation, ChatMessage, Goal } from '../types';

interface ChatViewProps {
  conversation: Conversation | null;
  onSendMessage: (text: string, options?: { thinkingMode?: boolean }) => Promise<void>;
  isLoading: boolean;
  onOpenGoalCreatorWithIdea: (idea: string) => void;
  isVaultUnlocked: boolean;
  userName: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onSendMessage,
  isLoading,
  onOpenGoalCreatorWithIdea,
  isVaultUnlocked,
  userName
}) => {
  const [inputText, setInputText] = useState('');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = conversation?.messages || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await onSendMessage(text, { thinkingMode });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*#_`~>]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(id);
    window.speechSynthesis.speak(utterance);
  };

  // Speech to Text Dictation (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use keyboard input.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const starterPrompts = [
    {
      title: "Organize Racing Thoughts",
      desc: "Untangle a brain-dump into clear themes and actionable insights.",
      prompt: "I have a lot of racing thoughts right now. Can you help me untangle and organize them into clear themes, priorities, and action steps?",
      icon: Brain,
      color: "from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400"
    },
    {
      title: "Design a 30-Day Goal",
      desc: "Turn a vague aspiration into a SMART roadmap with milestones.",
      prompt: "Help me turn my ambition into a structured 30-day goal with weekly milestones and daily micro-habits.",
      icon: Target,
      color: "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400"
    },
    {
      title: "Daily Mindful Reflection",
      desc: "Review what went well today and prepare focus for tomorrow.",
      prompt: "Guide me through a focused daily reflection: what I accomplished, mental friction I felt, and my primary intention for tomorrow.",
      icon: Compass,
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Deconstruct Overwhelming Project",
      desc: "Break a massive task into frictionless 15-minute steps.",
      prompt: "I am feeling overwhelmed by a project. Can you help me deconstruct it into sequential 15-minute micro-tasks so I can start without hesitation?",
      icon: Lightbulb,
      color: "from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400"
    }
  ];

  return (
    <div className="relative flex flex-1 flex-col h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-zinc-950">
      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Welcome Screen if empty */}
          {messages.length === 0 ? (
            <div className="py-6 md:py-12 space-y-8 animate-in fade-in duration-300">
              {/* Gemini style greeting */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Savean AI Assistant</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Hello, {userName || 'Friend'}
                </h1>
                <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
                  Where shall we direct your focus? Tell me your unorganized thoughts, ideas, or goals, and I will structure them into clarity.
                </p>
              </div>

              {/* Starter Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {starterPrompts.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      id={`starter-card-${idx}`}
                      onClick={() => onSendMessage(card.prompt, { thinkingMode })}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left bg-gradient-to-br hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-xs hover:shadow-md ${card.color}`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 shadow-xs">
                          <Icon className="h-4 w-4" />
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                        {card.title}
                      </h2>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {card.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Privacy Callout */}
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/70 dark:bg-zinc-900/50 p-3.5 text-xs text-zinc-600 dark:text-zinc-400">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <span>
                  <strong>Encrypted Storage Active:</strong> Your private notes, goal reflections, and sensitive thoughts can be encrypted client-side using AES-256 GCM before syncing.
                </span>
              </div>
            </div>
          ) : (
            /* Messages Thread */
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  id={`message-${msg.id}`}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Savean AI Avatar */}
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-sky-400 text-white shadow-sm mt-0.5">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 md:p-5 ${
                      isUser
                        ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 rounded-tr-xs'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs text-zinc-900 dark:text-zinc-100 rounded-tl-xs'
                    }`}
                  >
                    {/* User message */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    ) : (
                      /* AI Markdown response */
                      <div className="space-y-3">
                        <div className="markdown-body prose dark:prose-invert max-w-none text-sm leading-relaxed prose-headings:font-semibold prose-h3:text-base prose-h2:text-lg prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/50 dark:prose-blockquote:bg-indigo-950/20 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r-lg">
                          <Markdown>{msg.content}</Markdown>
                        </div>

                        {/* Action buttons on AI messages */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                          <button
                            id={`btn-turn-into-goal-${msg.id}`}
                            onClick={() => onOpenGoalCreatorWithIdea(msg.content)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                          >
                            <Target className="h-3.5 w-3.5" />
                            <span>Turn into Goal</span>
                          </button>

                          <button
                            onClick={() => handleSpeak(msg.id, msg.content)}
                            title="Read Aloud"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                          >
                            {isSpeaking === msg.id ? (
                              <>
                                <VolumeX className="h-3.5 w-3.5 text-red-500" />
                                <span className="text-[11px] text-red-500">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3.5 w-3.5" />
                                <span className="text-[11px]">Listen</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            title="Copy message"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-[11px] text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>

                          {msg.isEncrypted && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 ml-auto">
                              <Lock className="h-3 w-3" />
                              <span>Encrypted</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex gap-3.5 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-sky-400 text-white shadow-sm animate-pulse">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                  </div>
                  <span>Savean is analyzing your thoughts & goals...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Gemini-style Input Bar */}
      <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-3 md:p-4">
        <div className="mx-auto max-w-3xl">
          {/* Controls pill row */}
          <div className="flex items-center justify-between pb-2 px-1 text-xs">
            <div className="flex items-center gap-2">
              {/* Thinking Mode Toggle */}
              <button
                id="btn-toggle-thinking-mode"
                onClick={() => setThinkingMode(!thinkingMode)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${
                  thinkingMode
                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-transparent hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Zap className="h-3 w-3" />
                <span>Deep Thinking Mode</span>
              </button>

              {/* Quick Prompt Helper */}
              <button
                onClick={() => setInputText("Here is a brain-dump of what's currently stressing me out: ")}
                className="hidden sm:inline-flex items-center gap-1 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Brain className="h-3 w-3" />
                <span>Thought Dump</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <span>Savean Gemini 2.5</span>
            </div>
          </div>

          {/* Textarea Capsule Container */}
          <div className="relative flex items-end rounded-2xl border border-zinc-300/80 dark:border-zinc-700/80 bg-zinc-50/90 dark:bg-zinc-900/90 p-2 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <textarea
              id="chat-textarea-input"
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Savean to organize thoughts, build a goal, or reflect..."
              className="flex-1 max-h-44 resize-none bg-transparent px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />

            <div className="flex items-center gap-1.5 pb-1 pr-1">
              {/* Voice Speech to Text button */}
              <button
                id="btn-voice-input"
                type="button"
                onClick={toggleSpeechRecognition}
                title={isListening ? "Listening... click to stop" : "Speak your thoughts"}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              {/* Send Button */}
              <button
                id="btn-send-chat"
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                aria-label="Send message"
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  inputText.trim() && !isLoading
                    ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm hover:opacity-90'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-1.5 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
            Savean is your personal thought organizer and goal mentor. Review AI-suggested milestones before committing.
          </p>
        </div>
      </div>
    </div>
  );
};
