// main.js

// Importáljuk a szükséges függvényeket a game-logic.js és event-handlers.js fájlokból
import { initGame } from './game-logic.js';
import { initializeEventListeners } from './event-handlers.js';

// A DOMContentLoaded eseményre várunk, mielőtt elindítjuk a játékot.
// Ez biztosítja, hogy a HTML elemek már betöltődtek és elérhetők a JavaScript számára.
document.addEventListener('DOMContentLoaded', () => {
    initGame();             // Elindítja a játék logikáját (pl. játékos statok, első mob, ÉS KEZDETI UI FRISSÍTÉS)
    initializeEventListeners(); // Inicializálja az összes eseményfigyelőt
});
