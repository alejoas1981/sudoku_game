# Sudoku Journal

Local Sudoku game with progress tracking, PWA support, and server synchronization.  
Built with **React + TypeScript + Vite + Tailwind CSS**, supporting **5 languages** and **5 difficulty levels**.  
The game can be installed as a standalone application, and progress is stored both locally and on the server.
---

## Features

- Full-featured Sudoku game with 9x9 grid, error highlighting, timer, and move history.
- Five difficulty levels: Beginner, Amateur, Experienced, Veteran, Master.
- Local and server storage: `localStorage`, `sessionStorage`, REST API (`https://api-15-puzzle.onrender.com`).
- Multilingual interface: support for 5 languages with dynamic switching.
- PWA: offline mode, installable on desktop or mobile, resource caching.
- Built-in ChatGPT assistant for beginner guidance.
- Journal-style design: minimalistic layout, clean fonts, light/warm colors.

---

## Main Screen

- 9x9 grid with initial numbers and empty cells.
- Highlighting for errors and selected cell.
- Game timer.
- Control buttons: New Game, Hint, Solve, Undo/Redo.
- Difficulty selection: 5 levels.
- Footer with language switcher.
- Fully responsive for PC, Tablet, and Mobile (portrait and landscape).

---

## Game Logic

- Generate complete board and remove numbers based on difficulty.
- Check rows, columns, and 3x3 blocks.
- Hint highlights a correct cell.
- Solve fills the entire board automatically.
- Undo/Redo using move history array.

---

## Storage and Synchronization

- `localStorage`: saved game, records, selected language, difficulty.
- `sessionStorage`: current session (timer, move history).
- REST API for server synchronization.
- Ping server every 45 seconds (`/ping`) to maintain session.
- Automatic fallback to `localStorage` if server is unavailable.
- Bi-directional synchronization between client and server.

---

## Project Structure
/src
App.tsx — main component
/components
Grid.tsx — game grid
Controls.tsx — buttons, timer, difficulty selector
Footer.tsx — language switcher
/lib
sudoku.ts — generator, checker, solver
api.ts — server interaction and synchronization
/styles
globals.css — Tailwind CSS
/public
/lang/*.json — translation files
manifest.json — PWA manifest
/src/service-worker.ts — offline caching


---

## Multilingual Support

- 5 languages via JSON files.
- Dynamic language switching in the footer.
- Selected language stored in `localStorage`.

---

## PWA

- `manifest.json` with icons, name, and colors.
- Service worker for caching HTML, JS, CSS, and translation files.
- Fully offline-capable and installable as an application.
- Tested on mobile devices.

---

## Beginner Assistant

- Integrated with **ChatGPT**.
- Provides move suggestions and explains strategies.
- Accessible via "Help" button.

---

## Screenshots

![photo_2025-09-30_18-51-44](https://github.com/user-attachments/assets/97786ee3-daa2-4b5d-a36c-f051b5c86a61)
![photo_2025-09-30_18-50-50](https://github.com/user-attachments/assets/87745055-72f3-4603-bc0a-79675173ab6d)
![photo_2025-09-30_18-50-53](https://github.com/user-attachments/assets/fa9d3ebe-f51b-4f00-ab89-37b544bbe4db)

---

## Installation and Running

```bash
# install dependencies
npm install

# run in development mode
npm run dev

# build for production
npm run build


