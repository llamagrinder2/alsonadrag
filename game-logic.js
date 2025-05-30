// game-logic.js

import { player, mob, gameModifiers, shopItems, resetShopItems } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, showDeathScreen, toggleGameButtons, hideAllCombatButtons, displayPlayerDice, displayMobDice, displayMobPredictedAction, resetFightDisplay } from './ui-manager.js';
import { endThirdEye, endBoostSpell } from './spells.js'; // Spellek befejező függvényeinek importálása

// Játék inicializálása
export function initGame() {
    resetGame(); // Első indításkor is reseteljük a játékot
    appendToLog("Welcome to the Monster Tower!");
    appendToLog("Click 'Go Mob' to start an encounter!");
    updateUI(player, mob);
    toggleGameButtons(true); // Fő gombok láthatóvá tétele
    hideAllCombatButtons(true); // Harci gombok elrejtése
}

// Játék állapotának visszaállítása (halál esetén)
export function resetGame() {
    player.level = 1;
    player.currentExp = 0;
    player.bank = 0;
    player.potions = { 1: 1, 2: 0, 3: 0 }; // Kezdő potik
    player.diceCount = 1;
    player.lastRollResults = [];
    player.lastRollTotal = 0;
    player.currentAction = null;
    player.floorLevel = 1;
    player.baseAttackMultiplier = 1; // Alapértékre vissza
    player.attackMultiplier = 1; // Alapértékre vissza
    player.armor = 0; // Páncél visszaállítása
    player.activeSpells.thirdEye = false;
    player.activeSpells.boostSpell = false;

    endThirdEye(); // Biztosítjuk, hogy a spellek hatása megszűnjön
    endBoostSpell(); // Biztosítjuk, hogy a spellek hatása megszűnjön

    resetShopItems(); // Shop itemek visszaállítása
    calculatePlayerStats(); // Játékos statisztikák újraszámolása
    spawnMob(player.floorLevel); // Új mob spawnolása
    resetFightDisplay(); // Harci kijelzők resetelése

    hideDeathScreen(); // Elrejti a halál képernyőt
    toggleGameButtons(true); // Megjeleníti a fő játék gombokat
    hideAllCombatButtons(true); // Elrejti a harci gombokat
    updateUI(player, mob); // Frissíti a UI-t a resetelt értékekkel
    appendToLog("Game has been reset. A new adventure awaits!");
}


// STATISZTIKÁK SZÁMÍTÁSA (Universal Equation)
// Ezt használjuk minden HP, XP, Attack, Gold számításhoz
function calculateValue(level, Y, Z_min, Z_max) {
    // Ezt a függvényt kell használni a statisztikák generálására
    // Az 'X' az aktuális szint (player.level vagy mob.level)
    // Az 'Y', 'Z_min', 'Z_max' a gameModifiers-ből jönnek
    const minVal = Math.pow(level, Z_min);
    const maxVal = Math.pow(level, Z_max);
    return Y * ((minVal + maxVal) / 2);
}

// Játékos statisztikák számítása (level up, játék indítása)
export function calculatePlayerStats() {
    player.maxHp = Math.floor(gameModifiers.PLAYER_HP_BASE + calculateValue(player.level, gameModifiers.PLAYER_HP_PER_LEVEL, 1, 1)); // Egyszerűsítve
    player.currentHp = player.maxHp; // Max HP-ra tölt
    player.expToNextLevel = Math.floor(calculateValue(player.level, gameModifiers.PLAYER_LVL_UP_EXP_Y, gameModifiers.PLAYER_LVL_UP_EXP_Z, gameModifiers.PLAYER_LVL_UP_EXP_Z)); // Egyszerűsítve

    // Alap támadás számítása a player.baseAttackMultiplier alapján
    player.baseAttack = Math.floor(calculateValue(player.level, gameModifiers.PLAYER_DAMAGE_Y, gameModifiers.PLAYER_DAMAGE_Z_MIN, gameModifiers.PLAYER_DAMAGE_Z_MAX) * player.baseAttackMultiplier);

    // attackMultiplier a spellek miatt is változhat, de az alap attack a baseAttackMultiplier-től függ
    player.attack = player.baseAttack * player.attackMultiplier;

    updateUI(player, mob); // Frissíti az UI-t
}


