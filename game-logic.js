// game-logic.js

import { player, mob, gameModifiers, shopItems } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, toggleGameButtons, togglePlayerActionButtons, hideAllCombatButtons, toggleHealingUI, displayMobDice, displayPlayerDice, displayMobPredictedAction, resetFightDisplay, updateShopButtons, renderPotionPrices, toggleRollButton } from './ui-manager.js';
import { calculatePlayerStats, calculateMobStats, calculateExpAndGoldReward, calculatePotionStats } from './game-calculations.js';


// A calculateHealingAmount függvénynek még mindig nincs definíciója.
// Ezt be kell tenned a game-calculations.js fájlba.
// Példaként ide írom, de a game-calculations.js-be kellene:
export function calculateHealingAmount(playerMaxHp, potionLevel) {
    // Itt kellene valós számítást végezni a potionLevel alapján
    // Most csak egy placeholder, hogy ne legyen hiba
    let healAmount = 0;
    if (potionLevel === 1) healAmount = Math.ceil(playerMaxHp * gameModifiers.POTION_HEAL_SCALAR_LV1);
    else if (potionLevel === 2) healAmount = Math.ceil(playerMaxHp * gameModifiers.POTION_HEAL_SCALAR_LV2);
    else if (potionLevel === 3) healAmount = Math.ceil(playerMaxHp * gameModifiers.POTION_HEAL_SCALAR_LV3);
    else healAmount = Math.ceil(playerMaxHp * 0.1); // Alap gyógyulás, ha nincs potionLevel
    return healAmount;
}


// Játék inicializálása
export function initGame() {
    appendToLog("Game starting...");

    // Játékos statisztikáinak beállítása a játékos szintje alapján
    calculatePlayerStats();
    // Mob generálása az aktuális toronyszinten
    nextMob();
    // Potion árak frissítése
    renderPotionPrices(); // UI frissítése is kell az árakra

    // Kezdeti UI állapot beállítása a "Roll Dice" mechanikához
    toggleRollButton(true); // Engedélyezzük a Roll gombot
    togglePlayerActionButtons(false); // Letiltjuk az akció gombokat
    hideAllCombatButtons(true); // Elrejtjük az akció gombok konténerét
    toggleHealingUI(false); // Elrejtjük a gyógyítás UI-t

    appendToLog("Game ready! Click 'Go Mob' to start a battle!");
    updateUI(); // Kezdő UI frissítés
}

// Mob váltása vagy új mob generálása
export function nextMob() {
    resetFightDisplay(); // Reseteljük a harci kijelzőket
    toggleGameButtons(true); // Engedélyezzük a Go Mob / Level Up/Down gombokat
    togglePlayerActionButtons(false); // Tiltsuk a harci gombokat
    hideAllCombatButtons(true); // Rejtjük a harci gombokat
    toggleHealingUI(false); // Rejtjük a gyógyítás UI-t
    toggleRollButton(false); // Roll gomb alapból tiltott, amíg nem indítjuk a combatot

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
    togglePlayerActionButtons(false); // Harci gombok alapból tiltva
    hideAllCombatButtons(false); // Megmutatjuk a harci gombokat konténerét
    toggleHealingUI(true); // Megmutatjuk a gyógyítás UI-t is
    toggleRollButton(true); // Engedélyezzük a Roll gombot
    resetFightDisplay(); // Töröljük az előző kör dobásait/predikcióját
    updateUI();
}

// Kockadobás fázis
export function rollForCombat() {
    if (player.currentHp <= 0) {
        appendToLog("Halott vagy, nem tudsz dobni!");
        return;
    }

    toggleRollButton(false); // Letiltjuk a Roll gombot, amíg nem dönt a játékos
    togglePlayerActionButtons(true); // Engedélyezzük a támadás, védekezés, gyógyítás gombokat

    // Játékos kockadobása
    const playerRoll = rollDice(1); // Feltételezzük, hogy a játékos egy kockát dob
    player.lastRollResults = [playerRoll]; // Eltároljuk a dobást
    displayPlayerDice(playerRoll); // Kijelezzük a játékos dobását

    // Mob kockadobása
    const mobRoll = rollDice(mob.diceCount); // A mob dob a saját kockáival
    mob.lastRollResults = [mobRoll]; // Eltároljuk a mob dobását
    displayMobDice(mobRoll); // Kijelezzük a mob dobását

    // Mob akciójának predikciója (ha van Third Eye)
    predictMobAction();

    appendToLog(`Dobás: Játékos: ${playerRoll}, ${mob.name}: ${mobRoll}. Válassz akciót!`);
    updateUI();
}

// Játékos akciójának feldolgozása
export function handlePlayerAction(actionType) {
    if (player.currentHp <= 0) {
        appendToLog("Halott vagy, nem tudsz akciót végrehajtani!");
        return;
    }

    player.currentAction = actionType;
    executeCombatAction(); // Mostantól ez hajtja végre az akciókat
}

