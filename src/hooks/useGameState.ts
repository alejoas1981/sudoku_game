import { useState, useEffect, useCallback } from 'react';
import { SudokuGame, Difficulty } from '@/lib/sudoku';
import {
    saveGameToLocalStorage,
    saveGameToSession,
    loadGameFromLocalStorage,
    saveDifficulty,
    loadDifficulty,
    updateGameStats,
    clearSavedGame,
    saveIntellectualAssistantEnabled,
    loadIntellectualAssistantEnabled
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
    highlightedCells: { row: number; col: number }[];
    highlightedNumber: number | null;
    errorCells: { row: number; col: number }[];
    intellectualErrorCells: { row: number; col: number }[];
    hintCells: { row: number; col: number }[];
    difficulty: Difficulty;
    timer: number;
    gameCompleted: boolean;
    history: GameMove[];
    historyIndex: number;
    isIntellectualAssistantEnabled: boolean;
}

const createInitialState = (game: SudokuGame): GameState => {
    const savedGame = loadGameFromLocalStorage();
    const savedDifficulty = loadDifficulty() || Difficulty.BEGINNER;
    const isIntellectualAssistantEnabled = loadIntellectualAssistantEnabled();

    const getInitialState = () => {
        if (savedGame && !savedGame.gameCompleted) {
            return {
                ...savedGame,
                selectedCell: null,
                highlightedCells: [],
                highlightedNumber: null,
                errorCells: savedGame.errorCells || [],
                intellectualErrorCells: savedGame.intellectualErrorCells || [],
                hintCells: [],
                isIntellectualAssistantEnabled,
            };
        } else {
            const { puzzle, solution } = game.generatePuzzle(savedDifficulty);
            const givenCells = puzzle.map(row => row.map(cell => cell !== 0));
            return {
                grid: puzzle,
                solution,
                givenCells,
                selectedCell: null,
                highlightedCells: [],
                highlightedNumber: null,
                errorCells: [],
                intellectualErrorCells: [],
                hintCells: [],
                difficulty: savedDifficulty,
                timer: 0,
                gameCompleted: false,
                history: [],
                historyIndex: -1,
                isIntellectualAssistantEnabled,
            };
        }
    };
    return getInitialState();
};

export const useGameState = () => {
    const [game] = useState(() => new SudokuGame());
    const [gameState, setGameState] = useState<GameState>(() => createInitialState(game));

    useEffect(() => {
        if (gameState.gameCompleted || gameState.history.length === 0) return;
        const interval = setInterval(() => {
            setGameState(prev => {
                const newState = { ...prev, timer: prev.timer + 1 };
                if (newState.timer % 5 === 0) {
                    saveGameToSession(newState);
                }
                return newState;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState.gameCompleted, gameState.history.length]);

    useEffect(() => {
        if (!gameState.gameCompleted && gameState.history.length > 0) {
            saveGameToLocalStorage(gameState);
        }
    }, [gameState]);

    useEffect(() => {
        saveDifficulty(gameState.difficulty);
    }, [gameState.difficulty]);

    const startNewGame = useCallback((difficulty: Difficulty = gameState.difficulty) => {
        const { puzzle, solution } = game.generatePuzzle(difficulty);
        const givenCells = puzzle.map(row => row.map(cell => cell !== 0));
        clearSavedGame();
        setGameState(prev => ({
            ...prev,
            grid: puzzle,
            solution,
            givenCells,
            selectedCell: null,
            highlightedCells: [],
            highlightedNumber: null,
            errorCells: [],
            intellectualErrorCells: [],
            hintCells: [],
            difficulty,
            timer: 0,
            gameCompleted: false,
            history: [],
            historyIndex: -1,
        }));
    }, [game, gameState.difficulty]);

    const toggleIntellectualAssistant = useCallback(() => {
        setGameState(prev => {
            const newIsEnabled = !prev.isIntellectualAssistantEnabled;
            saveIntellectualAssistantEnabled(newIsEnabled);
            return {
                ...prev,
                isIntellectualAssistantEnabled: newIsEnabled,
                intellectualErrorCells: [], // Clear errors when toggling
            };
        });
    }, []);

    const selectCell = useCallback((row: number, col: number) => {
        setGameState(prev => {
            const selectedValue = prev.grid[row][col];
            const highlightedCells: { row: number; col: number }[] = [];

            if (selectedValue !== 0) {
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (prev.grid[r][c] === selectedValue) {
                            highlightedCells.push({ row: r, col: c });
                        }
                    }
                }
            }

            return {
                ...prev,
                selectedCell: { row, col },
                highlightedCells,
                highlightedNumber: selectedValue
            };
        });
    }, []);

    const makeMove = useCallback((row: number, col: number, value: number) => {
        setGameState(prev => {
            if (prev.givenCells[row][col] || prev.gameCompleted) return prev;

            const newGrid = prev.grid.map(r => [...r]);
            const oldValue = newGrid[row][col];
            if (oldValue === value) return prev;

            newGrid[row][col] = value;

            const move: GameMove = { row, col, oldValue, newValue: value };
            const newHistory = prev.history.slice(0, prev.historyIndex + 1);
            newHistory.push(move);

            const errorCells = game.hasErrors(newGrid);
            const gameCompleted = game.isComplete(newGrid) && errorCells.length === 0;

            let intellectualErrorCells = [...(prev.intellectualErrorCells || [])];
            if (prev.isIntellectualAssistantEnabled) {
                const isCorrect = value === 0 || prev.solution[row][col] === value;
                const cellPos = { row, col };
                const existingErrorIndex = intellectualErrorCells.findIndex(err => err.row === row && err.col === col);

                if (!isCorrect) {
                    if (existingErrorIndex === -1) {
                        intellectualErrorCells.push(cellPos);
                    }
                } else {
                    if (existingErrorIndex !== -1) {
                        intellectualErrorCells.splice(existingErrorIndex, 1);
                    }
                }
            }

            if (gameCompleted && !prev.gameCompleted) {
                updateGameStats(prev.difficulty, true, prev.timer + 1);
                clearSavedGame();
            }

            const highlightedCells: { row: number; col: number }[] = [];
            if (value !== 0) {
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (newGrid[r][c] === value) {
                            highlightedCells.push({ row: r, col: c });
                        }
                    }
                }
            }

            return {
                ...prev,
                grid: newGrid,
                errorCells,
                intellectualErrorCells,
                gameCompleted,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                highlightedCells,
                highlightedNumber: value
            };
        });
    }, [game]);

    const getHint = useCallback(() => {
        setGameState(prev => {
            if (prev.gameCompleted) return prev;
            const hint = game.getHint(prev.grid, prev.solution, prev.selectedCell);
            if (!hint) return prev;

            const { row, col, value } = hint;
            makeMove(row, col, value);
            return prev;
        });
    }, [game, makeMove]);

    const solvePuzzle = useCallback(() => {
        setGameState(prev => {
            updateGameStats(prev.difficulty, false);
            clearSavedGame();
            return {
                ...prev,
                grid: prev.solution.map(row => [...row]),
                gameCompleted: true,
                errorCells: [],
                intellectualErrorCells: [],
                hintCells: [],
                highlightedCells: [],
                highlightedNumber: null
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
        toggleIntellectualAssistant,
        canUndo: gameState.historyIndex >= 0,
        canRedo: gameState.historyIndex < gameState.history.length - 1
    };
};