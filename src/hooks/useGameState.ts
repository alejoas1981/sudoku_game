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
    highlightedNumber: number | null;
    errorCells: { row: number; col: number }[];
    hintCells: { row: number; col: number }[];
    difficulty: Difficulty;
    timer: number;
    gameCompleted: boolean;
    history: GameMove[];
    historyIndex: number;
}

const createInitialState = (game: SudokuGame): GameState => {
    const savedGame = loadGameFromLocalStorage();
    const savedDifficulty = loadDifficulty() || Difficulty.BEGINNER;

    if (savedGame && !savedGame.gameCompleted) {
        return {
            grid: savedGame.grid,
            solution: savedGame.solution,
            givenCells: savedGame.givenCells,
            difficulty: savedGame.difficulty,
            timer: savedGame.timer,
            gameCompleted: savedGame.gameCompleted,
            history: savedGame.history || [],
            historyIndex: savedGame.historyIndex,
            selectedCell: null,
            highlightedNumber: null,
            errorCells: [],
            hintCells: [],
        };
    } else {
        const { puzzle, solution } = game.generatePuzzle(savedDifficulty);
        const givenCells = puzzle.map(row => row.map(cell => cell !== 0));
        return {
            grid: puzzle,
            solution,
            givenCells,
            selectedCell: null,
            highlightedNumber: null,
            errorCells: [],
            hintCells: [],
            difficulty: savedDifficulty,
            timer: 0,
            gameCompleted: false,
            history: [],
            historyIndex: -1
        };
    }
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
        setGameState(prevState => ({
            ...prevState,
            grid: puzzle,
            solution,
            givenCells,
            selectedCell: null,
            highlightedNumber: null,
            errorCells: [],
            hintCells: [],
            difficulty,
            timer: 0,
            gameCompleted: false,
            history: [],
            historyIndex: -1
        }));
    }, [game]);

    const selectCell = useCallback((row: number, col: number) => {
        setGameState(prev => ({
            ...prev,
            selectedCell: { row, col },
            highlightedNumber: prev.grid[row][col]
        }));
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

            if (gameCompleted && !prev.gameCompleted) {
                updateGameStats(prev.difficulty, true, prev.timer + 1);
                clearSavedGame();
            }

            return {
                ...prev,
                grid: newGrid,
                errorCells,
                gameCompleted,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                highlightedNumber: value
            };
        });
    }, [game]);

    const getHint = useCallback(() => {
        if (gameState.selectedCell) {
            const hint = game.getHint(gameState.grid, gameState.solution, gameState.selectedCell);
            if (hint) {
                makeMove(hint.row, hint.col, hint.value);
            }
        }
    }, [game, makeMove, gameState.selectedCell, gameState.grid, gameState.solution]);

    const solvePuzzle = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            grid: prev.solution.map(row => [...row]),
            gameCompleted: true,
            errorCells: [],
            hintCells: [],
            highlightedNumber: null
        }));
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
                historyIndex: prev.historyIndex - 1,
                selectedCell: { row: move.row, col: move.col },
                highlightedNumber: newGrid[move.row][move.col]
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
                historyIndex: nextIndex,
                selectedCell: { row: move.row, col: move.col },
                highlightedNumber: newGrid[move.row][move.col]
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