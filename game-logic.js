// boss-logic.js

import { player, mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, toggleGameButtons, togglePlayerActionButtons, hideAllCombatButtons, displayMobPredictedAction } from './ui-manager.js';
import { calculateValue, rollDiceAndPredictMobAction, checkPlayerLVUp, death } from './game-logic.js'; // rollDiceAndPredictMobAction importálva

// Boss számlálóhoz
let mobsDefeated = 0;
const mobsUntilBoss = 5; // Ennyi mob után jön a boss
const bossCounterText = document.getElementById('bossCounterText');
const rollButton = document.getElementById('rollButton');
const goMobButton = document.getElementById('goMobButton');


export function bossCountUpdate() {
    mobsDefeated++;
    bossCounterText.textContent = `${mobsUntilBoss - (mobsDefeated % mobsUntilBoss)} mobs left until the Boss.`;

    if (mobsDefeated % mobsUntilBoss === 0) {
        appendToLog("A Boss is approaching! Prepare for a mighty battle!");
        bossSummon(); // A boss azonnal megjelenik, nem kell külön gomb
    }
}

// A `bossButton` függvényre már nincs szükség, mivel a boss azonnal megjelenik,
// de meghagyjuk, ha valamilyen egyéb boss aktiválási logika lenne.
// Jelenleg a `bossSummon` hívódik a `bossCountUpdate`-ből.
export function bossButton() {
    // Ez a funkció valószínűleg nem lesz közvetlenül hívva egy gombnyomásra
    // a jelenlegi logikával, mivel a boss automatikusan jön.
    // Esetleg egy modal ablakot nyithatna meg, ha szeretnénk.
    appendToLog("The dungeon trembles... A Boss has appeared! Prepare for battle!");
}

export function bossSummon() {
    // Mob objektum felülírása boss adatokkal
    mob.name = "Ogre Lord"; // Boss neve
    mob.level = player.level + 5; // Boss szintje, pl. játékos szint + 5

    mob.minMobHpCalculated = calculateValue(
        mob.level, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MIN * 2, null // Kétszeres Z érték a bossnak
    );
    mob.maxMobHpCalculated = calculateValue(
        mob.level, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MAX * 2, null // Kétszeres Z érték a bossnak
    );
    mob.maxHp = Math.ceil(Math.random() * (mob.maxMobHpCalculated - mob.minMobHpCalculated) + mob.minMobHpCalculated);
    mob.currentHp = mob.maxHp;

    mob.baseAttack = calculateValue(
        mob.level, gameModifiers.MOB_DAMAGE_Y, gameModifiers.MOB_DAMAGE_Z_MIN * 1.5, gameModifiers.MOB_DAMAGE_Z_MAX * 1.5
    );
    mob.armor = 0; // Boss armor (ezt is paraméterezhetjük, ha van)

    mob.minMobXpCalculated = calculateValue(
        mob.level, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MIN * 5, null
    );
    mob.maxMobXpCalculated = calculateValue(
        mob.level, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MAX * 5, null
    );
    
    const minGold = calculateValue(mob.level, gameModifiers.GOLD_DROP_MIN_Y, gameModifiers.GOLD_DROP_MIN_Z * 10);
    const maxGold = calculateValue(mob.level, gameModifiers.GOLD_DROP_MAX_Y, gameModifiers.GOLD_DROP_MAX_Z * 10);
    mob.coinReward = Math.ceil(Math.random() * (maxGold - minGold) + minGold);

    appendToLog(`A terrifying ${mob.name} (LV${mob.level}) appeared! HP: ${mob.maxHp}, DMG: ${mob.baseAttack}`);
    updateUI();
    // A harci kijelzőt (kockadobás eredmények) a `rollDiceAndPredictMobAction` fogja beállítani.
    // resetFightDisplay(); // Már nem hívjuk itt, a `rollDiceAndPredictMobAction` frissíti

    // Boss módba kapcsolás
    document.getElementById('rollButton').textContent = "Roll (Boss Fight)";
    document.getElementById('rollButton').onclick = rollDiceAndPredictMobAction; // Visszaállítjuk az alap harci funkcióra
    goMobButton.disabled = true; // "Go Mob" gomb letiltása, amíg a boss él
    toggleGameButtons(false); // Letiltjuk az egyéb fő gombokat
    togglePlayerActionButtons(false); // Kezdetben letiltjuk a játékos akció gombokat
    displayMobPredictedAction('???'); // Reseteli a mob akció előrejelzést
}

export function handleBossDefeat() {
    appendToLog(`You bravely defeated the ${mob.name}! You feel stronger than ever!`);
    
    // Alap XP és Gold jutalom (az XP-t a handleMobDefeatben számoltuk, de itt érdemes felülírni egy boss XP-vel.)
    // Itt használjuk a mob.xpReward-ot, amit a handleMobDefeat számol ki.
    // Mivel a handleMobDefeat hívódik, és ott az xpReward a mob.minMobXpCalculated / maxMobXpCalculated alapján számolódik,
    // a boss paramétereivel ez már meg fog történni.
    // player.currentExp += mob.xpReward; // Ezt a handleMobDefeat már kezeli
    // player.bank += mob.coinReward; // Ezt a handleMobDefeat már kezeli

    updateUI();
    checkPlayerLVUp();

    // Vissza a normál mobokhoz
    rollButton.textContent = "Roll";
    rollButton.onclick = rollDiceAndPredictMobAction; // Visszaállítjuk az alap funkcióra
    goMobButton.disabled = false; // "Go Mob" újra engedélyezése
    toggleGameButtons(true); // Engedélyezzük a fő gombokat

    // Reseteljük a boss számlálót
    mobsDefeated = 0;
    bossCounterText.textContent = `${mobsUntilBoss - (mobsDefeated % mobsUntilBoss)} mobs left until the Boss.`;

    // A `nextMob()` függvényt közvetlenül nem hívjuk itt, a felhasználó majd a 'Go Mob' gombbal tudja generálni a következőt.
    // Ez a `handleMobDefeat`-ben már meg van oldva.
}
