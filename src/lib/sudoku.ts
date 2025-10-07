export type SudokuGrid = number[][];
export type SudokuCell = {
    value: number;
    isGiven: boolean;
    isError: boolean;
    isHint: boolean;
};

export enum Difficulty {
    BEGINNER = 'beginner',
    AMATEUR = 'amateur',
    EXPERIENCED = 'experienced',
    VETERAN = 'veteran',
    MASTER = 'master'
}

export const DIFFICULTY_SETTINGS = {
    [Difficulty.BEGINNER]: { cellsToRemove: 35 },
    [Difficulty.AMATEUR]: { cellsToRemove: 45 },
    [Difficulty.EXPERIENCED]: { cellsToRemove: 50 },
    [Difficulty.VETERAN]: { cellsToRemove: 55 },
    [Difficulty.MASTER]: { cellsToRemove: 60 }
};

export class SudokuGame {
    constructor() {}

    private deepCopy(grid: SudokuGrid): SudokuGrid {
        return grid.map(row => [...row]);
    }

    private isValidPlacement(grid: SudokuGrid, row: number, col: number, num: number): boolean {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) return false;
        }

        // Check 3x3 box
        const startRow = row - (row % 3);
        const startCol = col - (col % 3);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i + startRow][j + startCol] === num) return false;
            }
        }

        return true;
    }

    private solveSudoku(grid: SudokuGrid): boolean {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValidPlacement(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (this.solveSudoku(grid)) return true;
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    private countSolutions(grid: SudokuGrid): number {
        let count = 0;
        const solve = () => {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (this.isValidPlacement(grid, row, col, num)) {
                                grid[row][col] = num;
                                solve();
                                grid[row][col] = 0; // Backtrack
                            }
                        }
                        return;
                    }
                }
            }
            count++;
        };
        solve();
        return count;
    }

    private generateSolution(): SudokuGrid {
        const grid: SudokuGrid = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillDiagonalBoxes(grid);
        this.solveSudoku(grid);
        return grid;
    }

    private fillDiagonalBoxes(grid: SudokuGrid): void {
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(grid, i, i);
        }
    }

    private fillBox(grid: SudokuGrid, row: number, col: number): void {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(numbers);
        let index = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                grid[row + i][col + j] = numbers[index++];
            }
        }
    }

    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    generatePuzzle(difficulty: Difficulty): { puzzle: SudokuGrid; solution: SudokuGrid } {
        const solution = this.generateSolution();
        const puzzle = this.deepCopy(solution);
        const cellsToRemove = DIFFICULTY_SETTINGS[difficulty].cellsToRemove;

        const cells: { row: number; col: number }[] = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                cells.push({ row: r, col: c });
            }
        }
        this.shuffleArray(cells);

        let removedCount = 0;
        for (const cell of cells) {
            if (removedCount >= cellsToRemove) {
                break;
            }

            const { row, col } = cell;
            const originalValue = puzzle[row][col];

            puzzle[row][col] = 0;
            const puzzleCopy = this.deepCopy(puzzle);

            if (this.countSolutions(puzzleCopy) !== 1) {
                puzzle[row][col] = originalValue;
            } else {
                removedCount++;
            }
        }

        return { puzzle, solution };
    }

    isValidMove(grid: SudokuGrid, row: number, col: number, num: number): boolean {
        if (num === 0) return true; // Clearing a cell is always valid
        return this.isValidPlacement(grid, row, col, num);
    }

    isComplete(grid: SudokuGrid): boolean {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) return false;
            }
        }
        return true;
    }

    hasErrors(grid: SudokuGrid): { row: number; col: number }[] {
        const errors: { row: number; col: number }[] = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const num = grid[row][col];
                if (num !== 0) {
                    grid[row][col] = 0;
                    if (!this.isValidPlacement(grid, row, col, num)) {
                        errors.push({ row, col });
                    }
                    grid[row][col] = num;
                }
            }
        }
        return errors;
    }

    getHint(
        grid: SudokuGrid,
        solution: SudokuGrid,
        selectedCell: { row: number; col: number } | null
    ): { row: number; col: number; value: number } | null {
        if (selectedCell) {
            const { row, col } = selectedCell;
            // Provide hint only if the selected cell is empty
            if (grid[row][col] === 0) {
                return { row, col, value: solution[row][col] };
            }
        }
        // If no cell is selected or the selected cell is not empty, do nothing.
        return null;
    }
}