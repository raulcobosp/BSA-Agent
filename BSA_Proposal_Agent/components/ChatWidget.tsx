import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, ImagePlus, Trash2 } from 'lucide-react';
import { ChatMessage, ResearchResult, SolutionDesign, AgentLog, ExpandConfig, CostEstimation } from '../types';
import { chatWithBSAExpert } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ChatWidgetProps {
    research: ResearchResult | null;
    design: SolutionDesign | null;
    markdown: string;
    costEstimation: CostEstimation | null;
    logs: AgentLog[];
    onRegenerateImage?: (type: 'cover' | 'concept' | 'infographic', instruction?: string) => Promise<void>;
    onExpandKYC?: (section: string, config: ExpandConfig) => void;
    onUpdateDesign?: (design: Partial<SolutionDesign>) => Promise<void>;
}

// Extended message type to support images
interface ChatMessageWithImage extends ChatMessage {
    image?: string; // base64 data URI
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ research, design, markdown, costEstimation, logs, onRegenerateImage, onExpandKYC, onUpdateDesign }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessageWithImage[]>([
        {
            id: 'init',
            role: 'model',
            text: "👋 Hi! I'm your **Nubiral BSA Expert Assistant**.\n\nI'm here to help you understand and use this tool effectively. I can:\n\n• **Explain** what you see in each tab\n• **Guide** you through the workflow step by step\n• **Answer questions** about the generated artifacts\n• **Help update** images or expand sections when you ask\n• **Analyze screenshots** - paste or upload images!\n\nI will **only** do what you explicitly ask—no automatic triggers. How can I help?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Handle paste event for images
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setAttachedImage(event.target?.result as string);
                    };
                    reader.readAsDataURL(blob);
                    e.preventDefault();
                    break;
                }
            }
        }
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setAttachedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !attachedImage) || isThinking) return;

        const userMsg: ChatMessageWithImage = {
            id: Date.now().toString(),
            role: 'user',
            text: input || (attachedImage ? '[Image attached]' : ''),
            image: attachedImage || undefined,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        const imageToSend = attachedImage;
        setAttachedImage(null);
        setIsThinking(true);

        try {
            // Define Actions wrapper
            const actions = {
                regenerateImage: async (type: 'cover' | 'concept' | 'infographic', instruction?: string) => {
                    if (onRegenerateImage) await onRegenerateImage(type, instruction);
                },
                expandSection: async (section: string) => {
                    if (onExpandKYC) onExpandKYC(section, { density: 'High', instruction: '' });
                },
                updateDesign: async (design: Partial<SolutionDesign>) => {
                    if (onUpdateDesign) await onUpdateDesign(design);
                }
            };

            const responseText = await chatWithBSAExpert(
                userMsg.text,
                messages,
                { research, design, markdown, logs, costEstimation },
                actions,
                imageToSend || undefined // Pass image to chat function
            );

            const botMsg: ChatMessageWithImage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg: ChatMessageWithImage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "I encountered an error connecting to the Nubiral Knowledge Base. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[400px] h-[600px] mb-4 flex flex-col overflow-hidden animate-slide-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <Bot className="w-6 h-6 text-blue-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Nubiral BSA Expert</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-xs text-blue-200 font-medium">Online | Vision Enabled</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-blue-200 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                                    ? 'bg-slate-200 text-slate-600'
                                    : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                </div>
                                <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                    }`}>
                                    {/* Attached Image */}
                                    {msg.image && (
                                        <img
                                            src={msg.image}
                                            alt="Attached"
                                            className="rounded-lg mb-2 max-w-full max-h-48 object-contain border border-white/20"
                                        />
                                    )}
                                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                                        <ReactMarkdown>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    <div className={`text-[10px] mt-1 text-right opacity-70`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 flex items-center gap-2 text-slate-500 text-xs font-medium">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Analyzing...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attached Image Preview */}
                    {attachedImage && (
                        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200">
                            <div className="relative inline-block">
                                <img
                                    src={attachedImage}
                                    alt="Preview"
                                    className="h-16 rounded-lg border border-slate-300 shadow-sm"
                                />
                                <button
                                    onClick={() => setAttachedImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <span className="ml-2 text-xs text-slate-500">Image attached</span>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onPaste={handlePaste}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Ask about architecture, paste a screenshot, or type..."
                                className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none text-slate-700 placeholder-slate-400"
                                rows={2}
                            />
                            <div className="absolute right-2 bottom-2 flex items-center gap-1">
                                {/* Image Upload Button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Upload image"
                                >
                                    <ImagePlus className="w-4 h-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                {/* Send Button */}
                                <button
                                    onClick={handleSend}
                                    disabled={(!input.trim() && !attachedImage) || isThinking}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 ml-1">
                            Tip: Paste screenshots with Ctrl+V or click 📷 to upload
                        </p>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center gap-3 px-5 py-4 rounded-full shadow-2xl transition-all duration-300 ${isOpen
                    ? 'bg-slate-800 text-white hover:bg-slate-900'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:scale-105'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <>
                        <div className="relative">
                            <MessageSquare className="w-6 h-6" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-600"></span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-sm">Nubiral Expert</span>
                            <span className="text-[10px] text-blue-100 opacity-90 group-hover:opacity-100">Chat with Vision</span>
                        </div>
                    </>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;