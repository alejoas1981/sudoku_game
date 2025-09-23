import { useState } from "react";

interface GameContext {
    difficulty: string;
    progress: number;
    timer: number;
    gameCompleted: boolean;
    errorCount: number;
    filledCells: number;
    totalCells: number;
}

export const useGPT = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = 'https://api-15-puzzle.onrender.com';
    
    const sendMessage = async (message: string, gameContext: GameContext) => {
        if (!message.trim()) return null;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`${API_BASE_URL}/ask_gpt`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message, gameContext })
            });
            
            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }
            
            const data = await res.json();
            setIsLoading(false);
            return data.reply ?? "No response";
            
        } catch (err) {
            console.error(err);
            setError("Failed to connect to server GPT endpoint");
            setIsLoading(false);
            return null;
        }
    };
    
    return { sendMessage, isLoading, error };
};
