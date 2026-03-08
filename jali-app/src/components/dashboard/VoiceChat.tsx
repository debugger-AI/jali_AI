import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = "http://localhost:8000";

interface VoiceChatMessage {
    type: "user" | "assistant";
    transcript?: string;
    text: string;
    audioBase64?: string;
}

const VoiceChat = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                await sendAudioToServer(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            setError("Microphone access denied. Please allow microphone access.");
            console.error("Mic error:", err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const sendAudioToServer = async (audioBlob: Blob) => {
        setIsProcessing(true);
        setError(null);

        // Add user message placeholder
        setMessages((prev) => [
            ...prev,
            { type: "user", text: "🎤 Processing voice..." },
        ]);

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");
            formData.append("user_id", "dashboard_user");

            const response = await fetch(`${API_BASE}/api/voice/chat`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();

            // Update user message with actual transcript
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    type: "user",
                    transcript: data.transcript,
                    text: data.transcript,
                };
                // Add assistant response
                updated.push({
                    type: "assistant",
                    text: data.response_text,
                    audioBase64: data.response_audio,
                });
                return updated;
            });

            // Auto-play response audio
            if (data.response_audio) {
                playAudio(data.response_audio);
            }
        } catch (err: any) {
            setError(err.message || "Failed to process voice. Is the AI server running?");
            // Remove placeholder
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsProcessing(false);
        }
    };

    const playAudio = (base64Audio: string) => {
        try {
            const audioData = atob(base64Audio);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }
            const blob = new Blob([arrayBuffer], { type: "audio/mp3" });
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(url);
            };
            audio.onerror = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(url);
            };

            audio.play();
        } catch (e) {
            console.error("Audio playback error:", e);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    return (
        <div className="bg-card rounded-2xl border border-border/40 p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Swahili Voice Assistant</h3>
                    <p className="text-sm text-muted-foreground">Ongea na Jali kwa Kiswahili</p>
                </div>
                <div className="flex items-center gap-2">
                    {isPlaying && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={stopAudio}
                            className="text-xs gap-1"
                        >
                            <Square size={12} />
                            Stop
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            {messages.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-3 mb-5 pr-1">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.type === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted text-foreground rounded-bl-md"
                                    }`}
                            >
                                <p>{msg.text}</p>
                                {msg.type === "assistant" && msg.audioBase64 && (
                                    <button
                                        onClick={() => playAudio(msg.audioBase64!)}
                                        className="mt-1.5 text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Volume2 size={12} /> Play audio
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Record Button */}
            <div className="flex justify-center">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                            ? "bg-red-500 shadow-[0_0_0_8px_rgba(239,68,68,0.2)] scale-110"
                            : isProcessing
                                ? "bg-muted cursor-not-allowed"
                                : "bg-primary hover:bg-primary/90 shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95"
                        }`}
                >
                    {isProcessing ? (
                        <Loader2 size={28} className="text-muted-foreground animate-spin" />
                    ) : isRecording ? (
                        <MicOff size={28} className="text-white" />
                    ) : (
                        <Mic size={28} className="text-white" />
                    )}

                    {/* Recording pulse */}
                    {isRecording && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                            <span className="absolute -inset-3 rounded-full border-2 border-red-400/40 animate-pulse" />
                        </>
                    )}
                </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3">
                {isRecording
                    ? "Inasikia... bonyeza kuacha"
                    : isProcessing
                        ? "Inachakata sauti yako..."
                        : "Bonyeza kusema — Tap to speak"}
            </p>
        </div>
    );
};

export default VoiceChat;
