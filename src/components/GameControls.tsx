import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Lightbulb, Eye, RotateCcw, RotateCw, Clock } from 'lucide-react';
import { Difficulty, DIFFICULTY_SETTINGS } from '@/lib/sudoku';
import { useTranslation } from '@/hooks/useTranslation';

interface GameControlsProps {
    difficulty: Difficulty;
    onDifficultyChange: (difficulty: Difficulty) => void;
    onNewGame: () => void;
    onHint: () => void;
    onSolve: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    timer: number;
    gameCompleted: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
                                                              difficulty,
                                                              onDifficultyChange,
                                                              onNewGame,
                                                              onHint,
                                                              onSolve,
                                                              onUndo,
                                                              onRedo,
                                                              canUndo,
                                                              canRedo,
                                                              timer,
                                                              gameCompleted
                                                          }) => {
    const { t } = useTranslation();
    
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            {/* Timer */}
            <div className="journal-paper p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-lg font-mono">
                    <Clock className="w-5 h-5" />
                    <span className={gameCompleted ? 'text-success font-semibold' : ''}>
            {formatTime(timer)}
          </span>
                </div>
                {gameCompleted && (
                    <p className="text-sm text-success mt-1">{t('game.congratulations')}</p>
                )}
            </div>
            
            {/* Difficulty Selection */}
            <div className="journal-paper p-4">
                <label className="block text-sm font-medium mb-2">{t('game.difficultyLevel')}</label>
                <Select value={difficulty} onValueChange={(value) => onDifficultyChange(value as Difficulty)}>
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(DIFFICULTY_SETTINGS).map(([key, setting]) => (
                            <SelectItem key={key} value={key}>
                                {t(`difficulty.${key}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            {/* Main Controls */}
            <div className="journal-paper p-4 space-y-3">
                <Button
                    onClick={onNewGame}
                    className="journal-button primary w-full h-10"
                >
                    <Play className="w-4 h-4 mr-2" />
                    {t('game.newGame')}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        onClick={onHint}
                        className="journal-button secondary h-10"
                        disabled={gameCompleted}
                    >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        {t('game.hint')}
                    </Button>
                    
                    <Button
                        onClick={onSolve}
                        className="journal-button outline h-10"
                        disabled={gameCompleted}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        {t('game.solve')}
                    </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        onClick={onUndo}
                        className="journal-button outline h-10"
                        disabled={!canUndo}
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {t('game.undo')}
                    </Button>
                    
                    <Button
                        onClick={onRedo}
                        className="journal-button outline h-10"
                        disabled={!canRedo}
                    >
                        <RotateCw className="w-4 h-4 mr-2" />
                        {t('game.redo')}
                    </Button>
                </div>
            </div>
        </div>
    );
};