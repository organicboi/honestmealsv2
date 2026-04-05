'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Send, Plus, MessageSquare, Trash2, Zap, 
    Dumbbell, Utensils, X, Activity, TrendingUp, ArrowRight,
    Loader2, Sparkles, Bot, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

import { 
    getChatMessages, createChat, 
    sendMessage, getUserCredits, deleteChat,
    sendDialogueMessage, getPlanData
} from '@/app/actions/gymna';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlanType, DialogueResponse, DietPlanData, WorkoutPlanData } from '@/types/gymna.types';
import DialogueFlow from '@/components/gymna/DialogueFlow';
import DietPlanTable from '@/components/gymna/DietPlanTable';
import WorkoutPlanTable from '@/components/gymna/WorkoutPlanTable';
import GeneratingOverlay from '@/components/gymna/GeneratingOverlay';

interface Chat {
    id: string;
    title: string;
    updated_at: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type: string;
    created_at: string;
}

interface PlanDataItem {
    id: string;
    plan_type: PlanType;
    plan_title: string;
    parsed_data: DietPlanData | WorkoutPlanData;
    created_at: string;
}

// ─── Action token parser ────────────────────────────────────────
// Gemini embeds [ACTION:/route|Label] in responses for Honest Meals features.
// We strip them from the markdown and render them as buttons below the text.
interface ActionToken { route: string; label: string; }

const ACTION_REGEX = /\[ACTION:([^|\]]+)\|([^\]]+)\]/g;

function parseActions(raw: string): { cleanContent: string; actions: ActionToken[] } {
    const actions: ActionToken[] = [];
    const cleanContent = raw.replace(ACTION_REGEX, (_, route, label) => {
        actions.push({ route: route.trim(), label: label.trim() });
        return ''; // remove token from rendered text
    }).trim();
    return { cleanContent, actions };
}

// Icon map per route
const ROUTE_ICON: Record<string, React.ReactNode> = {
    '/order':    <Utensils className="h-3.5 w-3.5" />,
    '/health':   <Activity className="h-3.5 w-3.5" />,
    '/workout':  <Dumbbell className="h-3.5 w-3.5" />,
    '/progress': <TrendingUp className="h-3.5 w-3.5" />,
    '/askme':    <Sparkles className="h-3.5 w-3.5" />,
};

