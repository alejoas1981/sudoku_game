// API integration for Sudoku game
import { Difficulty } from './sudoku';
import { GameState, GameMove } from '@/hooks/useGameState';

const API_BASE_URL = 'https://api-15-puzzle.onrender.com';

// Server data structure
export interface ServerGameData {
    id?: string;
    grid: number[][];
    solution: number[][];
    givenCells: boolean[][];
    difficulty: Difficulty;
    timer: number;
    gameCompleted: boolean;
    history: GameMove[];
    historyIndex: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ServerStats {
    totalGames: number;
    completedGames: number;
    bestTimes: {
        [key in Difficulty]: number | null;
    };
}

// Connection status
let isServerAvailable = true;
let lastPingTime = Date.now();

// Ping server to keep connection alive
export const pingServer = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE_URL}/ping`, {
            method: 'GET',
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const text = await response.text();
            isServerAvailable = text === 'OK';
            lastPingTime = Date.now();
            return isServerAvailable;
        }
        
        isServerAvailable = false;
        return false;
    } catch (error) {
        console.warn('Server ping failed:', error);
        isServerAvailable = false;
        return false;
    }
};

// Start ping interval (every 45 seconds)
let pingInterval: NodeJS.Timeout | null = null;

export const startPingInterval = () => {
    if (pingInterval) return;
    
    pingInterval = setInterval(() => {
        pingServer();
    }, 45000);
    
    // Initial ping
    pingServer();
};

export const stopPingInterval = () => {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
};

// API request wrapper with fallback
const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T | null> => {
    if (!isServerAvailable) {
        console.warn('Server unavailable, skipping API request');
        return null;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.warn(`API request failed for ${endpoint}:`, error);
        isServerAvailable = false;
        return null;
    }
};

// Game data API
export const saveGameToServer = async (gameData: GameState): Promise<string | null> => {
    const serverData: ServerGameData = {
        grid: gameData.grid,
        solution: gameData.solution,
        givenCells: gameData.givenCells,
        difficulty: gameData.difficulty,
        timer: gameData.timer,
        gameCompleted: gameData.gameCompleted,
        history: gameData.history,
        historyIndex: gameData.historyIndex,
    };
    
    const result = await apiRequest<{ id: string }>('/games', {
        method: 'POST',
        body: JSON.stringify(serverData),
    });
    
    return result?.id || null;
};

export const loadGameFromServer = async (gameId: string): Promise<ServerGameData | null> => {
    return await apiRequest<ServerGameData>(`/games/${gameId}`);
};

export const updateGameOnServer = async (
    gameId: string,
    gameData: GameState
): Promise<boolean> => {
    const serverData: ServerGameData = {
        grid: gameData.grid,
        solution: gameData.solution,
        givenCells: gameData.givenCells,
        difficulty: gameData.difficulty,
        timer: gameData.timer,
        gameCompleted: gameData.gameCompleted,
        history: gameData.history,
        historyIndex: gameData.historyIndex,
    };
    
    const result = await apiRequest<ServerGameData>(`/games/${gameId}`, {
        method: 'PUT',
        body: JSON.stringify(serverData),
    });
    
    return result !== null;
};

export const deleteGameFromServer = async (gameId: string): Promise<boolean> => {
    const result = await apiRequest(`/games/${gameId}`, {
        method: 'DELETE',
    });
    
    return result !== null;
};

// Statistics API
export const saveStatsToServer = async (stats: ServerStats): Promise<boolean> => {
    const result = await apiRequest<ServerStats>('/stats', {
        method: 'POST',
        body: JSON.stringify(stats),
    });
    
    return result !== null;
};

export const loadStatsFromServer = async (): Promise<ServerStats | null> => {
    return await apiRequest<ServerStats>('/stats');
};

// User games list
export const getUserGames = async (): Promise<ServerGameData[] | null> => {
    return await apiRequest<ServerGameData[]>('/games');
};

// Data synchronization helpers
export const syncGameWithServer = async (
    gameData: GameState,
    gameId?: string
): Promise<string | null> => {
    if (!isServerAvailable) return null;
    
    try {
        if (gameId) {
            // Update existing game
            const success = await updateGameOnServer(gameId, gameData);
            return success ? gameId : null;
        } else {
            // Create new game
            return await saveGameToServer(gameData);
        }
    } catch (error) {
        console.warn('Game sync failed:', error);
        return null;
    }
};

export const syncStatsWithServer = async (localStats: ServerStats): Promise<ServerStats> => {
    if (!isServerAvailable) return localStats;
    
    try {
        // Try to get server stats
        const serverStats = await loadStatsFromServer();
        
        if (serverStats) {
            // Merge stats (take the best of both)
            const mergedStats: ServerStats = {
                totalGames: Math.max(localStats.totalGames, serverStats.totalGames),
                completedGames: Math.max(localStats.completedGames, serverStats.completedGames),
                bestTimes: {
                    [Difficulty.BEGINNER]: getBestTime(localStats.bestTimes[Difficulty.BEGINNER], serverStats.bestTimes[Difficulty.BEGINNER]),
                    [Difficulty.AMATEUR]: getBestTime(localStats.bestTimes[Difficulty.AMATEUR], serverStats.bestTimes[Difficulty.AMATEUR]),
                    [Difficulty.EXPERIENCED]: getBestTime(localStats.bestTimes[Difficulty.EXPERIENCED], serverStats.bestTimes[Difficulty.EXPERIENCED]),
                    [Difficulty.VETERAN]: getBestTime(localStats.bestTimes[Difficulty.VETERAN], serverStats.bestTimes[Difficulty.VETERAN]),
                    [Difficulty.MASTER]: getBestTime(localStats.bestTimes[Difficulty.MASTER], serverStats.bestTimes[Difficulty.MASTER]),
                },
            };
            
            // Save merged stats back to server
            await saveStatsToServer(mergedStats);
            return mergedStats;
        } else {
            // Upload local stats to server
            await saveStatsToServer(localStats);
            return localStats;
        }
    } catch (error) {
        console.warn('Stats sync failed:', error);
        return localStats;
    }
};

// Helper function to get best time
const getBestTime = (time1: number | null, time2: number | null): number | null => {
    if (time1 === null) return time2;
    if (time2 === null) return time1;
    return Math.min(time1, time2);
};

// Initialize API
export const initializeAPI = () => {
    startPingInterval();
};

// Cleanup API
export const cleanupAPI = () => {
    stopPingInterval();
};