import axios from 'axios';
import { Bot, X, Plus, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';
import ChatAssistantHeader from './ChatAssistantHeader';
import ChatInput from './ChatInput';
import ChatWindow from './ChatWindow';

export default function FloatingAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'history' | 'room'>('room');
    const [chatSessions, setChatSessions] = useState<any[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);

    // For delete confirmation
    const [sessionToDelete, setSessionToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen && !hasLoaded) {
            loadSessions();
            setHasLoaded(true);
        }
    }, [isOpen]);

    const loadSessions = async () => {
        try {
            const response = await axios.get('/ai/chat/sessions');
            setChatSessions(response.data);
            if (response.data.length > 0) {
                fetchMessages(response.data[0]);
            }
        } catch (error) {
            console.error('Error loading sessions', error);
        }
    };

    const fetchMessages = async (session: any) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/ai/chat/${session.id}/messages`);
            setMessages(response.data);
            setActiveSession(session);
            setActiveTab('room');
        } catch (error) {
            console.error('Error fetching messages', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createSession = async () => {
        if (chatSessions.length >= 5) {
            toast.warning('You have reached the maximum of 5 chat sessions. Delete an older chat to create a new one.');
            return;
        }

        try {
            const response = await axios.post('/ai/chat', { title: 'Chat Baru' });
            setChatSessions([response.data, ...chatSessions]);
            setActiveSession(response.data);
            setMessages([]);
            setIsLoading(false);
            setActiveTab('room');
        } catch (error: any) {
            if (error.response && error.response.status === 422) {
                toast.error(error.response.data.error || 'You have reached the maximum number of chat sessions.');
            } else {
                toast.error('Unable to create a chat session.');
            }
            console.error('Error creating session', error);
        }
    };

    const confirmDeleteSession = (session: any) => {
        setSessionToDelete(session);
    };

    const handleDelete = async () => {
        if (!sessionToDelete) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/ai/chat/${sessionToDelete.id}`);
            const updatedSessions = chatSessions.filter((s) => s.id !== sessionToDelete.id);
            setChatSessions(updatedSessions);

            if (activeSession && activeSession.id === sessionToDelete.id) {
                setActiveSession(updatedSessions.length > 0 ? updatedSessions[0] : null);
                if (updatedSessions.length > 0) {
                    fetchMessages(updatedSessions[0]);
                } else {
                    setMessages([]);
                }
            }
            toast.success('Chat deleted successfully.');
        } catch (error) {
            toast.error('Unable to delete the chat.');
            console.error('Error deleting session', error);
        } finally {
            setIsDeleting(false);
            setSessionToDelete(null);
        }
    };

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        let currentSession = activeSession;
        if (!currentSession) {
            if (chatSessions.length >= 5) {
                toast.warning('You have reached the maximum of 5 chat sessions. Delete an older chat to create a new one.');
                return;
            }
            try {
                const response = await axios.post('/ai/chat', { title: 'Chat Baru' });
                currentSession = response.data;
                setChatSessions([currentSession, ...chatSessions]);
                setActiveSession(currentSession);
                setMessages([]);
            } catch (error: any) {
                if (error.response && error.response.status === 422) {
                    toast.error(error.response.data.error || 'You have reached the maximum number of chat sessions.');
                }
                console.error('Error creating session', error);
                return;
            }
        }

        const newUserMessage = { role: 'user', content };
        setMessages((prev) => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            const response = await axios.post(`/ai/chat/${currentSession.id}/messages`, { message: content });

            // Check if title updated
            if (response.data.session_title && response.data.session_title !== currentSession.title) {
                setChatSessions((prevSessions) =>
                    prevSessions.map((s) => (s.id === currentSession.id ? { ...s, title: response.data.session_title } : s)),
                );
                currentSession.title = response.data.session_title;
                setActiveSession({ ...currentSession });
            }

            setMessages((prev) => [...prev, response.data.assistant_message]);
        } catch (error) {
            console.error('Error sending message', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Maaf, AI Assistant sedang mengalami gangguan. Silakan coba lagi beberapa saat.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={isOpen ? 'fixed inset-0 z-50' : 'fixed z-50'}>
            {isOpen ? (
                <div className="animate-in slide-in-from-bottom-5 absolute inset-y-0 right-0 flex h-full w-full max-w-none flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl md:w-1/3 dark:border-slate-700 dark:bg-[#1e1f24]">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between gap-3 bg-purple-600 px-4 py-3 text-white">
                        <ChatAssistantHeader title={activeSession?.title || 'Chat Baru'} />
                        <div className="flex items-center gap-1 bg-white/10 p-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('history')}
                                className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${activeTab === 'history' ? 'bg-white text-purple-700' : 'text-white/70 hover:text-white'}`}
                            >
                                History
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('room')}
                                className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${activeTab === 'room' ? 'bg-white text-purple-700' : 'text-white/70 hover:text-white'}`}
                            >
                                Room Chat
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 transition-colors hover:bg-white/20"
                            aria-label="Close AI Assistant"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="relative flex flex-1 flex-col overflow-hidden">
                        {activeTab === 'history' ? (
                            <div className="flex h-full flex-col bg-white dark:bg-[#1e1f24]">
                                <div className="shrink-0 border-b p-3 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={createSession}
                                        disabled={chatSessions.length >= 5}
                                        className="flex w-full items-center justify-center gap-2 bg-purple-50 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
                                    >
                                        <Plus className="h-4 w-4" /> New Chat {chatSessions.length >= 5 && '(Max 5)'}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {chatSessions.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No chat history yet.</div>
                                    ) : (
                                        chatSessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className={`group flex items-center justify-between border-b p-3 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800 ${activeSession?.id === session.id ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="flex-1 truncate text-left text-sm font-medium text-slate-700 dark:text-gray-200"
                                                    onClick={() => fetchMessages(session)}
                                                >
                                                    {session.title || 'Chat Baru'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDeleteSession(session)}
                                                    className="p-1.5 text-gray-400 transition-opacity group-hover:opacity-100 hover:text-red-500 focus:opacity-100"
                                                    title="Delete Chat"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col bg-slate-50 dark:bg-[#1e1f24]">
                                <div className="min-h-0 flex-1 overflow-hidden">
                                    <ChatWindow messages={messages} isLoading={isLoading} />
                                </div>
                                <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#1e1f24]">
                                    <ChatInput onSend={sendMessage} disabled={isLoading} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="group fixed right-6 bottom-6 flex transform items-center justify-center gap-2 bg-purple-600 p-4 text-white shadow-xl transition-all hover:scale-105 hover:bg-purple-700 hover:shadow-2xl"
                    aria-label="Open AI Assistant"
                >
                    <Bot className="h-6 w-6 group-hover:animate-pulse" />
                </button>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationDelete
                open={!!sessionToDelete}
                onClose={() => setSessionToDelete(null)}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Delete Chat History"
                message="Are you sure you want to delete this chat session? All messages in this session will be permanently removed."
            />
        </div>
    );
}