// Mob generálás
export function spawnMob(floorLevel) {
    mob.level = floorLevel; // A mob szintje a torony szintjével azonos
    mob.name = "Goblin"; // Egyszerűség kedvéért egyelőre fix név
    // Statisztikák számítása a gameModifiers alapján
    mob.maxHp = Math.floor(calculateValue(mob.level, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MIN, gameModifiers.MOB_HP_Z_MAX));
    mob.currentHp = mob.maxHp;
    mob.baseAttack = Math.floor(calculateValue(mob.level, gameModifiers.MOB_DAMAGE_Y, gameModifiers.MOB_DAMAGE_Z_MIN, gameModifiers.MOB_DAMAGE_Z_MAX));
    mob.xpReward = Math.floor(calculateValue(mob.level, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MIN, gameModifiers.MOB_XP_Z_MAX));
    mob.coinReward = Math.floor(Math.random() * (calculateValue(mob.level, gameModifiers.GOLD_DROP_MAX_Y, gameModifiers.GOLD_DROP_MAX_Z, gameModifiers.GOLD_DROP_MAX_Z) - calculateValue(mob.level, gameModifiers.GOLD_DROP_MIN_Y, gameModifiers.GOLD_DROP_MIN_Z, gameModifiers.GOLD_DROP_MIN_Z)) + calculateValue(mob.level, gameModifiers.GOLD_DROP_MIN_Y, gameModifiers.GOLD_DROP_MIN_Z, gameModifiers.GOLD_DROP_MIN_Z));

    // Mob akció előrejelzés (csak akkor, ha Third Eye aktív)
    if (player.activeSpells.thirdEye) {
        mob.predictedAction = predictMobAction();
    } else {
        mob.predictedAction = '???';
    }

    resetFightDisplay(); // Reseteli a dice display-eket és a predikciót
    updateUI(player, mob);
}

// Kockadobás
export function rollDice() {
    player.lastRollResults = [];
    player.lastRollTotal = 0;
    for (let i = 0; i < player.diceCount; i++) {
        const roll = Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1;
        player.lastRollResults.push(roll);
        player.lastRollTotal += roll;
    }
    displayPlayerDice(player.lastRollResults); // Kijelzi a játékos dobásait
    appendToLog(`You rolled: ${player.lastRollResults.join(', ')} (Total: ${player.lastRollTotal})`);
    updateUI(player, mob);
}

// Mob akció predikció (Third Eye)
function predictMobAction() {
    const actions = ['attack', 'defend', 'heal'];
    const chances = mob.actionChances; // actionChances feltételezve a mob objektumban
    const rand = Math.random() * 100;
    let cumulativeChance = 0;

    for (const action of actions) {
        cumulativeChance += chances[action];
        if (rand < cumulativeChance) {
            return action;
        }
    }
    return 'attack'; // Alapértelmezett, ha valamiért nem talál
}


// Harc logikája
export function attackMob() {
    // Először a mob akciója, ha nem 'Heal' vagy 'Defend'
    const mobAction = mob.predictedAction !== '???' ? mob.predictedAction : chooseMobAction(); // Ha ismert, azt használja, különben véletlenül választ
    mob.currentAction = mobAction; // Mob aktuális akciójának beállítása

    // Mob dobásai
    mob.lastRollResults = [];
    mob.lastRollTotal = 0;
    for (let i = 0; i < mob.diceCount; i++) {
        const roll = Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1;
        mob.lastRollResults.push(roll);
        mob.lastRollTotal += roll;
    }
    displayMobDice(mob.lastRollResults); // Kijelzi a mob dobásait
    appendToLog(`Mob rolled: ${mob.lastRollResults.join(', ')} (Total: ${mob.lastRollTotal})`);


    // Mob támadása (csak akkor, ha nem védekezik vagy gyógyít)
    if (mobAction === 'attack') {
        let mobDamage = mob.baseAttack + mob.lastRollTotal;
        let finalPlayerDamage = Math.max(0, mobDamage - player.armor); // Páncél levonása
        player.currentHp -= finalPlayerDamage;
        showFloatingText(document.getElementById('player-current-hp').parentElement, `-${finalPlayerDamage}`, true);
        appendToLog(`Mob attacked you for ${finalPlayerDamage} damage!`);
    } else if (mobAction === 'defend') {
        appendToLog("Mob prepares to defend!");
    } else if (mobAction === 'heal') {
        const mobHealAmount = Math.floor(mob.maxHp * 0.2); // Mob max HP-jának 20%-a gyógyul
        mob.currentHp = Math.min(mob.maxHp, mob.currentHp + mobHealAmount);
        showFloatingText(document.getElementById('mob-current-hp').parentElement, `+${mobHealAmount}`, false);
        appendToLog(`Mob healed for ${mobHealAmount} HP!`);
    }

    // Játékos támadása
    let playerDamage = player.baseAttack + player.lastRollTotal;
    mob.currentHp -= playerDamage;
    showFloatingText(document.getElementById('mob-current-hp').parentElement, `-${playerDamage}`, true);
    appendToLog(`You attacked ${mob.name} for ${playerDamage} damage!`);

    processCombatTurn(); // Feldolgozza a kör végét (halál, győzelem, spell lejár)
}

