// game-logic.js

import { player, mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, resetFightDisplay, toggleGameButtons, displayMobPredictedAction, displayPlayerDice, displayMobDice, togglePlayerActionButtons, hideAllCombatButtons } from './ui-manager.js';
import { bossCountUpdate, bossButton, bossSummon, handleBossDefeat } from './boss-logic.js';
import { createHealingButtons, usePotion, cancelHealing } from './healing.js';
import { endThirdEye } from './spells.js';

// Univerzális számítási függvény a megadott képlet alapján
// figyelembe véve a Z értékeket (Zmin/Zmax tartomány vagy fix Z)
export function calculateValue(n, Y_value, Z_min_or_fixed, Z_max = null) { // <-- IDE TETTÜK AZ 'export' KULCSSZÓT
    const X = gameModifiers.MAX_LEVEL;
    const denominator = X - Y_value;

    if (denominator === 0) {
        console.error(`Hiba: A képlet nevezője nulla! (n=${n}, Y=${Y_value}) Ellenőrizze az X és Y értékeket.`);
        return Math.max(1, n * (Z_min_or_fixed || 1));
    }

    const baseValue = n + (n * n) / denominator;
    let finalValue;

    if (Z_max !== null) {
        // Ha Zmin és Zmax is meg van adva, akkor tartományból választunk
        const minValue = baseValue * Z_min_or_fixed;
        const maxValue = baseValue * Z_max;
        finalValue = Math.random() * (maxValue - minValue) + minValue;
    } else {
        // Ha csak egy fix Z érték van megadva
        finalValue = baseValue * Z_min_or_fixed;
    }

    return Math.max(1, Math.ceil(finalValue)); // Legalább 1 legyen, felfelé kerekítve
}

// Több kocka dobása
export function rollDice(numberOfDice) {
    const rolls = [];
    for (let i = 0; i < numberOfDice; i++) {
        rolls.push(Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1);
    }
    return rolls;
}

// Dobások összegzése
function calculateTotalRoll(rolls) {
    return rolls.reduce((sum, current) => sum + current, 0);
}

// Mob akciójának véletlenszerű kiválasztása
function chooseMobAction() {
    const rand = Math.random() * 100; // 0-99 közötti szám
    let cumulativeChance = 0;

    for (const action in mob.actionChances) {
        cumulativeChance += mob.actionChances[action];
        if (rand < cumulativeChance) {
            return action;
        }
    }
    return 'attack'; // Alapértelmezett, ha valamiért nem esik bele egyikbe sem
}

// Sebzés számítása
export function calculateDamage(attackerAttack, defenderArmor) {
    const rawDamage = attackerAttack - defenderArmor;
    return Math.max(1, rawDamage); // Minimum 1 sebzés
}

// === ÚJ HARC MENET LOGIKA ===

// A Roll gomb funkciója: dob és előrejelzi a mob akcióját
export function rollDiceAndPredictMobAction() {
    appendToLog("You roll the dice...");
    
    // Dobások végrehajtása
    player.lastRollResults = rollDice(player.diceCount);
    mob.lastRollResults = rollDice(mob.diceCount);

    // Eredmények kijelzése a UI-on
    displayPlayerDice(player.lastRollResults);
    displayMobDice(mob.lastRollResults);

    // Mob akciójának előrejelzése
    mob.predictedAction = chooseMobAction();
    displayMobPredictedAction(mob.predictedAction);
    appendToLog(`The ${mob.name} intends to ${mob.predictedAction.toUpperCase()}!`);

    // Gombok állapotának kezelése
    // Roll gomb letiltása, akció gombok engedélyezése
    document.getElementById('rollButton').disabled = true;
    togglePlayerActionButtons(true);
    hideAllCombatButtons(true); // Elrejti az egyéb gombokat harc közben
}

// Játékos akció választása és a harci kör végrehajtása
export function playerAction(actionType) {
    player.currentAction = actionType; // Tároljuk a játékos választását

    appendToLog(`You chose to ${player.currentAction.toUpperCase()}.`);

    // A tényleges harci logika
    executeCombatRound(player.currentAction, mob.predictedAction);

    // Gombok állapotának visszaállítása a kör után
    document.getElementById('rollButton').disabled = false; // Roll gomb újra engedélyezése
    togglePlayerActionButtons(false); // Játékos akció gombok letiltása
    hideAllCombatButtons(false); // Visszaállítja a combaton kívüli gombokat
}


