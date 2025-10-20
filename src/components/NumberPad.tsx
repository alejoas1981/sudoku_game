import React from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface NumberPadProps {
    onNumberSelect: (number: number) => void;
    selectedCell: { row: number; col: number } | null;
}

export const NumberPad: React.FC<NumberPadProps> = ({
                                                        onNumberSelect,
                                                        selectedCell
                                                    }) => {
    const { t } = useTranslation();
    
    if (!selectedCell) {
        return (
            <div className="journal-paper p-4 text-center text-muted-foreground">
                {t('game.selectCell')}
            </div>
        );
    }
    
    return (
        <div className="journal-paper p-4">
            <p className="text-sm text-muted-foreground mb-3 text-center">
                {t('game.cellPosition', { row: selectedCell.row + 1, col: selectedCell.col + 1 })}
            </p>
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                    <Button
                        key={number}
                        onClick={() => onNumberSelect(number)}
                        className="journal-button outline h-12 text-lg font-mono"
                    >
                        {number}
                    </Button>
                ))}
            </div>
            <Button
                onClick={() => onNumberSelect(0)}
                className="journal-button secondary w-full mt-2 h-10"
            >
                <Eraser className="w-4 h-4 mr-2" />
                {t('game.clear')}
            </Button>
        </div>
    );
};