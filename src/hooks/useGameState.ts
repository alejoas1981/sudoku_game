import { useState, useEffect, useCallback } from 'react';
import { SudokuGame, Difficulty } from '@/lib/sudoku';
import {
    saveGameToLocalStorage,
    saveGameToSession,
    loadGameFromLocalStorage,
    saveDifficulty,
    loadDifficulty,
    updateGameStats,
    clearSavedGame
} from '@/lib/storage';

export interface GameMove {
    row: number;
    col: number;
    oldValue: number;
    newValue: number;
}

export interface GameState {
    grid: number[][];
    solution: number[][];
    givenCells: boolean[][];
    selectedCell: { row: number; col: number } | null;
    errorCells: { row: number; col: number }[];
    hintCells: { row: number; col: number }[];
    difficulty: Difficulty;
    timer: number;
    gameCompleted: boolean;
    history: GameMove[];
    historyIndex: number;
}

export const useGameState = () => {
    const [game] = useState(() => new SudokuGame());
    const [gameState, setGameState] = useState<GameState>(() => {
        // Try to load saved game first
        const savedGame = loadGameFromLocalStorage();
        const savedDifficulty = loadDifficulty() || Difficulty.BEGINNER;
        
        if (savedGame && !savedGame.gameCompleted) {
            // Resume saved game
            return {
                grid: savedGame.grid,
                solution: savedGame.solution,
                givenCells: savedGame.givenCells,
                selectedCell: null,
                errorCells: [],
                hintCells: [],
                difficulty: savedGame.difficulty,
                timer: savedGame.timer,
                gameCompleted: savedGame.gameCompleted,
                history: savedGame.history,
                historyIndex: savedGame.historyIndex
            };
        } else {
            // Start new game with saved difficulty
            const { puzzle, solution } = game.generatePuzzle(savedDifficulty);
            const givenCells = puzzle.map(row => row.map(cell => cell !== 0));
            
            return {
                grid: puzzle,
                solution,
                givenCells,
                selectedCell: null,
                errorCells: [],
                hintCells: [],
                difficulty: savedDifficulty,
                timer: 0,
                gameCompleted: false,
                history: [],
                historyIndex: -1
            };
        }
    });
    
    // Timer effect - only start when user makes first move
    useEffect(() => {
        if (gameState.gameCompleted || gameState.history.length === 0) return;
        
        const interval = setInterval(() => {
            setGameState(prev => {
                const newState = { ...prev, timer: prev.timer + 1 };
                // Auto-save to session every 5 seconds
                if (newState.timer % 5 === 0) {
                    saveGameToSession(newState);
                }
                return newState;
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, [gameState.gameCompleted, gameState.history.length]);
    
    // Auto-save game state to localStorage when it changes
    useEffect(() => {
        if (!gameState.gameCompleted && gameState.history.length > 0) {
            saveGameToLocalStorage(gameState);
        }
    }, [gameState]);
    
    // Save difficulty preference when it changes
    useEffect(() => {
        saveDifficulty(gameState.difficulty);
    }, [gameState.difficulty]);
    
    const startNewGame = useCallback((difficulty: Difficulty = gameState.difficulty) => {
        const { puzzle, solution } = game.generatePuzzle(difficulty);
        const givenCells = puzzle.map(row => row.map(cell => cell !== 0));
        
        // Clear saved game when starting new game
        clearSavedGame();
        
        setGameState({
            grid: puzzle,
            solution,
            givenCells,
            selectedCell: null,
            errorCells: [],
            hintCells: [],
            difficulty,
            timer: 0,
            gameCompleted: false,
            history: [],
            historyIndex: -1
        });
    }, [game, gameState.difficulty]);
    
    const selectCell = useCallback((row: number, col: number) => {
        setGameState(prev => ({
            ...prev,
            selectedCell: { row, col }
        }));
    }, []);
    
    const makeMove = useCallback((row: number, col: number, value: number) => {
        setGameState(prev => {
            if (prev.givenCells[row][col] || prev.gameCompleted) return prev;
            
            const newGrid = prev.grid.map(r => [...r]);
            const oldValue = newGrid[row][col];
            
            if (oldValue === value) return prev; // No change
            
            newGrid[row][col] = value;
            
            // Check if the move is valid
            const isValidMove = value === 0 || game.isValidMove(newGrid, row, col, value);
            
            // Update history
            const move: GameMove = { row, col, oldValue, newValue: value };
            const newHistory = prev.history.slice(0, prev.historyIndex + 1);
            newHistory.push(move);
            
            // Check for errors
            const errorCells = game.hasErrors(newGrid);
            
            // Clear hint cells when making a move
            const hintCells = prev.hintCells.filter(cell =>
                !(cell.row === row && cell.col === col)
            );
            
            // Check if game is completed
            const gameCompleted = game.isComplete(newGrid) && errorCells.length === 0;
            
            // Update statistics if game is completed
            if (gameCompleted && !prev.gameCompleted) {
                updateGameStats(prev.difficulty, true, prev.timer + 1);
                clearSavedGame(); // Clear saved game when completed
            }
            
            return {
                ...prev,
                grid: newGrid,
                errorCells,
                hintCells,
                gameCompleted,
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        });
    }, [game]);
    
    const getHint = useCallback(() => {
        setGameState(prev => {
            if (prev.gameCompleted) {
                return prev;
            }

            const hint = game.getHint(prev.grid, prev.solution, prev.selectedCell);

            if (!hint) {
                return prev;
            }

            const { row, col, value } = hint;
            const newGrid = prev.grid.map(r => [...r]);
            const oldValue = newGrid[row][col];

            if (oldValue === value) {
                return prev;
            }

            newGrid[row][col] = value;

            const move: GameMove = { row, col, oldValue, newValue: value };
            const newHistory = prev.history.slice(0, prev.historyIndex + 1);
            newHistory.push(move);

            const errorCells = game.hasErrors(newGrid);
            const hintCells = [...prev.hintCells, { row, col }];
            const gameCompleted = game.isComplete(newGrid) && errorCells.length === 0;

            if (gameCompleted && !prev.gameCompleted) {
                updateGameStats(prev.difficulty, true, prev.timer + 1);
                clearSavedGame();
            }

            return {
                ...prev,
                grid: newGrid,
                errorCells,
                hintCells,
                gameCompleted,
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        });
    }, [game]);
    
    const solvePuzzle = useCallback(() => {
        setGameState(prev => {
            // Update statistics when solved (but not as a completed game)
            updateGameStats(prev.difficulty, false);
            clearSavedGame(); // Clear saved game when solved
            
            return {
                ...prev,
                grid: prev.solution.map(row => [...row]),
                gameCompleted: true,
                errorCells: [],
                hintCells: []
            };
        });
    }, []);
    
    const undo = useCallback(() => {
        setGameState(prev => {
            if (prev.historyIndex < 0) return prev;
            
            const move = prev.history[prev.historyIndex];
            const newGrid = prev.grid.map(r => [...r]);
            newGrid[move.row][move.col] = move.oldValue;
            
            const errorCells = game.hasErrors(newGrid);
            const gameCompleted = game.isComplete(newGrid) && errorCells.length === 0;
            
            return {
                ...prev,
                grid: newGrid,
                errorCells,
                gameCompleted,
                historyIndex: prev.historyIndex - 1
            };
        });
    }, [game]);
    
    const redo = useCallback(() => {
        setGameState(prev => {
            if (prev.historyIndex >= prev.history.length - 1) return prev;
            
            const nextIndex = prev.historyIndex + 1;
            const move = prev.history[nextIndex];
            const newGrid = prev.grid.map(r => [...r]);
            newGrid[move.row][move.col] = move.newValue;
            
            const errorCells = game.hasErrors(newGrid);
            const gameCompleted = game.isComplete(newGrid) && errorCells.length === 0;
            
            return {
                ...prev,
                grid: newGrid,
                errorCells,
                gameCompleted,
                historyIndex: nextIndex
            };
        });
    }, [game]);
    
    return {
        gameState,
        startNewGame,
        selectCell,
        makeMove,
        getHint,
        solvePuzzle,
        undo,
        redo,
        canUndo: gameState.historyIndex >= 0,
        canRedo: gameState.historyIndex < gameState.history.length - 1
    };
};