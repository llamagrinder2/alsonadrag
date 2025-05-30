// game-logic.js

import { player, mob, gameModifiers, shopItems } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, toggleGameButtons, togglePlayerActionButtons, hideAllCombatButtons, toggleHealingUI, displayMobDice, displayPlayerDice, displayMobPredictedAction, resetFightDisplay, updateShopButtons, renderPotionPrices } from './ui-manager.js'; // renderPotionPrices is hozzáadva
import { calculatePlayerStats, calculateMobStats, calculateExpAndGoldReward, calculatePotionStats } from './game-calculations.js'; // calculatePotionStats hozzáadva

// Játék inicializálása
export function initGame() {
    appendToLog("Game starting...");

    // Játékos statisztikáinak beállítása a játékos szintje alapján
    calculatePlayerStats();
    // Mob generálása az aktuális toronyszinten
    nextMob();
    // Potion árak frissítése
    renderPotionPrices(); // UI frissítése is kell az árakra
    appendToLog("Game ready! Click 'Go Mob' to start a battle!");
    updateUI(); // Kezdő UI frissítés
}

// Mob váltása vagy új mob generálása
export function nextMob() {
    resetFightDisplay(); // Reseteljük a harci kijelzőket
    toggleGameButtons(true); // Engedélyezzük a Go Mob / Level Up/Down gombokat
    togglePlayerActionButtons(false); // Tiltsuk a harci gombokat

    // Mob statisztikák számítása az aktuális torony szint alapján
    calculateMobStats(player.floorLevel);
    // Mob jutalmak (XP, Gold) számítása a frissen generált mob HP-ja alapján
    calculateExpAndGoldReward();

    appendToLog(`A ${mob.name} (LV${mob.level}) jelent meg! HP: ${mob.currentHp}/${mob.maxHp}`);
    updateUI();
}

// Szintet lépés
export function levelUp() {
    player.level++;
    player.currentExp -= player.expToNextLevel; // Levonjuk a szintlépéshez szükséges XP-t
    calculatePlayerStats(); // Frissítjük a játékos statisztikáit az új szint alapján
    player.currentHp = player.maxHp; // Teljes HP-ra gyógyulás
    appendToLog(`Gratulálunk! ${player.level}. szintre léptél!`);
    // Frissítjük a potion árakat is, mivel a játékos szintjéhez kötődnek
    renderPotionPrices();
    updateUI();
}

// XP szerzés
export function gainExp(amount) {
    player.currentExp += amount;
    appendToLog(`Szereztél ${amount} XP-t!`);
    if (player.currentExp >= player.expToNextLevel) {
        levelUp();
    }
    updateUI();
}

// Arany szerzés
export function gainGold(amount) {
    player.bank += amount;
    appendToLog(`Szereztél ${amount} aranyat! Jelenlegi aranyad: ${player.bank}`);
    updateUI();
}

// Kör eleji fázis (Pre-combat)
export function startCombat() {
    appendToLog("Csata kezdődik!");
    toggleGameButtons(false); // Letiltjuk a Go Mob / Level Up/Down gombokat
    togglePlayerActionButtons(true); // Engedélyezzük a harci gombokat
    hideAllCombatButtons(false); // Megmutatjuk a harci gombokat
    toggleHealingUI(true); // Megmutatjuk a gyógyítás UI-t is
    updateUI();
}

// Játékos akciójának feldolgozása
export function handlePlayerAction(actionType) {
    if (player.currentHp <= 0) {
        appendToLog("Halott vagy, nem tudsz akciót végrehajtani!");
        return;
    }

    player.currentAction = actionType;
    processCombatTurn();
}

