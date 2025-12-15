'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Send, Plus, MessageSquare, Trash2, Zap, 
    Dumbbell, Utensils, ChevronRight, Menu, X,
    Loader2, Sparkles, Bot, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    getChats, getChatMessages, createChat, 
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

export default function GymnaClient({ user }: { user: any }) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [planData, setPlanData] = useState<PlanDataItem[]>([]);
    const [input, setInput] = useState('');
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [currentPlanType, setCurrentPlanType] = useState<PlanType | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showDialogue, setShowDialogue] = useState(false);
    const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

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
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadInitialData = async () => {
        try {
            const [fetchedChats, fetchedCredits] = await Promise.all([
                getChats(),
                getUserCredits()
            ]);
            setChats(fetchedChats);
            setCredits(fetchedCredits);
            
            if (fetchedChats.length > 0 && !currentChatId) {
                // Don't auto-select, let user choose or start new
                // setCurrentChatId(fetchedChats[0].id);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load Gymna data");
        }
    };

    const loadMessages = async (chatId: string) => {
        setLoading(true);
        try {
            const msgs = await getChatMessages(chatId);
            setMessages(msgs as any);
        } catch (error) {
            console.error("Error loading messages:", error);
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    const loadPlanData = async (chatId: string) => {
        try {
            const data = await getPlanData(chatId);
            setPlanData(data as any);
        } catch (error) {
            console.error("Error loading plan data:", error);
        }
    };

    const handleCreateChat = async () => {
        try {
            const newChat = await createChat("New Conversation");
            setChats([newChat, ...chats]);
            setCurrentChatId(newChat.id);
            setSidebarOpen(false); // On mobile, close sidebar
        } catch (error) {
            toast.error("Failed to create chat");
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat?")) return;
        
        try {
            await deleteChat(chatId);
            setChats(chats.filter(c => c.id !== chatId));
            if (currentChatId === chatId) {
                setCurrentChatId(null);
            }
            toast.success("Chat deleted");
        } catch (error) {
            toast.error("Failed to delete chat");
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        if (credits <= 0) {
            toast.error("Insufficient credits! Please upgrade.");
            return;
        }

        const messageContent = input;
        setInput('');
        setSending(true);

        try {
            let chatId = currentChatId;
            if (!chatId) {
                // Create chat if none exists
                const newChat = await createChat(messageContent.slice(0, 30) + "...");
                setChats([newChat, ...chats]);
                setCurrentChatId(newChat.id);
                chatId = newChat.id;
            }

            // Optimistic update
            const tempId = Math.random().toString();
            setMessages(prev => [...prev, {
                id: tempId,
                role: 'user',
                content: messageContent,
                type: 'text',
                created_at: new Date().toISOString()
            }]);

            await sendMessage(chatId!, messageContent);
            
            // Refresh messages and credits
            if (chatId) await loadMessages(chatId);
            const newCredits = await getUserCredits();
            setCredits(newCredits);

        } catch (error: any) {
            console.error("Error sending message:", error);
            toast.error(error.message || "Failed to send message");
            // Remove optimistic message if failed (simplified by reloading)
            if (currentChatId) loadMessages(currentChatId);
        } finally {
            setSending(false);
        }
    };

    const startPlanGeneration = (planType: PlanType) => {
        if (credits <= 0) {
            toast.error("Insufficient credits! You need at least 1 credit to generate a plan.");
            return;
        }
        setSelectedPlanType(planType);
        setShowDialogue(true);
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
                setChats([newChat, ...chats]);
                setCurrentChatId(newChat.id);
                chatId = newChat.id;
            }

            const result = await sendDialogueMessage(chatId!, selectedPlanType!, responses);
            
            if (result.success) {
                toast.success("Plan generated successfully!");
                if (chatId) {
                    await loadMessages(chatId);
                    await loadPlanData(chatId);
                }
                const newCredits = await getUserCredits();
                setCredits(newCredits);
            }

        } catch (error: any) {
            console.error("Error generating plan:", error);
            toast.error(error.message || "Failed to generate plan");
        } finally {
            setGenerating(false);
            setCurrentPlanType(null);
            setSelectedPlanType(null);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
            {/* Dialogue Flow Modal */}
            {showDialogue && selectedPlanType && (
                <DialogueFlow
                    planType={selectedPlanType}
                    onComplete={handleDialogueComplete}
                    onCancel={() => {
                        setShowDialogue(false);
                        setSelectedPlanType(null);
                    }}
                />
            )}

            {/* Generating Overlay */}
            {generating && currentPlanType && (
                <GeneratingOverlay planType={currentPlanType} />
            )}

            {/* Sidebar */}
            <AnimatePresence mode='wait'>
                {(sidebarOpen || window.innerWidth >= 768) && (
                    <motion.div 
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        className={`
                            fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col
                            md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
                            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                        `}
                    >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-xl text-gray-900">
                                <Bot className="h-6 w-6 text-orange-600" />
                                <span>Gymna AI</span>
                            </div>
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-4">
                            <Button onClick={handleCreateChat} className="w-full justify-start gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                                <Plus className="h-4 w-4" /> New Chat
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 space-y-1">
                            {chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => {
                                        setCurrentChatId(chat.id);
                                        if (window.innerWidth < 768) setSidebarOpen(false);
                                    }}
                                    className={`
                                        group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors text-sm
                                        ${currentChatId === chat.id ? 'bg-orange-50 text-orange-900 font-medium' : 'text-gray-600 hover:bg-gray-100'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <MessageSquare className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{chat.title}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                        onClick={(e) => handleDeleteChat(e, chat.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Credits Remaining</span>
                                <span className="text-sm font-bold text-orange-600">{credits}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">1 credit per message</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full w-full relative">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h2 className="font-semibold text-gray-900">
                            {chats.find(c => c.id === currentChatId)?.title || 'New Conversation'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-100">
                            <Zap className="h-3 w-3" />
                            {credits} Credits
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
                    {!currentChatId && messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto p-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="bg-linear-to-br from-orange-500 to-red-500 p-4 rounded-full shadow-lg shadow-orange-200 mb-6 inline-block">
                                    <Sparkles className="h-12 w-12 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Gymna AI</h1>
                                <p className="text-gray-500 mb-8">Your personal AI fitness & nutrition coach. Generate customized plans in seconds.</p>
                                
                                <div className="grid sm:grid-cols-2 gap-4 w-full">
                                    <button 
                                        onClick={() => startPlanGeneration('diet')}
                                        className="flex flex-col items-start p-6 bg-white rounded-3xl border-2 border-gray-200 hover:border-green-400 hover:shadow-lg shadow-sm transition-all text-left group"
                                    >
                                        <div className="p-3 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-md shadow-green-200">
                                            <Utensils className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Diet Plan Generator</h3>
                                        <p className="text-sm text-gray-600">Answer a few questions and get a personalized meal plan with macros.</p>
                                    </button>

                                    <button 
                                        onClick={() => startPlanGeneration('workout')}
                                        className="flex flex-col items-start p-6 bg-white rounded-3xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg shadow-sm transition-all text-left group"
                                    >
                                        <div className="p-3 bg-linear-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-md shadow-blue-200">
                                            <Dumbbell className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Workout Plan Generator</h3>
                                        <p className="text-sm text-gray-600">Get a structured training program tailored to your goals and equipment.</p>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <>
                            {/* Display generated plan tables */}
                            {planData.map((plan) => (
                                <div key={plan.id} className="mb-6">
                                    {plan.plan_type === 'diet' ? (
                                        <DietPlanTable data={plan.parsed_data as DietPlanData} />
                                    ) : (
                                        <WorkoutPlanTable data={plan.parsed_data as WorkoutPlanData} />
                                    )}
                                </div>
                            ))}

                            {/* Display chat messages */}
                            {messages.filter(msg => msg.type !== 'plan_json').map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`
                                            max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm
                                            ${msg.role === 'user' 
                                                ? 'bg-linear-to-br from-orange-500 to-red-500 text-white' 
                                                : 'bg-white text-gray-800 border border-gray-100'
                                            }
                                        `}
                                    >
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>
                                </div>
                            ))}
                            
                            {sending && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex items-center gap-3">
                                        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                                        <span className="text-sm text-gray-600">Gymna is thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="max-w-4xl mx-auto relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Ask Gymna anything..."
                            className="w-full min-h-[50px] max-h-[200px] p-4 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none shadow-sm text-sm"
                            disabled={sending}
                        />
                        <Button
                            size="icon"
                            className="absolute right-2 bottom-2 h-8 w-8 bg-orange-600 hover:bg-orange-700 rounded-lg"
                            onClick={handleSendMessage}
                            disabled={!input.trim() || sending}
                        >
                            <Send className="h-4 w-4 text-white" />
                        </Button>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        Gymna can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
