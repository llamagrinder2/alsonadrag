// main.js
import { resetPlayerState, resetMobState, resetGameModifiers, resetShopItems } from './game-state.js';
import { updateUI, appendToLog, resetFightDisplay, toggleGameButtons } from './ui-manager.js';
import { setupEventListeners } from './event-handlers.js';

// Teljes játék reset (ez volt a Playtest.Reset)
export function resetGame() {
    resetPlayerState();
    resetMobState();
    resetGameModifiers();
    resetShopItems();

    appendToLog("Game reset. Welcome back, adventurer!");

    toggleGameButtons(true); // Engedélyezi a játék gombokat
    resetFightDisplay(); // Törli a sebzéskijelzőket, visszaállítja a roll gombot
    updateUI(); // Frissíti a UI-t az alapállapotra
}

// Játék inicializálása
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners(); // Eseménykezelők beállítása
    resetGame(); // Játék elindítása az alapállapotból
});
