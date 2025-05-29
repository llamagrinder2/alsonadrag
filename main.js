// main.js

import { player, mob } from './game-state.js';
import { updateUI, appendToLog, showFloatingText } from './ui-manager.js';
import { initializeEventListeners } from './event-handlers.js';
import { nextMob, updatePlayerStats } from './game-logic.js'; // nextMob és updatePlayerStats importálása

// Játék inicializálása
function initGame() {
    appendToLog("Game starting...");
    updatePlayerStats(); // Játékos statisztikák beállítása az aktuális szint alapján (pl. max HP, baseAttack)
    nextMob(); // Első mob generálása
    initializeEventListeners(); // Eseménykezelők inicializálása
    updateUI(); // Kezdő UI frissítés
    appendToLog("Game ready! Click 'Go Mob' to start a battle!");
}

// Játék indítása
window.onload = initGame;
