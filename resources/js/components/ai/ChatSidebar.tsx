import React from 'react';

export default function ChatSidebar({ sessions, activeSession, onSelectSession, onCreateSession, onDeleteSession }) {
    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
            <div className="p-4">
                <button 
                    onClick={onCreateSession}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                    + New Chat
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {sessions.map(session => (
                    <div 
                        key={session.id} 
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800 transition-colors ${activeSession?.id === session.id ? 'bg-gray-800 border-l-4 border-purple-500' : ''}`}
                    >
                        <div 
                            className="flex-1 truncate" 
                            onClick={() => onSelectSession(session)}
                        >
                            {session.title || 'New Chat'}
                        </div>
                        <button 
                            onClick={() => onDeleteSession(session.id)}
                            className="ml-2 text-gray-400 hover:text-red-500 p-1"
                            title="Delete Chat"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
