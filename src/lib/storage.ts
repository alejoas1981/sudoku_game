// Storage utilities for localStorage and sessionStorage
import { Difficulty } from './sudoku';
import { GameState, GameMove } from '@/hooks/useGameState';
import { Language } from './i18n';

// Keys for localStorage
const STORAGE_KEYS = {
    LANGUAGE: 'sudoku_language',
    SAVED_GAME: 'sudoku_saved_game',
    DIFFICULTY: 'sudoku_difficulty',
    BEST_TIMES: 'sudoku_best_times',
    GAMES_PLAYED: 'sudoku_games_played',
    SETTINGS: 'sudoku_settings',
    INTELLECTUAL_ASSISTANT_ENABLED: 'sudoku_intellectual_assistant_enabled'
} as const;

// Keys for sessionStorage
const SESSION_KEYS = {
    CURRENT_GAME: 'sudoku_current_game',
    GAME_TIMER: 'sudoku_game_timer',
    MOVE_HISTORY: 'sudoku_move_history'
} as const;

export interface SavedGame {
    grid: number[][];
    solution: number[][];
    givenCells: boolean[][];
    difficulty: Difficulty;
    timer: number;
    gameCompleted: boolean;
    history: GameMove[];
    historyIndex: number;
    savedAt: number;
}

export interface BestTimes {
    [Difficulty.BEGINNER]: number | null;
    [Difficulty.AMATEUR]: number | null;
    [Difficulty.EXPERIENCED]: number | null;
    [Difficulty.VETERAN]: number | null;
    [Difficulty.MASTER]: number | null;
}

export interface GameStats {
    totalGames: number;
    completedGames: number;
    bestTimes: BestTimes;
}

export interface UserSettings {
    autoSave: boolean;
    showTimer: boolean;
    highlightErrors: boolean;
    showHints: boolean;
}

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
    autoSave: true,
    showTimer: true,
    highlightErrors: true,
    showHints: true
};

const DEFAULT_BEST_TIMES: BestTimes = {
    [Difficulty.BEGINNER]: null,
    [Difficulty.AMATEUR]: null,
    [Difficulty.EXPERIENCED]: null,
    [Difficulty.VETERAN]: null,
    [Difficulty.MASTER]: null
};

// Helper functions
const safeGetItem = (key: string, storage: Storage): string | null => {
    try {
        return storage.getItem(key);
    } catch (error) {
        console.warn(`Failed to read from storage:`, error);
        return null;
    }
};

const safeSetItem = (key: string, value: string, storage: Storage): boolean => {
    try {
        storage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn(`Failed to write to storage:`, error);
        return false;
    }
};

const safeRemoveItem = (key: string, storage: Storage): boolean => {
    try {
        storage.removeItem(key);
        return true;
    } catch (error) {
        console.warn(`Failed to remove from storage:`, error);
        return false;
    }
};

// Language persistence
export const saveLanguage = (language: Language): boolean => {
    return safeSetItem(STORAGE_KEYS.LANGUAGE, language, localStorage);
};

export const loadLanguage = (): Language | null => {
    const stored = safeGetItem(STORAGE_KEYS.LANGUAGE, localStorage);
    return stored as Language | null;
};

// Intellectual Assistant preference
export const saveIntellectualAssistantEnabled = (isEnabled: boolean): boolean => {
    return safeSetItem(STORAGE_KEYS.INTELLECTUAL_ASSISTANT_ENABLED, JSON.stringify(isEnabled), localStorage);
};

export const loadIntellectualAssistantEnabled = (): boolean => {
    const stored = safeGetItem(STORAGE_KEYS.INTELLECTUAL_ASSISTANT_ENABLED, localStorage);
    if (stored === null) {
        return false; // Default to false
    }
    try {
        return JSON.parse(stored);
    } catch (error) {
        console.warn('Failed to parse intellectual assistant setting:', error);
        return false;
    }
};

// Difficulty preference
export const saveDifficulty = (difficulty: Difficulty): boolean => {
    return safeSetItem(STORAGE_KEYS.DIFFICULTY, difficulty, localStorage);
};

export const loadDifficulty = (): Difficulty | null => {
    const stored = safeGetItem(STORAGE_KEYS.DIFFICULTY, localStorage);
    return stored as Difficulty | null;
};

// Game state persistence (localStorage for long-term, sessionStorage for current session)
export const saveGameToLocalStorage = (gameState: GameState): boolean => {
    const savedGame: SavedGame = {
        grid: gameState.grid,
        solution: gameState.solution,
        givenCells: gameState.givenCells,
        difficulty: gameState.difficulty,
        timer: gameState.timer,
        gameCompleted: gameState.gameCompleted,
        history: gameState.history,
        historyIndex: gameState.historyIndex,
        savedAt: Date.now()
    };
    
    return safeSetItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(savedGame), localStorage);
};