// A harci akciók végrehajtása (a dobások után)
function executeCombatAction() {
    togglePlayerActionButtons(false); // Letiltjuk a harci gombokat akció után
    displayMobPredictedAction('???'); // Töröljük a predikciót, amint a mob cselekszik (a UI-managerben nullázzuk)

    // 1. Játékos akció
    let playerDamageDealt = 0;
    let playerHealAmount = 0;
    const playerRoll = player.lastRollResults[0] || 0; // Használjuk az eltárolt dobást

    if (player.currentAction === 'attack') {
        playerDamageDealt = calculateDamage(player.baseAttack, playerRoll, player.attackMultiplier, mob.armor);
        mob.currentHp -= playerDamageDealt;
        appendToLog(`Támadtál! ${mob.name} ${playerDamageDealt} sebzést szenvedett.`);
    } else if (player.currentAction === 'defend') {
        appendToLog(`Védekeztél!`);
    } else if (player.currentAction === 'heal') {
        // Fontos: a calculateHealingAmount függvénynek szüksége van a potionLevel-re is,
        // amit a usePotion függvényből kap meg. Itt nem tudjuk pontosan, melyik potit használták.
        // Ezért feltételezzük, hogy ez a heal a játékos alap "heal" akciója, nem poti használat.
        // Ha a "Heal" gomb a poti használatát jelenti, akkor másképp kellene kezelni.
        // Jelenlegi feltételezés: ez egy alap gyógyító képesség, ami nem függ poti szinttől.
        playerHealAmount = calculateHealingAmount(player.maxHp, 1); // Pl. 1. szintű poti gyógyításának mértékét vesszük alapnak
        player.currentHp = Math.min(player.maxHp, player.currentHp + playerHealAmount);
        appendToLog(`Gyógyítottál! Gyógyultál: ${playerHealAmount} HP-t.`);
    }
    // displayPlayerDice(playerRoll); // Már a rollForCombat hívta meg

    // Ellenőrizzük, hogy a mob meghalt-e
    if (mob.currentHp <= 0) {
        appendToLog(`${mob.name} legyőzve!`);
        gainExp(mob.xpReward);
        gainGold(mob.coinReward);
        nextMob(); // Új mob, új kör, új Roll gomb
        return;
    }

    // 2. Mob akció (csak ha a mob még él)
    setTimeout(() => { // Késleltetés a mob akciójához
        let mobDamageDealt = 0;
        let mobHealAmount = 0;
        const mobRoll = mob.lastRollResults[0] || 0; // Használjuk az eltárolt dobást

        const mobAction = chooseMobAction(); // Mob akciójának kiválasztása
        
        if (mobAction === 'attack') {
            mobDamageDealt = calculateDamage(mob.baseAttack, mobRoll, 1, player.armor);
            if (player.currentAction === 'defend') {
                mobDamageDealt *= gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT;
                appendToLog(`A ${mob.name} megtámadott, de kivédted! ${Math.ceil(mobDamageDealt)} sebzést szenvedtél.`);
            } else {
                appendToLog(`A ${mob.name} megtámadott! ${Math.ceil(mobDamageDealt)} sebzést szenvedtél.`);
            }
            player.currentHp -= mobDamageDealt;
        } else if (mobAction === 'defend') {
            appendToLog(`A ${mob.name} védekezett!`);
        } else if (mobAction === 'heal') {
            mobHealAmount = gameModifiers.HEAL_BASE_AMOUNT * mob.level;
            mob.currentHp = Math.min(mob.maxHp, mob.currentHp + mobHealAmount);
            appendToLog(`A ${mob.name} gyógyította magát! ${mobHealAmount} HP-t gyógyult.`);
        }
        // displayMobDice(mobRoll); // Már a rollForCombat hívta meg
        updateUI();

        // Ellenőrizzük, hogy a játékos meghalt-e
        if (player.currentHp <= 0) {
            appendToLog("Meghaltál! A játék véget ért.");
            togglePlayerActionButtons(false);
            toggleHealingUI(false);
            toggleGameButtons(false); // Letiltjuk az összes játék gombot
            toggleRollButton(false); // Letiltjuk a Roll gombot is
            return;
        }

        // Kör vége, engedélyezzük a Roll gombot a következő körhöz
        toggleRollButton(true);
    }, 1000);

    updateUI();
}

// Mob akciójának előrejelzése (Third Eye Spellhez)
function predictMobAction() {
    if (player.activeSpells.thirdEye) {
        mob.predictedAction = chooseMobAction(); // Itt ténylegesen kiválasztjuk a mob akcióját
        appendToLog(`A Harmadik Szem látja: A ${mob.name} valószínűleg ${mob.predictedAction} akciót hajt végre!`);
        displayMobPredictedAction(mob.predictedAction);
    } else {
        mob.predictedAction = '???';
        displayMobPredictedAction(mob.predictedAction); // Biztosítjuk a "???" megjelenítését
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

// Sebzés számítás
export function calculateDamage(baseAttack, diceRoll, attackMultiplier, targetArmor) {
    let damage = (baseAttack * attackMultiplier) + diceRoll - targetArmor;
    return Math.max(0, Math.floor(damage)); // Sebzés nem lehet negatív
}

// --- Shop és Tárgyak kezelése ---

export function enterShop() {
    appendToLog("Beléptél a boltba!");
    updateShopButtons(); // Frissíti a shop gombokat és árakat
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
    if (player.floorLevel < gameModifiers.MAX_LEVEL) {
        player.floorLevel++;
        appendToLog(`Feljutottál a ${player.floorLevel}. toronyszintre!`);
        nextMob(); // Új mob generálása az új szinten
    } else {
        appendToLog("Már a torony legtetején vagy!");
    }
    updateUI();
}

export function descendLevel() {
    if (player.floorLevel > 1) {
        player.floorLevel--;
        appendToLog(`Lejutottál a ${player.floorLevel}. toronyszintre!`);
        nextMob(); // Új mob generálása az új szinten
    } else {
        appendToLog("Már a torony alján vagy!");
    }
    updateUI();
}