export function defendPlayer() {
    // Mob akciója (ha nem 'Heal' vagy 'Defend')
    const mobAction = mob.predictedAction !== '???' ? mob.predictedAction : chooseMobAction();
    mob.currentAction = mobAction;

    // Mob dobásai
    mob.lastRollResults = [];
    mob.lastRollTotal = 0;
    for (let i = 0; i < mob.diceCount; i++) {
        const roll = Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1;
        mob.lastRollResults.push(roll);
        mob.lastRollTotal += roll;
    }
    displayMobDice(mob.lastRollResults);
    appendToLog(`Mob rolled: ${mob.lastRollResults.join(', ')} (Total: ${mob.lastRollTotal})`);

    appendToLog("You prepare to defend!");

    if (mobAction === 'attack') {
        let mobDamage = mob.baseAttack + mob.lastRollTotal;
        let finalPlayerDamage = Math.max(0, mobDamage - player.armor) * gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT; // Védekezés miatti sebzéscsökkentés
        player.currentHp -= finalPlayerDamage;
        showFloatingText(document.getElementById('player-current-hp').parentElement, `-${finalPlayerDamage}`, true);
        appendToLog(`Mob attacked you, but you defended and took ${finalPlayerDamage.toFixed(0)} damage!`);
    } else if (mobAction === 'defend') {
        appendToLog("Mob also defended!");
    } else if (mobAction === 'heal') {
        const mobHealAmount = Math.floor(mob.maxHp * 0.2);
        mob.currentHp = Math.min(mob.maxHp, mob.currentHp + mobHealAmount);
        showFloatingText(document.getElementById('mob-current-hp').parentElement, `+${mobHealAmount}`, false);
        appendToLog(`Mob healed for ${mobHealAmount} HP!`);
    }

    processCombatTurn();
}

export function healPlayer() {
    // Mob akciója
    const mobAction = mob.predictedAction !== '???' ? mob.predictedAction : chooseMobAction();
    mob.currentAction = mobAction;

    // Mob dobásai
    mob.lastRollResults = [];
    mob.lastRollTotal = 0;
    for (let i = 0; i < mob.diceCount; i++) {
        const roll = Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1;
        mob.lastRollResults.push(roll);
        mob.lastRollTotal += roll;
    }
    displayMobDice(mob.lastRollResults);
    appendToLog(`Mob rolled: ${mob.lastRollResults.join(', ')} (Total: ${mob.lastRollTotal})`);

    // Játékos gyógyulása (fix érték, vagy poti szinttől függően)
    const healAmount = Math.floor(player.maxHp * gameModifiers.POTION_HEAL_SCALAR_LV1); // Példa: LV1 poti gyógyítása
    player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
    showFloatingText(document.getElementById('player-current-hp').parentElement, `+${healAmount}`, false);
    appendToLog(`You healed for ${healAmount} HP!`);

    if (mobAction === 'attack') {
        let mobDamage = mob.baseAttack + mob.lastRollTotal;
        let finalPlayerDamage = Math.max(0, mobDamage - player.armor);
        player.currentHp -= finalPlayerDamage;
        showFloatingText(document.getElementById('player-current-hp').parentElement, `-${finalPlayerDamage}`, true);
        appendToLog(`Mob attacked you for ${finalPlayerDamage} damage!`);
    } else if (mobAction === 'defend') {
        appendToLog("Mob defended!");
    } else if (mobAction === 'heal') {
        const mobHealAmount = Math.floor(mob.maxHp * 0.2);
        mob.currentHp = Math.min(mob.maxHp, mob.currentHp + mobHealAmount);
        showFloatingText(document.getElementById('mob-current-hp').parentElement, `+${mobHealAmount}`, false);
        appendToLog(`Mob also healed for ${mobHealAmount} HP!`);
    }

    processCombatTurn();
}


