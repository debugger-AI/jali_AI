import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export default function JaliAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Habari! I am the Jali AI Assistant. I can help answer clinical queries, summarize medical guidelines, or provide you with protocol information based on our health manuals. How can I assist you today?",
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            // Send query to Jali AI API Server endpoint
            const response = await fetch("http://localhost:8001/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    message: userMsg.text,
                    session_id: "dashboard_ui_session" 
                })
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response || "Msaada unakosekana. Jaribu tena.",
                isUser: false,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Samahani, kuna tatizo la mtandao (Connection Error). Please ensure the AI backend is running on port 8000.",
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-[1000px] mx-auto h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Jali Assistant</h1>
                    <p className="text-sm text-slate-500 mt-1">AI-powered medical guidelines and protocol lookup</p>
                </div>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
                
                {/* Chat Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                            
                            {!msg.isUser && (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                            )}

                            <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                <div 
                                    className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                                        msg.isUser 
                                        ? 'bg-slate-900 text-white rounded-tr-none' 
                                        : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1.5 px-2 font-medium">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>

                            {msg.isUser && (
                                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-1">
                                    <User className="h-4 w-4 text-slate-600" />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="flex gap-4 justify-start animate-in fade-in">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3.5 pl-5 pr-14 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                            placeholder="Type a medical query or protocol question (English or Swahili)..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button 
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                    <div className="text-center mt-2.5">
                        <span className="text-[10px] text-slate-400 font-medium tracking-wide">Jali AI can make mistakes. Verify important medical protocols.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