export const loadGameFromLocalStorage = (): SavedGame | null => {
    const stored = safeGetItem(STORAGE_KEYS.SAVED_GAME, localStorage);
    if (!stored) return null;
    
    try {
        return JSON.parse(stored);
    } catch (error) {
        console.warn('Failed to parse saved game:', error);
        return null;
    }
};

export const clearSavedGame = (): boolean => {
    return safeRemoveItem(STORAGE_KEYS.SAVED_GAME, localStorage);
};

// Session storage for current game
export const saveGameToSession = (gameState: GameState): boolean => {
    const sessionData = {
        selectedCell: gameState.selectedCell,
        errorCells: gameState.errorCells,
        hintCells: gameState.hintCells,
        timer: gameState.timer,
        savedAt: Date.now()
    };
    
    return safeSetItem(SESSION_KEYS.CURRENT_GAME, JSON.stringify(sessionData), sessionStorage);
};

export const loadGameFromSession = () => {
    const stored = safeGetItem(SESSION_KEYS.CURRENT_GAME, sessionStorage);
    if (!stored) return null;
    
    try {
        return JSON.parse(stored);
    } catch (error) {
        console.warn('Failed to parse session game:', error);
        return null;
    }
};

// Statistics and best times
export const saveBestTime = (difficulty: Difficulty, time: number): boolean => {
    const bestTimes = loadBestTimes();
    const currentBest = bestTimes[difficulty];
    
    if (currentBest === null || time < currentBest) {
        bestTimes[difficulty] = time;
        return safeSetItem(STORAGE_KEYS.BEST_TIMES, JSON.stringify(bestTimes), localStorage);
    }
    
    return true;
};

export const loadBestTimes = (): BestTimes => {
    const stored = safeGetItem(STORAGE_KEYS.BEST_TIMES, localStorage);
    if (!stored) return { ...DEFAULT_BEST_TIMES };
    
    try {
        return { ...DEFAULT_BEST_TIMES, ...JSON.parse(stored) };
    } catch (error) {
        console.warn('Failed to parse best times:', error);
        return { ...DEFAULT_BEST_TIMES };
    }
};

// Game statistics
export const updateGameStats = (difficulty: Difficulty, completed: boolean, time?: number): boolean => {
    const stats = loadGameStats();
    stats.totalGames++;
    
    if (completed) {
        stats.completedGames++;
        if (time) {
            const currentBest = stats.bestTimes[difficulty];
            if (currentBest === null || time < currentBest) {
                stats.bestTimes[difficulty] = time;
            }
        }
    }
    
    return safeSetItem(STORAGE_KEYS.GAMES_PLAYED, JSON.stringify(stats), localStorage);
};

export const loadGameStats = (): GameStats => {
    const stored = safeGetItem(STORAGE_KEYS.GAMES_PLAYED, localStorage);
    if (!stored) {
        return {
            totalGames: 0,
            completedGames: 0,
            bestTimes: { ...DEFAULT_BEST_TIMES }
        };
    }
    
    try {
        const stats = JSON.parse(stored);
        return {
            totalGames: stats.totalGames || 0,
            completedGames: stats.completedGames || 0,
            bestTimes: { ...DEFAULT_BEST_TIMES, ...stats.bestTimes }
        };
    } catch (error) {
        console.warn('Failed to parse game stats:', error);
        return {
            totalGames: 0,
            completedGames: 0,
            bestTimes: { ...DEFAULT_BEST_TIMES }
        };
    }
};

// User settings
export const saveSettings = (settings: Partial<UserSettings>): boolean => {
    const currentSettings = loadSettings();
    const newSettings = { ...currentSettings, ...settings };
    return safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings), localStorage);
};

export const loadSettings = (): UserSettings => {
    const stored = safeGetItem(STORAGE_KEYS.SETTINGS, localStorage);
    if (!stored) return { ...DEFAULT_SETTINGS };
    
    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (error) {
        console.warn('Failed to parse settings:', error);
        return { ...DEFAULT_SETTINGS };
    }
};

// Clear all data
export const clearAllData = (): boolean => {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        Object.values(SESSION_KEYS).forEach(key => {
            sessionStorage.removeItem(key);
        });
        return true;
    } catch (error) {
        console.warn('Failed to clear all data:', error);
        return false;
    }
};
''