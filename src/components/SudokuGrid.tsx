import React from 'react';
import { cn } from '@/lib/utils';

interface SudokuGridProps {
    grid: number[][];
    solution: number[][]; // Added to fix TS2322
    givenCells: boolean[][];
    selectedCell: { row: number; col: number } | null;
    highlightedCells?: { row: number; col: number }[];
    highlightedNumber: number | null;
    errorCells?: { row: number; col: number }[];
    intellectualErrorCells?: { row: number; col: number }[];
    hintCells?: { row: number; col: number }[];
    onCellClick: (row: number, col: number) => void;
    onCellChange: (row: number, col: number, value: number) => void;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
    grid,
    givenCells,
    selectedCell,
    highlightedCells = [], // Default value to prevent crash
    highlightedNumber,
    errorCells = [], // Default value to prevent crash
    intellectualErrorCells = [], // Default value to prevent crash
    hintCells = [], // Default value to prevent crash
    onCellClick,
    onCellChange
}) => {
    const isStandardError = (row: number, col: number) =>
        errorCells.some(cell => cell.row === row && cell.col === col);
    
    const DOUBLE_TAP_DELAY = 300; // max time between taps in ms
    
    const lastTapRef = React.useRef<{ row: number; col: number; time: number } | null>(null);

    const isIntellectualError = (row: number, col: number) =>
        intellectualErrorCells.some(cell => cell.row === row && cell.col === col);

    const isHint = (row: number, col: number) =>
        hintCells.some(cell => cell.row === row && cell.col === col);

    const isSelected = (row: number, col: number) =>
        selectedCell?.row === row && selectedCell?.col === col;

    const isHighlighted = (row: number, col: number) => {
        if (grid[row][col] === 0) return false;
        return grid[row][col] === highlightedNumber;
    };

    const isRowColHighlighted = (row: number, col: number) => {
        if (!selectedCell) return false;
        return selectedCell.row === row || selectedCell.col === col;
    };

    const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
        if (givenCells[row][col]) return;

        const value = parseInt(e.key);
        if (value >= 1 && value <= 9) {
            onCellChange(row, col, value);
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            onCellChange(row, col, 0);
        }
    };
    
    const handleCellTap = (row: number, col: number) => {
        const now = Date.now();
        if (
            lastTapRef.current &&
            lastTapRef.current.row === row &&
            lastTapRef.current.col === col &&
            now - lastTapRef.current.time < DOUBLE_TAP_DELAY
        ) {
            onCellChange(row, col, 0); // double tap detected
            lastTapRef.current = null;
        } else {
            lastTapRef.current = { row, col, time: now };
            onCellClick(row, col); // single tap
        }
    };

    return (
        <div className="sudoku-grid w-full max-w-md mx-auto aspect-square">
            <div className="grid grid-cols-9 h-full">
                {grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={cn(
                                "sudoku-cell cursor-pointer text-center select-none",
                                {
                                    'given': givenCells[rowIndex][colIndex],
                                    'selected': isSelected(rowIndex, colIndex),
                                    'highlight-row-col': isRowColHighlighted(rowIndex, colIndex) && !isSelected(rowIndex, colIndex),
                                    'highlight-number': isHighlighted(rowIndex, colIndex) && !isSelected(rowIndex, colIndex),
                                    'error': isStandardError(rowIndex, colIndex) || isIntellectualError(rowIndex, colIndex),
                                    'hint': isHint(rowIndex, colIndex),
                                    'thick-border-right': colIndex === 2 || colIndex === 5,
                                    'thick-border-bottom': rowIndex === 2 || rowIndex === 5,
                                }
                            )}
                            onClick={() => onCellClick(rowIndex, colIndex)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            onTouchStart={() => handleCellTap(rowIndex, colIndex)}
                            tabIndex={0}
                            role="gridcell"
                            aria-label={`Cell ${rowIndex + 1}, ${colIndex + 1}`}
                        >
                            {cell !== 0 && (
                                <span className="w-full h-full flex items-center justify-center">
                                    {cell}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};