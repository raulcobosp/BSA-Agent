import React, { useEffect, useState } from 'react';
import { X, Save, FolderOpen, Trash2, Download, Plus, Clock, FileText, Loader2 } from 'lucide-react';
import { SessionSummary } from '../types';
import { listSessions, deleteSession } from '../services/sessionService';

interface SessionManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadSession: (id: string) => void;
    onNewSession: () => void;
    currentSessionId: string | null;
}

const SessionManager: React.FC<SessionManagerProps> = ({
    isOpen,
    onClose,
    onLoadSession,
    onNewSession,
    currentSessionId
}) => {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshList = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const list = await listSessions();
            setSessions(list);
        } catch (e) {
            setError("Failed to load sessions list");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            refreshList();
        }
    }, [isOpen]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
            try {
                await deleteSession(id);
                await refreshList();
            } catch (e) {
                console.error("Delete failed", e);
            }
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/50 backdrop-blur-sm transition-all" onClick={onClose}>
            <div
                className="w-80 h-full bg-slate-900 text-white shadow-2xl border-r border-slate-700 flex flex-col animate-slide-in-left"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-2 text-slate-100">
                        <FolderOpen className="w-5 h-5 text-indigo-400" />
                        <h2 className="font-bold text-lg">Sessions</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Actions */}
                <div className="p-4 border-b border-slate-700 flex gap-2">
                    <button
                        onClick={() => { onNewSession(); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-semibold text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Proposal
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-800/50">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-red-400 text-center p-4 text-sm">{error}</div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No saved sessions yet.</p>
                            <p className="text-xs mt-1">Generate a proposal and save it to see it here.</p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => { onLoadSession(session.id); onClose(); }}
                                className={`group p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md relative bg-slate-800 ${currentSessionId === session.id
                                        ? 'border-indigo-500/50 ring-1 ring-indigo-500/50 shadow-sm bg-slate-800'
                                        : 'border-slate-700 hover:border-indigo-500/30'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-semibold ${currentSessionId === session.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                                        {session.name}
                                    </h3>
                                    {currentSessionId === session.id && (
                                        <span className="text-[10px] uppercase font-bold bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mb-2 truncate font-medium">
                                    {session.previewText}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(session.lastModified)}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, session.id)}
                                        className="p-1.5 hover:bg-red-900/20 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete session"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionManager;
