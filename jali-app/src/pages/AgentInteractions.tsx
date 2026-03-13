import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Zap,
  Phone,
  Calendar,
  ClipboardList,
  MoreVertical,
  Activity
} from "lucide-react";
import JaliLogo from "@/components/JaliLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAlerts } from "@/services/apiService";
import { maskPII, maskSecondName } from "@/lib/utils";

interface Alert {
  id: string;
  agentId: string;
  agentName: string;
  patientName: string;
  message: string;
  timestamp: string;
  status: "urgent" | "warning" | "info";
  model: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const AGENTS = {
  hiv: { name: "HIV Adherence Agent", color: "bg-slate-700", icon: ShieldAlert, model: "Llama-3-HIV-Monitor" },
  maternal: { name: "Maternal Health Agent", color: "bg-primary", icon: Activity, model: "Gemma-2-Maternal-Care" },
  vaccine: { name: "Vaccine Schedule Agent", color: "bg-slate-500", icon: Calendar, model: "Mistral-Vaccine-Expert" },
  epidemic: { name: "Malaria Control Agent", color: "bg-[#25ADA0]", icon: Zap, model: "Llama-3-Epidemic-Control" },
};

const INITIAL_ALERTS: Alert[] = [
  { 
    id: "a1", 
    agentId: "maternal", 
    agentName: "Maternal Health Agent",
    patientName: "Grace Wanjiku", 
    message: "Abnormal BP readings (145/95) reported in Kibera Zone B field check. Possible early-stage preeclampsia.", 
    timestamp: "10 mins ago",
    status: "urgent",
    model: "Gemma-2-Maternal-Care"
  },
  { 
    id: "a2", 
    agentId: "hiv", 
    agentName: "HIV Adherence Agent",
    patientName: "John Doe", 
    message: "Patient missed 3 consecutive dose logs in Kawangware. Neural monitor predicts 85% probability of treatment lapse.", 
    timestamp: "1 hour ago",
    status: "urgent",
    model: "Llama-3-HIV-Monitor"
  },
  { 
    id: "a3", 
    agentId: "vaccine", 
    agentName: "Vaccine Schedule Agent",
    patientName: "Fatuma Ali", 
    message: "Scheduled for 9-month immunization (Measles-Rubella) in Eastleigh. Outreach required for pending clinic visit.", 
    timestamp: "3 hours ago",
    status: "info",
    model: "Mistral-Vaccine-Expert"
  },
  { 
    id: "a4", 
    agentId: "epidemic", 
    agentName: "Malaria Control Agent",
    patientName: "Samuel Oduor", 
    message: "Recent fever spike (39.2°C) reported in Mathare Section 3. Regional trend matches malaria seasonal onset.", 
    timestamp: "5 hours ago",
    status: "warning",
    model: "Llama-3-Epidemic-Control"
  },
];

export default function AgentInteractions() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0];

  useEffect(() => {
    getAlerts()
      .then(data => {
        setAlerts(data);
        if (data.length > 0) setSelectedAlertId(data[0].id);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch alerts", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedAlertId, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedAlertId) return;

    const userText = inputValue;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => ({
      ...prev,
      [selectedAlertId]: [...(prev[selectedAlertId] || []), userMsg]
    }));
    setInputValue("");
    setIsTyping(true);

    // Real LLM-powered response
    try {
      const response = await fetch("http://localhost:8003/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: `[Context: Interaction about alert for ${selectedAlert.patientName} - "${selectedAlert.message}"]\nUser says: ${userText}`,
          session_id: selectedAlertId 
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || "No response received.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedAlertId]: [...(prev[selectedAlertId] || []), agentResponse]
      }));
    } catch (error) {
      console.error("Agent interaction failed", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the Jali Intelligent Core. Please ensure the backend is running.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => ({
        ...prev,
        [selectedAlertId]: [...(prev[selectedAlertId] || []), errorMsg]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const getStatusColor = (status: Alert["status"]) => {
    switch (status) {
      case "urgent": return "text-primary bg-primary/10 border-primary/20";
      case "warning": return "text-slate-700 bg-slate-100 border-slate-200";
      case "info": return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex animate-in fade-in duration-500 gap-6 overflow-hidden">
      
      {/* Left Sidebar: Alert Feed */}
      <div className="w-80 lg:w-96 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Alerts</h2>
            <p className="text-xs text-slate-500 mt-0.5">Automated monitoring results</p>
          </div>
          <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 px-2.5">
            {alerts.length} Active
          </Badge>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Activity className="h-6 w-6 text-primary animate-spin" />
              <p className="text-xs text-slate-400">Fetching alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-slate-400">No active alerts found in database</p>
            </div>
          ) : alerts.map((alert) => {
            const AgentIcon = (AGENTS as any)[alert.agentId]?.icon || AlertCircle;
            const isSelected = selectedAlertId === alert.id;
            
            return (
              <div 
                key={alert.id}
                onClick={() => setSelectedAlertId(alert.id)}
                className={`group p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected 
                    ? "bg-white border-primary shadow-md scale-[1.02]" 
                    : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-xl ${(AGENTS as any)[alert.agentId]?.color} flex items-center justify-center text-white shrink-0 shadow-sm text-xs font-bold uppercase`}>
                    {alert.agentId.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {alert.agentName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {alert.timestamp}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate">
                      {maskSecondName(alert.patientName)}
                    </h3>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${isSelected ? "text-slate-700" : "text-slate-500"}`}>
                      {alert.message}
                    </p>
                    
                    <div className="mt-3 flex items-center gap-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(alert.status)}`}>
                         {alert.status.toUpperCase()}
                       </span>
                       {isSelected && (
                         <span className="ml-auto text-[10px] text-primary font-bold flex items-center gap-1">
                           Interacting <ArrowRight size={10} className="animate-pulse" />
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Agent Interaction (LLM Style) */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="text-center">
             <Activity className="h-12 w-12 text-primary/20 mx-auto mb-4 animate-spin" />
             <p className="text-slate-400">Loading interaction context...</p>
          </div>
        </div>
      ) : !selectedAlert ? (
        <div className="flex-1 flex items-center justify-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="text-center">
             <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400">Select an alert to start interaction</p>
          </div>
        </div>
      ) : (
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Selected Alert Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex gap-5">
              <div className={`h-14 w-14 rounded-2xl ${(AGENTS as any)[selectedAlert.agentId]?.color} flex items-center justify-center text-white shrink-0 shadow-lg text-lg font-bold`}>
                AI
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-xl font-bold text-slate-900">{selectedAlert.agentName}</h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="font-bold text-slate-400 mr-0.5">[P]</span> 
                    <span className="font-medium">Patient: <span className="text-slate-900">{maskSecondName(selectedAlert.patientName)}</span></span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                 <MoreVertical size={16} />
              </Button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
             <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200 text-primary font-bold text-[10px]">
               !
             </div>
             <p className="text-sm text-slate-700 leading-relaxed italic">
               "{selectedAlert.message}"
             </p>
          </div>
        </div>

        {/* Interaction Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden relative">
          
          {/* Action Ribbon */}
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 shrink-0">Recommend Actions:</span>
            <Button size="sm" variant="outline" className="rounded-full bg-white text-[10px] border-slate-200 hover:bg-slate-50 gap-1.5 h-8 font-bold">
              [CALL] Call Patient
            </Button>
            <Button size="sm" variant="outline" className="rounded-full bg-white text-[10px] border-slate-200 hover:bg-slate-50 gap-1.5 h-8 font-bold">
              [DATE] Schedule Visit
            </Button>
            <Button size="sm" variant="outline" className="rounded-full bg-white text-[10px] border-slate-200 hover:bg-slate-50 gap-1.5 h-8 font-bold">
              [TASK] Assign Task
            </Button>
            <Button size="sm" variant="outline" className="rounded-full bg-white text-[10px] border-slate-200 hover:bg-slate-50 gap-1.5 h-8 font-bold">
              [X] Dismiss
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-slate-50/30">
            {/* Helper Intro */}
            <div className="flex justify-center mb-8">
              <div className="px-3 py-1 bg-slate-100 rounded-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SECURE AGENT</p>
              </div>
            </div>

            {(messages[selectedAlert.id] || []).map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                
                {!msg.isUser && (
                  <div className={`h-8 w-8 rounded-full ${(AGENTS as any)[selectedAlert.agentId]?.color} flex items-center justify-center text-white shrink-0 mt-1 shadow-sm text-[10px] font-bold`}>
                    AI
                  </div>
                )}

                <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'} max-w-[85%] lg:max-w-[70%]`}>
                  <div 
                    className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed ${
                      msg.isUser 
                      ? 'bg-slate-900 text-white rounded-tr-none shadow-md shadow-slate-200' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 px-3 font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.isUser && (
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1 text-[10px] font-bold text-slate-600">
                    YOU
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-4 justify-start">
                <div className={`h-8 w-8 rounded-full ${(AGENTS as any)[selectedAlert.agentId]?.color} flex items-center justify-center text-white shrink-0 mt-1 shadow-sm text-[10px] font-bold`}>
                  AI
                </div>
                <div className="bg-white border border-slate-200 px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-2xl py-4 pl-6 pr-20 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder={`Ask about ${selectedAlert.patientName.split(' ')[0]}'s case...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-3 p-1.5 bg-slate-900 text-white rounded-xl disabled:opacity-30 hover:bg-slate-800 transition-all font-bold text-[10px] px-3"
              >
                SEND
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-4">
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <JaliLogo size={12} /> Powered by Jali Intelligent Core
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
