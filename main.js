// main.js

// Csak az 'initGame' függvényt importáljuk a 'game-logic.js'-ből,
// mivel ez felelős a játék teljes inicializálásáért.
import { initGame } from './game-logic.js';
// Az 'event-handlers.js' felel az eseményfigyelők beállításáért,
// és ő maga importálja a szükséges függvényeket (pl. nextMob, handlePlayerAction).
import { initializeEventListeners } from './event-handlers.js';
// Az 'ui-manager.js' 'updateUI' függvénye szükséges a kezdeti UI frissítéshez.
import { updateUI } from './ui-manager.js';
// Importáljuk a shop gombok frissítő függvényét is, ami a shop modal nyitásakor hívódik.
import { updateShopButtons } from './event-handlers.js';


// Játék inicializálása, miután a DOM teljesen betöltődött.
// A 'DOMContentLoaded' a preferált esemény ehhez, nem a 'window.onload'.
document.addEventListener('DOMContentLoaded', () => {
    initGame();                  // Elindítja a játék logikáját (pl. játékos statok, első mob)
    initializeEventListeners();  // Beállítja az összes UI eseményfigyelőt
    updateUI();                  // Frissíti a játék kezdeti állapotát a UI-n
    updateShopButtons();         // Frissíti a shop gombokat a kezdeti állapot alapján (pl. zárolások)
});
