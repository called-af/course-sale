import React from 'react';

export interface ChatSession {
    id: number;
    title?: string | null;
}

interface ChatSidebarProps {
    sessions: ChatSession[];
    activeSession: ChatSession | null;
    onSelectSession: (session: ChatSession) => void;
    onCreateSession: () => void;
    onDeleteSession: (id: number) => void;
}

export default function ChatSidebar({ sessions, activeSession, onSelectSession, onCreateSession, onDeleteSession }: ChatSidebarProps) {
    return (
        <div className="flex h-full w-64 flex-col bg-[#141416] text-white">
            <div className="p-4">
                <button onClick={onCreateSession} className="w-full bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700">
                    + New Chat
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={`flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-gray-800 ${activeSession?.id === session.id ? 'border-l-4 border-purple-500 bg-gray-800' : ''}`}
                    >
                        <div className="flex-1 truncate" onClick={() => onSelectSession(session)}>
                            {session.title || 'New Chat'}
                        </div>
                        <button onClick={() => onDeleteSession(session.id)} className="ml-2 p-1 text-gray-400 hover:text-red-500" title="Delete Chat">
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