// A harci kör feldolgozása (ellenőrzi a halált/győzelmet, spell lejáratát, gombok láthatóságát)
export function processCombatTurn() {
    // Third Eye és Boost Spell lejárata minden kör végén (ha aktívak)
    // Megjegyzés: Jelenleg a spellek időzítővel járnak le, nem körönként.
    // Ha körönként szeretnéd, akkor itt kellene valamilyen számlálót dekrementálni.
    // Jelenleg az `setTimeout` kezeli a lejárást a `spells.js`-ben.

    updateUI(player, mob); // Frissíti a UI-t minden kör után

    // Ellenőrizzük a játékos halálát
    if (player.currentHp <= 0) {
        player.currentHp = 0; // Biztos, ami biztos
        updateUI(player, mob);
        appendToLog("You have been defeated!");
        showDeathScreen(); // Halál képernyő megjelenítése
        toggleGameButtons(false); // Fő gombok elrejtése
        hideAllCombatButtons(true); // Harci gombok elrejtése
        return; // Kilépünk, a játékos meghalt
    }

    // Ellenőrizzük a mob halálát
    if (mob.currentHp <= 0) {
        mob.currentHp = 0; // Biztos, ami biztos
        updateUI(player, mob);
        appendToLog(`${mob.name} defeated! You gained ${mob.xpReward} XP and ${mob.coinReward} Gold.`);
        player.currentExp += mob.xpReward;
        player.bank += mob.coinReward;

        // Xp ellenőrzés
        if (player.currentExp >= player.expToNextLevel) {
            appendToLog("You have enough XP to level up! Click 'Level Up'.");
            // A szintlépés gombot itt nem kell aktiválni, az event-handlers és a UI-manager kezeli a láthatóságát
        }

        // Vissza a fő játék gombokhoz
        toggleGameButtons(true);
        hideAllCombatButtons(true);
        resetFightDisplay(); // Reseteli a dice display-eket
        return; // Kilépünk, a mob meghalt
    }

    // Ha még tart a harc, visszaállítjuk a Roll gombot
    toggleRollButton(true);
    togglePlayerActionButtons(false);
    toggleHealingUI(false);
    resetFightDisplay(); // Reseteli a dice display-eket és a predikciót

    // Mob akció előrejelzés következő körre (ha Third Eye aktív)
    if (player.activeSpells.thirdEye) {
        mob.predictedAction = predictMobAction();
    } else {
        mob.predictedAction = '???';
    }
    displayMobPredictedAction(mob.predictedAction); // Frissíti a UI-t az új predikcióval

    updateUI(player, mob); // Utolsó UI frissítés
}


// Játékos szintlépés
export function levelUp() {
    if (player.currentExp >= player.expToNextLevel) {
        player.level++;
        player.currentExp -= player.expToNextLevel; // Levonjuk az aktuális XP-ből
        player.diceCount++; // Minden szintlépéskor +1 kocka
        calculatePlayerStats(); // Újraszámolja a statisztikákat (HP, Attack, XP to next level)
        appendToLog(`You leveled up to Level ${player.level}! Your power increased!`);
        updateUI(player, mob);
    } else {
        appendToLog("Not enough XP to level up!");
    }
}

// Mob akciójának kiválasztása (ha nincs Third Eye)
function chooseMobAction() {
    const rand = Math.random() * 100;
    let cumulativeChance = 0;
    const actions = ['attack', 'defend', 'heal']; // Győződjünk meg róla, hogy ezek léteznek a mob.actionChances-ben

    for (const action of actions) {
        cumulativeChance += mob.actionChances[action];
        if (rand < cumulativeChance) {
            return action;
        }
    }
    return 'attack'; // Visszaeső, ha nem találunk semmit
}


// Torony szintek
export function ascendFloor() {
    // Ellenőrizhetjük, hogy van-e még mob, vagy ha harc van, akkor nem léphet szintet
    if (player.currentHp <= 0 || mob.currentHp > 0) { // Ellenőrizzük, hogy meghalt-e a játékos vagy a mob még él-e
        appendToLog("You can't ascend or descend during combat or if you are defeated!");
        return;
    }

    if (player.floorLevel < gameModifiers.MAX_FLOOR) { // MAX_FLOOR definíciója szükséges a gameModifiers-ben
        player.floorLevel++;
        appendToLog(`You ascended to Floor ${player.floorLevel}. New challenges await!`);
        spawnMob(player.floorLevel); // Új mob a magasabb szinten
        updateUI(player, mob);
    } else {
        appendToLog("You are already at the highest floor!");
    }
}

export function descendFloor() {
    if (player.currentHp <= 0 || mob.currentHp > 0) { // Ellenőrizzük, hogy meghalt-e a játékos vagy a mob még él-e
        appendToLog("You can't ascend or descend during combat or if you are defeated!");
        return;
    }

    if (player.floorLevel > 1) {
        player.floorLevel--;
        appendToLog(`You descended to Floor ${player.floorLevel}.`);
        spawnMob(player.floorLevel); // Új mob az alacsonyabb szinten
        updateUI(player, mob);
    } else {
        appendToLog("You are already at the lowest floor!");
    }
}
