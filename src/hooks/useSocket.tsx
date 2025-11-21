import { useEffect, useState } from "react";


export const useSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null); 
    
    useEffect(() => {
        const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

        console.log("Connecting to: ", WS_URL);
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {  
            console.log("Connected to server");
            setSocket(ws);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error: ", error);
        };

        ws.onclose = () => {
            console.log("Disconnected from server");
        }

        return () => {
            ws.close();
        };
    }, [])

    return socket;
}