// A harc egy körének feldolgozása
export function processCombatTurn() {
    // 1. Játékos akció
    let playerDamageDealt = 0;
    let playerHealAmount = 0;
    let playerRoll = 0;

    if (player.currentAction === 'attack') {
        playerRoll = rollDice(1);
        playerDamageDealt = calculateDamage(player.baseAttack, playerRoll, player.attackMultiplier, mob.armor);
        mob.currentHp -= playerDamageDealt;
        appendToLog(`Támadtál! Dobtál: ${playerRoll}. ${mob.name} ${playerDamageDealt} sebzést szenvedett.`);
    } else if (player.currentAction === 'defend') {
        appendToLog(`Védekeztél!`);
    } else if (player.currentAction === 'heal') {
        playerHealAmount = calculateHealingAmount(player.maxHp); // calculateHealingAmount még nincs implementálva healing.js-ben
        player.currentHp = Math.min(player.maxHp, player.currentHp + playerHealAmount);
        appendToLog(`Gyógyítottál! Gyógyultál: ${playerHealAmount} HP-t.`);
    }
    displayPlayerDice(playerRoll); // Kockadobás kijelzése

    // Ellenőrizzük, hogy a mob meghalt-e
    if (mob.currentHp <= 0) {
        appendToLog(`${mob.name} legyőzve!`);
        gainExp(mob.xpReward);
        gainGold(mob.coinReward);
        nextMob();
        return;
    }

    // 2. Mob akció (csak ha a mob még él)
    predictMobAction(); // Mob akciójának predikciója
    setTimeout(() => { // Késleltetés a mob akciójához
        let mobDamageDealt = 0;
        let mobHealAmount = 0;
        let mobRoll = 0;

        const mobAction = chooseMobAction(); // Mob akciójának kiválasztása
        mob.predictedAction = '???'; // Visszaállítjuk a predikciót

        if (mobAction === 'attack') {
            mobRoll = rollDice(mob.diceCount);
            mobDamageDealt = calculateDamage(mob.baseAttack, mobRoll, 1, player.armor); // Mobnak nincs attackMultiplier
            if (player.currentAction === 'defend') {
                mobDamageDealt *= gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT;
                appendToLog(`A ${mob.name} megtámadott, de kivédted! ${Math.ceil(mobDamageDealt)} sebzést szenvedtél.`);
            } else {
                appendToLog(`A ${mob.name} megtámadott! ${Math.ceil(mobDamageDealt)} sebzést szenvedtél.`);
            }
            player.currentHp -= mobDamageDealt;
        } else if (mobAction === 'defend') {
            appendToLog(`A ${mob.name} védekezett!`);
            // Mob armor ideiglenesen növelhető, ha van ilyen mechanika
        } else if (mobAction === 'heal') {
            mobHealAmount = gameModifiers.HEAL_BASE_AMOUNT * mob.level; // Mob gyógyulás szinttől függően
            mob.currentHp = Math.min(mob.maxHp, mob.currentHp + mobHealAmount);
            appendToLog(`A ${mob.name} gyógyította magát! ${mobHealAmount} HP-t gyógyult.`);
        }
        displayMobDice(mobRoll); // Mob kockadobás kijelzése
        updateUI(); // Frissítjük a UI-t a mob akciója után

        // Ellenőrizzük, hogy a játékos meghalt-e
        if (player.currentHp <= 0) {
            appendToLog("Meghaltál! A játék véget ért.");
            // Ide jöhet egy game over logika (pl. újraindítás, menü)
            togglePlayerActionButtons(false);
            toggleHealingUI(false);
            toggleGameButtons(true);
            return;
        }
    }, 1000); // 1 másodperc késleltetés

    updateUI(); // Frissítjük a UI-t
}


// Mob akciójának előrejelzése (Third Eye Spellhez)
function predictMobAction() {
    if (player.activeSpells.thirdEye) {
        mob.predictedAction = chooseMobAction(); // Itt ténylegesen kiválasztjuk a mob akcióját
        appendToLog(`A Harmadik Szem látja: A ${mob.name} valószínűleg ${mob.predictedAction} akciót hajt végre!`);
        displayMobPredictedAction(mob.predictedAction);
    } else {
        mob.predictedAction = '???';
        displayMobPredictedAction(mob.predictedAction);
    }
    updateUI();
}