// A tényleges harci kör logikája
function executeCombatRound(playerAction, mobAction) {
    let playerDamageDealt = 0;
    let mobDamageDealt = 0;
    let playerHealAmount = 0;
    let mobHealAmount = 0;

    // Dobások összegzése
    const playerTotalRoll = calculateTotalRoll(player.lastRollResults);
    const mobTotalRoll = calculateTotalRoll(mob.lastRollResults);

    appendToLog(`Your total roll: ${playerTotalRoll}. ${mob.name}'s total roll: ${mobTotalRoll}.`);

    // --- Akciók feldolgozása ---

    // 1. Játékos akciója
    if (playerAction === 'attack') {
        const basePlayerDamage = player.baseAttack * player.attackMultiplier;
        playerDamageDealt = calculateDamage(basePlayerDamage, mob.armor);
    } else if (playerAction === 'defend') {
        // Védekezés: csökkenti a bejövő sebzést
        appendToLog("You brace for impact, preparing to defend!");
        // A védekezési logika a mob támadásánál érvényesül
    } else if (playerAction === 'heal') {
        // Gyógyítás: játékos gyógyul
        if (player.potions[1] > 0) { // Ellenőrizzük, van-e 1-es poti
            usePotion(1); // Automatikusan 1-es potit használ
        } else {
            // Ha nincs poti, akkor valami alap gyógyulás, vagy nem gyógyul
            playerHealAmount = gameModifiers.HEAL_BASE_AMOUNT;
            player.currentHp += playerHealAmount;
            if (player.currentHp > player.maxHp) player.currentHp = player.maxHp;
            showFloatingText(document.getElementById('playerCurrentHp').parentElement, `+${playerHealAmount}`, 'green');
            appendToLog(`You attempted to heal and recovered ${playerHealAmount} HP.`);
        }
    }

    // 2. Mob akciója
    if (mobAction === 'attack') {
        const baseMobDamage = mob.baseAttack;
        // Ha a játékos védekezett, csökkentjük a bejövő sebzést
        if (playerAction === 'defend') {
            mobDamageDealt = calculateDamage(baseMobDamage * gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT, player.armor);
            appendToLog(`Your defense reduced the ${mob.name}'s attack!`);
        } else {
            mobDamageDealt = calculateDamage(baseMobDamage, player.armor);
        }
    } else if (mobAction === 'defend') {
        // Mob védekezés: játékos sebzése csökken
        appendToLog(`The ${mob.name} takes a defensive stance!`);
        playerDamageDealt *= gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT; // Játékos sebzése csökken
        playerDamageDealt = Math.max(1, Math.ceil(playerDamageDealt)); // Minimum 1 sebzés
    } else if (mobAction === 'heal') {
        // Mob gyógyul
        mobHealAmount = Math.ceil(mob.maxHp * 0.1); // Mob max HP 10%-át gyógyul
        mob.currentHp += mobHealAmount;
        if (mob.currentHp > mob.maxHp) {
            mob.currentHp = mob.maxHp;
        }
        showFloatingText(document.getElementById('mobCurrentHp').parentElement, `+${mobHealAmount}`, 'green');
        appendToLog(`The ${mob.name} healed for ${mobHealAmount} HP.`);
    }

    // --- Sebzés/Gyógyítás alkalmazása a tényleges támadások esetén ---

    // Játékos sebzi a mobot (ha a játékos támadott, ÉS a mob nem védekezett, vagy védekezett de még így is üt)
    if (playerAction === 'attack') {
        mob.currentHp -= playerDamageDealt;
        showFloatingText(document.getElementById('mobCurrentHp').parentElement, `-${playerDamageDealt}`, 'red');
        appendToLog(`You dealt ${playerDamageDealt} damage to the ${mob.name}!`);
    }

    // Mob sebzi a játékost (ha a mob támadott, ÉS a játékos nem védekezett, vagy védekezett de még így is üt)
    if (mobAction === 'attack') {
        player.currentHp -= mobDamageDealt;
        showFloatingText(document.getElementById('playerCurrentHp').parentElement, `-${mobDamageDealt}`, 'red');
        appendToLog(`The ${mob.name} dealt ${mobDamageDealt} damage to you!`);
    }

    updateUI(); // UI frissítése

    // Várakozás, majd állapotellenőrzés
    setTimeout(() => {
        if (mob.currentHp <= 0) {
            mob.currentHp = 0;
            appendToLog(`You defeated the ${mob.name}!`);
            handleMobDefeat();
        } else if (player.currentHp <= 0) {
            player.currentHp = 0;
            appendToLog("You have been defeated!");
            death();
        } else {
            // Harc folytatódik, vissza a Roll gombhoz
        }
        displayMobPredictedAction('???'); // Visszaállítjuk a kérdőjeleket
    }, 1000); // Késleltetés
}


