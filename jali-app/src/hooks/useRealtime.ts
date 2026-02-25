import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface RealtimeEvent {
    topic: string;
    data: any;
    timestamp: string;
}

export const useRealtime = (url: string = 'ws://localhost:8000/ws/realtime') => {
    const [events, setEvents] = useState<RealtimeEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let socket: WebSocket | null = null;
        let reconnectTimeout: number | null = null;

        const connect = () => {
            try {
                socket = new WebSocket(url);

                socket.onopen = () => {
                    console.log('🔌 Connected to real-time server');
                    setIsConnected(true);
                    toast.success('Real-time connection established');
                };

                socket.onmessage = (event) => {
                    const payload: RealtimeEvent = JSON.parse(event.data);
                    setEvents((prev) => [payload, ...prev].slice(0, 50)); // Keep last 50 events

                    // Show toast for new activity
                    const tableName = payload.topic.split('.').pop();
                    toast.info(`New activity in ${tableName}`, {
                        description: `A new record was added to ${tableName}.`,
                    });
                };

                socket.onclose = () => {
                    console.log('🔌 Disconnected from real-time server');
                    setIsConnected(false);
                    // Try to reconnect after 5 seconds
                    reconnectTimeout = window.setTimeout(connect, 5000);
                };

                socket.onerror = (error) => {
                    console.error('🔌 WebSocket Error:', error);
                    socket?.close();
                };
            } catch (e) {
                console.error('🔌 Connection failed:', e);
            }
        };

        connect();

        return () => {
            if (socket) socket.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [url]);

    return { events, isConnected };
};