// Mob akciójának kiválasztása esélyek alapján
function chooseMobAction() {
    const rand = Math.random() * 100;
    let cumulativeChance = 0;

    for (const action in mob.actionChances) {
        cumulativeChance += mob.actionChances[action];
        if (rand < cumulativeChance) {
            return action;
        }
    }
    return 'attack'; // Alapértelmezett, ha valamiért nem esik bele egyikbe sem
}

// Kockadobás
export function rollDice(count) {
    let results = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1;
        results.push(roll);
        total += roll;
    }
    return total;
}

// Sebzés számítás (már létezik)
export function calculateDamage(baseAttack, diceRoll, attackMultiplier, targetArmor) {
    let damage = (baseAttack * attackMultiplier) + diceRoll - targetArmor;
    return Math.max(0, Math.floor(damage)); // Sebzés nem lehet negatív
}

// --- Shop és Tárgyak kezelése ---

export function enterShop() {
    appendToLog("Beléptél a boltba!");
    updateShopButtons(); // Frissíti a shop gombokat
    toggleGameButtons(false); // Letiltja a harci gombokat
    document.getElementById('shop-modal').style.display = 'block';
    updateUI();
}

export function exitShop() {
    appendToLog("Kiléptél a boltból.");
    toggleGameButtons(true); // Visszaengedi a harci gombokat
    document.getElementById('shop-modal').style.display = 'none';
    updateUI();
}

// Item vásárlása (csak a nem potion itemekre)
export function buyItem(itemId) {
    const item = shopItems[itemId];
    if (!item) {
        appendToLog("Ismeretlen tárgy!");
        return;
    }

    if (player.bank >= item.price) {
        player.bank -= item.price;
        if (item.effect.attack) {
            player.baseAttackMultiplier += item.effect.attack;
            player.attackMultiplier = player.baseAttackMultiplier; // Frissítjük az aktuális attackMultiplier-t
        }
        if (item.effect.armor) {
            player.armor += item.effect.armor;
        }
        item.unlocked = true; // Megjelöljük, hogy megvásárolt
        appendToLog(`${item.name} megvásárolva!`);
        updateShopButtons(); // Frissítjük a shop gombokat
        updateUI();
    } else {
        appendToLog("Nincs elegendő aranyad!");
    }
}

// Potion vásárlása
export function buyPotionFromShop(potionLevel) {
    const potionStats = calculatePotionStats(potionLevel); // Dinamikusan számolt ár és gyógyítás
    const price = potionStats.price;

    if (player.bank >= price) {
        player.bank -= price;
        player.potions[potionLevel]++;
        appendToLog(`Level ${potionLevel} poti megvásárolva ${price} aranyért!`);
        updateUI();
    } else {
        appendToLog("Nincs elegendő aranyad a potihoz!");
    }
}

// Potion használata
export function usePotion(potionLevel) {
    if (player.potions[potionLevel] > 0) {
        const potionStats = calculatePotionStats(potionLevel); // Dinamikusan számolt gyógyítás
        const healAmount = potionStats.heal;

        player.potions[potionLevel]--;
        player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
        appendToLog(`Level ${potionLevel} potit használtál, gyógyultál ${healAmount} HP-t.`);
        updateUI();
    } else {
        appendToLog(`Nincs Level ${potionLevel} potid.`);
    }
}

// --- Torony szintjének kezelése ---

export function ascendLevel() {
    if (player.floorLevel < gameModifiers.MAX_LEVEL) { // Feltételezve, hogy a MAX_LEVEL a toronyra is vonatkozik
        player.floorLevel++;
        appendToLog(`Feljutottál a ${player.floorLevel}. toronyszintre!`);
        nextMob(); // Új mob generálása az új szinten
    } else {
        appendToLog("Már a torony legtetején vagy!");
    }
    updateUI();
}

export function descendLevel() {
    if (player.floorLevel > 1) { // Nem lehet az 1. szint alá menni
        player.floorLevel--;
        appendToLog(`Lejutottál a ${player.floorLevel}. toronyszintre!`);
        nextMob(); // Új mob generálása az új szinten
    } else {
        appendToLog("Már a torony alján vagy!");
    }
    updateUI();
}
