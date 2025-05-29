// spells.js

import { player } from './game-state.js'; // <-- EZ AZ ÚJ SOR
import { updateUI, appendToLog, toggleGameButtons } from './ui-manager.js';

let thirdEyeTimeout = null;
let boostSpellTimeout = null;

// Harmadik Szem spell
export function activateThirdEye() {
    if (!player.activeSpells.thirdEye) {
        player.activeSpells.thirdEye = true;
        player.attackMultiplier *= 1.5; // Példa: 50%-os támadás bónusz
        appendToLog("Third Eye activated! Your next attack will deal more damage!");
        updateUI();

        // Időzítő beállítása a spell végére
        thirdEyeTimeout = setTimeout(() => {
            endThirdEye();
        }, 10000); // 10 másodperc múlva jár le
    } else {
        appendToLog("Third Eye is already active!");
    }
}

export function endThirdEye() {
    if (player.activeSpells.thirdEye) {
        player.activeSpells.thirdEye = false;
        player.attackMultiplier /= 1.5; // Visszaállítjuk az eredeti támadás erejét
        appendToLog("Third Eye faded.");
        updateUI();
        clearTimeout(thirdEyeTimeout); // Töröljük az időzítőt, ha manuálisan fejeződik be
        thirdEyeTimeout = null;
    }
}

// Boost Spell (Attack Buff)
export function activateBoostSpell() {
    if (!player.activeSpells.boostSpell) {
        player.activeSpells.boostSpell = true;
        player.baseAttackMultiplier *= 2; // Példa: kétszeres alap támadás
        appendToLog("Boost Spell activated! Your base attack is temporarily doubled!");
        updateUI();

        boostSpellTimeout = setTimeout(() => {
            endBoostSpell();
        }, 15000); // 15 másodperc múlva jár le
    } else {
        appendToLog("Boost Spell is already active!");
    }
}

export function endBoostSpell() {
    if (player.activeSpells.boostSpell) {
        player.activeSpells.boostSpell = false;
        player.baseAttackMultiplier /= 2; // Visszaállítjuk az eredeti alap támadást
        appendToLog("Boost Spell faded.");
        updateUI();
        clearTimeout(boostSpellTimeout);
        boostSpellTimeout = null;
    }
}
