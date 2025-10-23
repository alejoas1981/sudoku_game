import React, { useEffect } from 'react';
import { SudokuGrid } from '@/components/SudokuGrid';
import { GameControls } from '@/components/GameControls';
import { NumberPad } from '@/components/NumberPad';
import { Footer } from '@/components/Footer';
import { ChatGPTHelper } from '@/components/ChatGPTHelper';
import { useGameState } from '@/hooks/useGameState';
import { useTranslation } from '@/context/TranslationContext';
import { Difficulty } from '@/lib/sudoku';
import { initializeAPI, cleanupAPI } from '@/lib/api';
import { register } from '@/lib/serviceWorkerRegistration';
import { toast } from 'sonner';
import { BookMarked } from 'lucide-react'; // <-- Import the icon

const Index = () => {
    const { t, loading } = useTranslation();
    const {
        gameState,
        startNewGame,
        selectCell,
        makeMove,
        getHint,
        solvePuzzle,
        undo,
        redo,
        canUndo,
        canRedo,
        toggleIntellectualAssistant
    } = useGameState();

    useEffect(() => {
        initializeAPI();

        register(registration => {
            toast('A new version is available!', {
                action: {
                    label: 'Update',
                    onClick: () => {
                        const waitingWorker = registration.waiting;
                        if (waitingWorker) {
                            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                            waitingWorker.addEventListener('statechange', event => {
                                if ((event.target as ServiceWorker).state === 'activated') {
                                    window.location.reload();
                                }
                            });
                        }
                    },
                },
                duration: Infinity,
                dismissible: false,
            });
        });

        return () => cleanupAPI();
    }, []);

    // Effect to update document title when language changes
    useEffect(() => {
        if (!loading) {
            document.title = t('game.title');
        }
    }, [t, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }
    
    const handleCellClick = (row: number, col: number) => {
        selectCell(row, col);
    };

    const handleCellChange = (row: number, col: number, value: number) => {
        makeMove(row, col, value);
    };

    const handleDifficultyChange = (difficulty: Difficulty) => {
        startNewGame(difficulty);
    };

    const handleNumberSelect = (number: number) => {
        if (gameState.selectedCell) {
            makeMove(gameState.selectedCell.row, gameState.selectedCell.col, number);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
                        <BookMarked className="w-8 h-8" /> {/* <-- Add the icon */}
                        {t('game.title')}
                    </h1>
                    <p className="text-muted-foreground">{t('game.subtitle')}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:order-1">
                        <GameControls
                            difficulty={gameState.difficulty}
                            onDifficultyChange={handleDifficultyChange}
                            onNewGame={() => startNewGame()}
                            onHint={getHint}
                            onSolve={solvePuzzle}
                            onUndo={undo}
                            onRedo={redo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            timer={gameState.timer}
                            gameCompleted={gameState.gameCompleted}
                            isIntellectualAssistantEnabled={gameState.isIntellectualAssistantEnabled}
                            onToggleIntellectualAssistant={toggleIntellectualAssistant}
                        />
                        <div className="mt-4 flex justify-center">
                            <ChatGPTHelper gameState={gameState} />
                        </div>
                    </div>

                    <div className="lg:order-2 flex flex-col items-center">
                        <SudokuGrid
                            grid={gameState.grid}
                            solution={gameState.solution}
                            highlightedNumber={gameState.highlightedNumber}
                            givenCells={gameState.givenCells}
                            selectedCell={gameState.selectedCell}
                            errorCells={gameState.errorCells}
                            intellectualErrorCells={gameState.intellectualErrorCells}
                            hintCells={gameState.hintCells}
                            onCellClick={handleCellClick}
                            onCellChange={handleCellChange}
                        />
                    </div>

                    <div className="lg:order-3">
                        <NumberPad
                            onNumberSelect={handleNumberSelect}
                            selectedCell={gameState.selectedCell}
                        />
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
};

export default Index;