// ─── Markdown renderer ──────────────────────────────────────────
function MarkdownText({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => <h1 className="text-base font-bold text-gray-900 mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-gray-900 mt-3 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mt-2 mb-0.5">{children}</h3>,
                h4: ({ children }) => <h4 className="text-sm font-semibold text-gray-700 mt-2">{children}</h4>,
                p: ({ children }) => <p className="text-sm leading-relaxed text-gray-800 mb-1.5 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                del: ({ children }) => <del className="line-through text-gray-500">{children}</del>,
                code: ({ inline, children, ...props }: any) =>
                    inline ? (
                        <code className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 text-xs font-mono border border-orange-100">{children}</code>
                    ) : (
                        <code className="block w-full text-xs font-mono">{children}</code>
                    ),
                pre: ({ children }) => (
                    <pre className="my-2 p-3 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto">{children}</pre>
                ),
                ul: ({ children }) => <ul className="my-1.5 space-y-1 pl-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-1.5 space-y-1 pl-1 list-none">{children}</ol>,
                li: ({ children, ordered, index, ...props }: any) => (
                    <li className="flex items-start gap-2 text-sm text-gray-800">
                        <span className="shrink-0 mt-1.5">
                            {ordered
                                ? <span className="text-orange-500 font-bold text-xs">{(index ?? 0) + 1}.</span>
                                : <span className="h-1.5 w-1.5 rounded-full bg-orange-400 block mt-0.5" />
                            }
                        </span>
                        <span className="flex-1">{children}</span>
                    </li>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-orange-300 pl-3 my-2 bg-orange-50/50 rounded-r-lg py-1 text-sm text-gray-700 italic">
                        {children}
                    </blockquote>
                ),
                hr: () => <hr className="my-3 border-gray-200" />,
                table: ({ children }) => (
                    <div className="overflow-x-auto my-2 rounded-xl border border-gray-200">
                        <table className="w-full text-xs">{children}</table>
                    </div>
                ),
                thead: ({ children }) => <thead className="bg-orange-50">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => <th className="px-3 py-2 text-left font-bold text-gray-700 text-xs">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-gray-700 text-xs">{children}</td>,
                a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-600 underline underline-offset-2 hover:text-orange-800">
                        {children}
                    </a>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

// ─── Full assistant message: markdown + action buttons ──────────
function AssistantMessage({ content }: { content: string }) {
    const router = useRouter();
    const { cleanContent, actions } = parseActions(content);

    return (
        <div>
            <MarkdownText content={cleanContent} />
            {actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {actions.map((action, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08 }}
                            onClick={() => router.push(action.route)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
                        >
                            {ROUTE_ICON[action.route] ?? <ArrowRight className="h-3.5 w-3.5" />}
                            {action.label}
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    );
}

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

interface GymnaClientProps {
    user: any;
    initialChats: Chat[];
    initialCredits: number;
}

export default function GymnaClient({ user, initialChats, initialCredits }: GymnaClientProps) {
    const [chats, setChats] = useState<Chat[]>(initialChats);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [planData, setPlanData] = useState<PlanDataItem[]>([]);
    const [input, setInput] = useState('');
    const [credits, setCredits] = useState(initialCredits);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [currentPlanType, setCurrentPlanType] = useState<PlanType | null>(null);
    // Mobile: sidebar shown as a drawer
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showDialogue, setShowDialogue] = useState(false);
    const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (currentChatId) {
            loadMessages(currentChatId);
            loadPlanData(currentChatId);
        } else {
            setMessages([]);
            setPlanData([]);
        }
    }, [currentChatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
        }
    }, [input]);

    const loadMessages = async (chatId: string) => {
        setLoading(true);
        try {
            const msgs = await getChatMessages(chatId);
            setMessages(msgs as any);
        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const loadPlanData = async (chatId: string) => {
        try {
            const data = await getPlanData(chatId);
            setPlanData(data as any);
        } catch (error) {
            console.error('Error loading plan data:', error);
        }
    };

    const handleSelectChat = (chatId: string) => {
        setCurrentChatId(chatId);
        setSidebarOpen(false);
    };

    const handleCreateChat = async () => {
        try {
            const newChat = await createChat('New Conversation');
            setChats([newChat, ...chats]);
            setCurrentChatId(newChat.id);
            setSidebarOpen(false);
        } catch (error) {
            toast.error('Failed to create chat');
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;
        try {
            await deleteChat(chatId);
            setChats(chats.filter(c => c.id !== chatId));
            if (currentChatId === chatId) {
                setCurrentChatId(null);
            }
            toast.success('Chat deleted');
        } catch (error) {
            toast.error('Failed to delete chat');
        }
    };

    const handleSendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;
        if (credits <= 0) {
            toast.error('Insufficient credits! Please upgrade.');
            return;
        }

        setInput('');
        setSending(true);

        const tempUserMsg: Message = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content: trimmed,
            type: 'text',
            created_at: new Date().toISOString()
        };

        try {
            let chatId = currentChatId;
            if (!chatId) {
                const newChat = await createChat(trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : ''));
                setChats(prev => [newChat, ...prev]);
                setCurrentChatId(newChat.id);
                chatId = newChat.id;
            }

            // Optimistic UI
            setMessages(prev => [...prev, tempUserMsg]);

            await sendMessage(chatId!, trimmed);

            // Reload authoritative messages from DB
            const [updatedMsgs, newCredits] = await Promise.all([
                getChatMessages(chatId!),
                getUserCredits()
            ]);
            setMessages(updatedMsgs as any);
            setCredits(newCredits);

            // Update chat title in sidebar list
            setChats(prev => prev.map(c => c.id === chatId ? { ...c, updated_at: new Date().toISOString() } : c));

        } catch (error: any) {
            console.error('Error sending message:', error);
            toast.error(error.message || 'Failed to send message');
            // Rollback optimistic message
            setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
            if (currentChatId) loadMessages(currentChatId);
        } finally {
            setSending(false);
        }
    };

    const startPlanGeneration = (planType: PlanType) => {
        if (credits <= 0) {
            toast.error('Insufficient credits! You need at least 1 credit to generate a plan.');
            return;
        }
        setSelectedPlanType(planType);
        setShowDialogue(true);
        setSidebarOpen(false);
    };

    const handleDialogueComplete = async (responses: DialogueResponse[]) => {
        setShowDialogue(false);
        setGenerating(true);
        setCurrentPlanType(selectedPlanType);

        try {
            let chatId = currentChatId;
            if (!chatId) {
                const planTitle = selectedPlanType === 'diet' ? 'Diet Plan' : 'Workout Plan';
                const newChat = await createChat(planTitle);
                setChats(prev => [newChat, ...prev]);
                setCurrentChatId(newChat.id);
                chatId = newChat.id;
            }

            const result = await sendDialogueMessage(chatId!, selectedPlanType!, responses);

            if (result.success) {
                toast.success('Plan generated successfully! 🎉');
                if (chatId) {
                    const [updatedMsgs, updatedPlans, newCredits] = await Promise.all([
                        getChatMessages(chatId),
                        getPlanData(chatId),
                        getUserCredits()
                    ]);
                    setMessages(updatedMsgs as any);
                    setPlanData(updatedPlans as any);
                    setCredits(newCredits);
                }
            }
        } catch (error: any) {
            console.error('Error generating plan:', error);
            toast.error(error.message || 'Failed to generate plan');
        } finally {
            setGenerating(false);
            setCurrentPlanType(null);
            setSelectedPlanType(null);
        }
    };

    const currentChat = chats.find(c => c.id === currentChatId);
    const hasConversation = currentChatId !== null;
    const visibleMessages = messages.filter(msg => msg.type !== 'plan_json');

    return (
        // Full-screen container; pb-24 on mobile accounts for the bottom nav
        <div className="flex h-dvh bg-gray-50 overflow-hidden relative">

            {/* --- Dialogue & Generating Overlays --- */}
            <AnimatePresence>
                {showDialogue && selectedPlanType && (
                    <DialogueFlow
                        planType={selectedPlanType}
                        onComplete={handleDialogueComplete}
                        onCancel={() => { setShowDialogue(false); setSelectedPlanType(null); }}
                    />
                )}
            </AnimatePresence>

            {generating && currentPlanType && <GeneratingOverlay planType={currentPlanType} />}

            {/* --- Mobile Sidebar Backdrop --- */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* --- Sidebar --- */}
            <AnimatePresence>
                {(sidebarOpen) && (
                    <motion.aside
                        key="sidebar"
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="fixed md:relative inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col shadow-xl md:shadow-none"
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-bold text-gray-900">Gymna AI</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
                            >
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>

                        {/* New Chat Button */}
                        <div className="p-3 flex-shrink-0">
                            <button
                                onClick={handleCreateChat}
                                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-200 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                New Chat
                            </button>
                        </div>

                        {/* Plan generators section */}
                        <div className="px-3 pb-2 flex-shrink-0">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Generate a Plan</p>
                            <div className="space-y-1.5">
                                <button
                                    onClick={() => startPlanGeneration('diet')}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors text-sm font-medium text-gray-600 group"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                        <Utensils className="h-3.5 w-3.5 text-green-600" />
                                    </div>
                                    Diet Plan
                                </button>
                                <button
                                    onClick={() => startPlanGeneration('workout')}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium text-gray-600 group"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <Dumbbell className="h-3.5 w-3.5 text-blue-600" />
                                    </div>
                                    Workout Plan
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="px-3 pb-2">
                            <div className="border-t border-gray-100" />
                        </div>

                        {/* Chat list */}
                        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
                            {chats.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">No chats yet. Start a conversation!</p>
                            ) : (
                                chats.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => handleSelectChat(chat.id)}
                                        className={`
                                            group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors
                                            ${currentChatId === chat.id
                                                ? 'bg-orange-50 border border-orange-100'
                                                : 'hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                            <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${currentChatId === chat.id ? 'text-orange-500' : 'text-gray-400'}`} />
                                            <div className="min-w-0">
                                                <p className={`text-sm truncate ${currentChatId === chat.id ? 'font-semibold text-orange-900' : 'font-medium text-gray-700'}`}>
                                                    {chat.title}
                                                </p>
                                                <p className="text-xs text-gray-400">{formatRelativeTime(chat.updated_at)}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-50 shrink-0 ml-1"
                                            onClick={(e) => handleDeleteChat(e, chat.id)}
                                        >
                                            <Trash2 className="h-3 w-3 text-red-400" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* App navigation */}
                        <div className="px-3 pb-2 border-t border-gray-100 pt-2 flex-shrink-0">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Navigate</p>
                            <div className="grid grid-cols-3 gap-1.5">
                                {[
                                    { href: '/meals', label: 'Meals', icon: <Utensils className="h-4 w-4" /> },
                                    { href: '/health', label: 'Health', icon: <Activity className="h-4 w-4" /> },
                                    { href: '/workout', label: 'Workout', icon: <Dumbbell className="h-4 w-4" /> },
                                ].map(({ href, label, icon }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors"
                                    >
                                        {icon}
                                        <span className="text-[10px] font-medium">{label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Credits footer */}
                        <div className="p-3 border-t border-gray-100 flex-shrink-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-gray-500">Credits remaining</span>
                                <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    {credits}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-orange-400 to-red-400 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar (always visible on md+) */}
            <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col shadow-sm flex-shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-900">Gymna AI</span>
                </div>
                {/* New Chat */}
                <div className="p-3 flex-shrink-0">
                    <button
                        onClick={handleCreateChat}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-md shadow-orange-200 hover:shadow-lg transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        New Chat
                    </button>
                </div>
                {/* Plan generators */}
                <div className="px-3 pb-2 flex-shrink-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Generate a Plan</p>
                    <div className="space-y-1.5">
                        <button
                            onClick={() => startPlanGeneration('diet')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors text-sm font-medium text-gray-600 group"
                        >
                            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <Utensils className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            Diet Plan
                        </button>
                        <button
                            onClick={() => startPlanGeneration('workout')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium text-gray-600 group"
                        >
                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Dumbbell className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            Workout Plan
                        </button>
                    </div>
                </div>
                {/* Divider */}
                <div className="px-3 pb-2"><div className="border-t border-gray-100" /></div>
                {/* Chat list */}
                <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
                    {chats.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">No chats yet. Start a conversation!</p>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat.id)}
                                className={`
                                    group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors
                                    ${currentChatId === chat.id ? 'bg-orange-50 border border-orange-100' : 'hover:bg-gray-50'}
                                `}
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                    <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${currentChatId === chat.id ? 'text-orange-500' : 'text-gray-400'}`} />
                                    <div className="min-w-0">
                                        <p className={`text-sm truncate ${currentChatId === chat.id ? 'font-semibold text-orange-900' : 'font-medium text-gray-700'}`}>
                                            {chat.title}
                                        </p>
                                        <p className="text-xs text-gray-400">{formatRelativeTime(chat.updated_at)}</p>
                                    </div>
                                </div>
                                <button
                                    className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-50 shrink-0 ml-1"
                                    onClick={(e) => handleDeleteChat(e, chat.id)}
                                >
                                    <Trash2 className="h-3 w-3 text-red-400" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
                {/* App navigation */}
                <div className="px-3 pb-2 border-t border-gray-100 pt-2 flex-shrink-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Navigate</p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {[
                            { href: '/meals', label: 'Meals', icon: <Utensils className="h-4 w-4" /> },
                            { href: '/health', label: 'Health', icon: <Activity className="h-4 w-4" /> },
                            { href: '/workout', label: 'Workout', icon: <Dumbbell className="h-4 w-4" /> },
                        ].map(({ href, label, icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                {icon}
                                <span className="text-[10px] font-medium">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Credits */}
                <div className="p-3 border-t border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">Credits remaining</span>
                        <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {credits}
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                            className="bg-gradient-to-r from-orange-400 to-red-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </aside>

            {/* --- Main Chat Area --- */}
            <div className="flex-1 flex flex-col h-full min-w-0">

                {/* ── Top bar ── */}
                <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-100 bg-white/90 backdrop-blur-sm flex-shrink-0">
                    {/* Mobile: back / menu */}
                    {hasConversation ? (
                        <button
                            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            onClick={() => setCurrentChatId(null)}
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                    ) : (
                        <button
                            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <div className="flex flex-col gap-1">
                                <span className="block h-0.5 w-4 bg-gray-600 rounded" />
                                <span className="block h-0.5 w-3 bg-gray-600 rounded" />
                                <span className="block h-0.5 w-4 bg-gray-600 rounded" />
                            </div>
                        </button>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-900 text-sm truncate">
                            {currentChat?.title || 'Gymna AI'}
                        </h2>
                        {!hasConversation && (
                            <p className="text-xs text-gray-400 hidden md:block">Your personal AI fitness & nutrition coach</p>
                        )}
                    </div>
                    {/* Credits badge - top right, mobile-visible */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-xs font-semibold border border-orange-100">
                        <Zap className="h-3 w-3" />
                        {credits}
                    </div>
                    {/* Desktop: toggle sidebar button (for new chat on mobile) */}
                    {!hasConversation && (
                        <button
                            className="md:hidden p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm"
                            onClick={handleCreateChat}
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* ── Messages / Welcome ── */}
                <div className="flex-1 overflow-y-auto">
                    {/* Loading state */}
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                <p className="text-sm text-gray-500">Loading messages...</p>
                            </div>
                        </div>
                    ) : !hasConversation ? (
                        // ── Welcome / Empty State ──
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col items-center justify-center h-full px-4 pb-4 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200 mb-5">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Welcome to Gymna AI</h1>
                            <p className="text-sm text-gray-500 mb-8 max-w-xs">
                                Your personal AI fitness & nutrition coach. Ask anything or generate a customized plan.
                            </p>

                            {/* Generator cards */}
                            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
                                <button
                                    onClick={() => startPlanGeneration('diet')}
                                    className="flex flex-col items-start p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-green-300 hover:shadow-md shadow-sm transition-all text-left group"
                                >
                                    <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-3 group-hover:scale-105 transition-transform shadow-sm">
                                        <Utensils className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">Diet Plan</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Personalized meals & macros</p>
                                </button>
                                <button
                                    onClick={() => startPlanGeneration('workout')}
                                    className="flex flex-col items-start p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-md shadow-sm transition-all text-left group"
                                >
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl mb-3 group-hover:scale-105 transition-transform shadow-sm">
                                        <Dumbbell className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">Workout Plan</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Tailored to your goals</p>
                                </button>
                            </div>

                            {/* Quick prompts */}
                            <div className="w-full max-w-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Questions</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {[
                                        'How much protein do I need?',
                                        'Best exercises for fat loss',
                                        'Meal timing tips',
                                    ].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setInput(q)}
                                            className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-700 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        // ── Conversation ──
                        <div className="flex flex-col gap-4 p-4 pb-2">
                            {/* Plan tables shown first (they live outside message flow) */}
                            {planData.map(plan => (
                                <div key={plan.id}>
                                    {plan.plan_type === 'diet'
                                        ? <DietPlanTable data={plan.parsed_data as DietPlanData} />
                                        : <WorkoutPlanTable data={plan.parsed_data as WorkoutPlanData} />
                                    }
                                </div>
                            ))}

                            {/* Messages */}
                            {visibleMessages.map((msg, idx) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: idx < 3 ? 0 : 0 }}
                                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Bot avatar */}
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    )}

                                    <div
                                        className={`
                                            max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm
                                            ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-sm'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                            }
                                        `}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <AssistantMessage content={msg.content} />
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                        <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                                            {formatRelativeTime(msg.created_at)}
                                        </p>
                                    </div>

                                    {/* User avatar */}
                                    {msg.role === 'user' && (
                                        <div className="w-7 h-7 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                                            <span className="text-xs font-bold text-gray-500">
                                                {user?.email?.[0]?.toUpperCase() ?? 'U'}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {sending && (
                                <div className="flex gap-2.5 justify-start">
                                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                                        <motion.span
                                            className="w-2 h-2 bg-orange-400 rounded-full"
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.span
                                            className="w-2 h-2 bg-orange-400 rounded-full"
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                                        />
                                        <motion.span
                                            className="w-2 h-2 bg-orange-400 rounded-full"
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} className="h-2" />
                        </div>
                    )}
                </div>

                {/* ── Input Bar ── */}
                <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-3">
                    <div className="flex items-end gap-2 max-w-3xl mx-auto bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all px-3 py-2">
                        {/* Plan shortcut buttons hidden on mobile to save space */}
                        <div className="hidden sm:flex items-center gap-1 mb-0.5">
                            <button
                                onClick={() => startPlanGeneration('diet')}
                                title="Generate Diet Plan"
                                className="p-1.5 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
                            >
                                <Utensils className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => startPlanGeneration('workout')}
                                title="Generate Workout Plan"
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                                <Dumbbell className="h-4 w-4" />
                            </button>
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Ask Gymna anything... (Enter to send)"
                            rows={1}
                            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 py-1.5 min-h-[36px] max-h-[160px]"
                            disabled={sending}
                        />

                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || sending}
                            className={`
                                mb-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
                                ${input.trim() && !sending
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200 hover:shadow-lg'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-1.5">
                        1 credit per message • Gymna can make mistakes
                    </p>
                </div>
            </div>
        </div>
    );
}