// Mob legyőzésének kezelése (XP és Gold kiosztás)
function handleMobDefeat() {
    const hpRange = mob.maxMobHpCalculated - mob.minMobHpCalculated;
    const xpRange = mob.maxMobXpCalculated - mob.minMobXpCalculated;

    let actualXPReward;
    if (hpRange === 0) {
        actualXPReward = mob.minMobXpCalculated;
    } else {
        const deltaXP = xpRange / hpRange;
        const actualMobHpRelativeToMin = mob.maxHp - mob.minMobHpCalculated;
        actualXPReward = mob.minMobXpCalculated + (actualMobHpRelativeToMin * deltaXP);
    }
    
    player.currentExp += Math.ceil(actualXPReward);

    player.bank += mob.coinReward;

    appendToLog(`You gained ${Math.ceil(actualXPReward)} XP and ${mob.coinReward} Gold.`);
    updateUI();
    checkPlayerLVUp();
    bossCountUpdate();

    endThirdEye();
    cancelHealing(); // Healing gombok elrejtése

    // Visszaállítja a Roll gombot a normál működésre, és engedélyezi a Go Mob gombot
    document.getElementById('rollButton').textContent = "Roll";
    // Módosítjuk az onclick-et, hogy a rollDiceAndPredictMobAction-t hívja
    document.getElementById('rollButton').onclick = rollDiceAndPredictMobAction; 
    document.getElementById('goMobButton').disabled = false; // "Go Mob" újra engedélyezése

    // Ha a mob legyőzése után a boss jön, akkor a boss-logic kezeli a továbbiakat.
    // Ha nem boss jön, akkor a felhasználó a 'Go Mob' gombbal tud új mobot generálni.
}

export function nextMob() {
    mob.level = player.level;

    mob.minMobHpCalculated = calculateValue(
        mob.level, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MIN, null
    );
    mob.maxMobHpCalculated = calculateValue(
        mob.level, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MAX, null
    );
    mob.maxHp = Math.ceil(Math.random() * (mob.maxMobHpCalculated - mob.minMobHpCalculated) + mob.minMobHpCalculated);
    mob.currentHp = mob.maxHp;

    mob.baseAttack = calculateValue(
        mob.level, gameModifiers.MOB_DAMAGE_Y, gameModifiers.MOB_DAMAGE_Z_MIN, gameModifiers.MOB_DAMAGE_Z_MAX
    );
    mob.armor = 0; // Mob armor, ha van

    mob.minMobXpCalculated = calculateValue(
        mob.level, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MIN, null
    );
    mob.maxMobXpCalculated = calculateValue(
        mob.level, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MAX, null
    );
    
    const minGold = calculateValue(mob.level, gameModifiers.GOLD_DROP_MIN_Y, gameModifiers.GOLD_DROP_MIN_Z);
    const maxGold = calculateValue(mob.level, gameModifiers.GOLD_DROP_MAX_Y, gameModifiers.GOLD_DROP_MAX_Z);
    mob.coinReward = Math.ceil(Math.random() * (maxGold - minGold) + minGold);


    appendToLog(`A new ${mob.name} (LV${mob.level}) appeared! HP: ${mob.maxHp}, DMG: ${mob.baseAttack}, XP: ${mob.minMobXpCalculated}-${mob.maxMobXpCalculated}, Gold: ${minGold}-${maxGold}`);
    resetFightDisplay(); // Reseteli a dobás eredményeket
    updateUI();
    displayMobPredictedAction('???'); // Visszaállítjuk a mob akció előrejelzését
}

export function prevMob() {
    if (player.level > 1) {
        player.level--;
        nextMob();
        appendToLog(`You descended to Level ${player.level}. A new ${mob.name} appeared!`);
    } else {
        appendToLog("Cannot descend below Level 1.");
    }
}

export function updatePlayerStats() {
    player.maxHp = gameModifiers.PLAYER_HP_BASE + (player.level - 1) * gameModifiers.PLAYER_HP_PER_LEVEL;
    player.currentHp = Math.min(player.currentHp, player.maxHp);
    if (player.currentHp === 0 || player.currentHp === undefined || isNaN(player.currentHp)) {
        player.currentHp = player.maxHp;
    }

    player.baseAttack = calculateValue(
        player.level, gameModifiers.PLAYER_DAMAGE_Y, gameModifiers.PLAYER_DAMAGE_Z_MIN, gameModifiers.PLAYER_DAMAGE_Z_MAX
    );

    player.expToNextLevel = calculateValue(
        player.level, gameModifiers.PLAYER_LVL_UP_EXP_Y, gameModifiers.PLAYER_LVL_UP_EXP_Z
    );
}

export function checkPlayerLVUp() {
    updatePlayerStats();
    
    if (player.currentExp >= player.expToNextLevel) {
        player.level++;
        player.currentExp -= player.expToNextLevel;

        appendToLog(`Congratulations! You reached Level ${player.level}!`);
        updatePlayerStats();
        checkPlayerLVUp();
    }
}

export function death() {
    appendToLog("Game Over!");
    document.getElementById('deathButton').style.display = 'block';
    // Letiltjuk az összes gombot halál esetén, kivéve a "YOU DIED!" gombot
    toggleGameButtons(false);
    togglePlayerActionButtons(false);
    hideAllCombatButtons(true); // Minden gomb letiltása
}
