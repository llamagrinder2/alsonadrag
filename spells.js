// spells.js
import { player } from './game-state.js';
import { updateUI, appendToLog } from './ui-manager.js';

export function thirdEye() {
    if (player.activeSpell !== "") {
        alert("Another spell is already active!");
        return;
    }
    player.spellCounter = 10;
    player.activeSpell = "Third Eye";
    appendToLog("Third Eye activated! You can now see the enemy's dice rolls for 10 turns.");
    updateUI();
}

export function endThirdEye() {
    player.activeSpell = "";
    appendToLog("Third Eye effect ended.");
    updateUI();
}

export function boostSpell() {
    if (player.activeSpell !== "") {
        alert("Another spell is already active!");
        return;
    }
    player.spellCounter = 4;
    player.activeSpell = "Boost";
    appendToLog("Boost activated! Your attack will be boosted for 4 turns.");
    updateUI();
}
