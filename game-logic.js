// game-logic.js

import { player, mob, gameModifiers, shopItems, resetShopItems } from './game-state.js';
import { 
    updateUI, 
    appendToLog, 
    showFloatingText, 
    toggleGameButtons, 
    togglePlayerActionButtons, 
    hideAllCombatButtons, 
    toggleHealingUI, 
    displayMobDice, 
    displayPlayerDice, 
    displayMobPredictedAction, 
    resetFightDisplay, 
    updateShopButtons, 
    renderPotionPrices, 
    toggleRollButton,
    showDeathScreen,
    hideDeathScreen
} from './ui-manager.js';
import { 
    calculatePlayerStats, 
    calculateMobStats, 
    calculateExpAndGoldRewardForMob, 
    calculatePotionStats,
    calculateDamage // Kiszámított sebzés függvény
} from './game-calculations.js';


// Játék inicializálása
export function initGame() {
    appendToLog("Game starting...");

    // Játékos statisztikáinak beállítása a játékos szintje alapján
    calculatePlayerStats();
    // Mob generálása az aktuális toronyszinten
    nextMob();    
    // Potion árak frissítése
    const potion1Stats = calculatePotionStats(1);
    const potion2Stats = calculatePotionStats(2);
    const potion3Stats = calculatePotionStats(3);
    renderPotionPrices(potion1Stats.price, potion2Stats.price, potion3Stats.price);
    
    // Kezdeti UI állapot beállítása
    toggleRollButton(false);
    togglePlayerActionButtons(false);
    hideAllCombatButtons(true); // Rejtjük az akció gombok konténerét
    toggleHealingUI(false);
    toggleGameButtons(true);
    hideDeathScreen();

    appendToLog("Game ready! Click 'Go Mob' to start a battle!");
    updateUI(player, mob);
}

// Mob váltása vagy új mob generálása
export function nextMob() {
    resetFightDisplay();
    toggleGameButtons(true);
    togglePlayerActionButtons(false);
    hideAllCombatButtons(true); // Rejtjük a harci gombokat (combatButtons és healingUI)
    toggleRollButton(false);

    // Mob statisztikák számítása az aktuális torony szint alapján
    calculateMobStats(player.floorLevel);

    appendToLog(`A ${mob.name} (LV${mob.level}) jelent meg! HP: ${Math.ceil(mob.currentHp)}/${Math.ceil(mob.maxHp)}`);
    updateUI(player, mob);
}

// Szintet lépés
export function levelUp() {
    player.level++;
    player.currentExp -= player.expToNextLevel;
    calculatePlayerStats();
    player.currentHp = player.maxHp;
    appendToLog(`Gratulálunk! ${player.level}. szintre léptél!`);
    
    const potion1Stats = calculatePotionStats(1);
    const potion2Stats = calculatePotionStats(2);
    const potion3Stats = calculatePotionStats(3);
    renderPotionPrices(potion1Stats.price, potion2Stats.price, potion3Stats.price);
    updateUI(player, mob);
}

// XP szerzés
export function gainExp(amount) {
    player.currentExp += amount;
    appendToLog(`Szereztél ${amount} XP-t!`);
    if (player.currentExp >= player.expToNextLevel && player.level < gameModifiers.MAX_LEVEL) {
        levelUp();
    } else if (player.level >= gameModifiers.MAX_LEVEL) {
        player.currentExp = player.expToNextLevel;
        appendToLog("Elérted a maximális szintet!");
    }
    updateUI(player, mob);
}

// Arany szerzés
export function gainGold(amount) {
    player.bank += amount;
    appendToLog(`Szereztél ${amount} aranyat! Jelenlegi aranyad: ${player.bank}`);
    updateUI(player, mob);
}

// Kör eleji fázis (Pre-combat)
export function startCombat() {
    appendToLog("Csata kezdődik!");
    toggleGameButtons(false);
    togglePlayerActionButtons(false);
    hideAllCombatButtons(false); // Megmutatjuk a harci gombok konténerét
    toggleHealingUI(true);
    toggleRollButton(true);
    resetFightDisplay();
    updateUI(player, mob);
}

// Kockadobás fázis
export function rollForCombat() {
    if (player.currentHp <= 0) {
        appendToLog("Halott vagy, nem tudsz dobni!");
        showDeathScreen();
        return;
    }

    toggleRollButton(false);
    togglePlayerActionButtons(true);

    // Játékos kockadobása
    player.lastRollResults = rollDice(player.diceCount);
    player.lastRollTotal = player.lastRollResults.reduce((sum, roll) => sum + roll, 0);
    displayPlayerDice(player.lastRollResults);

    // Mob kockadobása
    mob.lastRollResults = rollDice(mob.diceCount);
    mob.lastRollTotal = mob.lastRollResults.reduce((sum, roll) => sum + roll, 0);
    displayMobDice(mob.lastRollResults);

    // Mob akciójának predikciója (ha van Third Eye)
    predictMobAction();

    appendToLog(`Dobás: Játékos: ${player.lastRollTotal} (${player.lastRollResults.join(', ')}), ${mob.name}: ${mob.lastRollTotal} (${mob.lastRollResults.join(', ')}). Válassz akciót!`);
    updateUI(player, mob);
}

// Játékos akciójának feldolgozása
export function handlePlayerAction(actionType) {
    if (player.currentHp <= 0) {
        appendToLog("Halott vagy, nem tudsz akciót végrehajtani!");
        showDeathScreen();
        return;
    }

    player.currentAction = actionType;
    executeCombatAction();
}

// A harci akciók végrehajtása (a dobások után)
function executeCombatAction() {
    togglePlayerActionButtons(false);
    displayMobPredictedAction('???');

    // 1. Játékos akció
    let playerDamageDealt = 0;
    let playerHealAmount = 0;
    
    if (player.currentAction === 'attack') {
        // LOGOLÁS: Játékos támadás előtt
        console.log("Játékos támadás számítás paraméterei:");
        console.log("  baseAttack:", player.baseAttack);
        console.log("  totalDiceRoll:", player.lastRollTotal);
        console.log("  attackMultiplier (player.baseAttackMultiplier):", player.baseAttackMultiplier);
        console.log("  attackMultiplier (player.attackMultiplier, ha van egyéb):", player.attackMultiplier); // Hozzáadtam, ha van ideiglenes szorzó
        console.log("  player.activeSpells.boostSpell:", player.activeSpells.boostSpell);

        // A calculateDamage függvény már nem várja a targetArmor-t.
        // Itt a player.attackMultiplier-t használjuk az ideiglenes szorzókat is figyelembe véve.
        playerDamageDealt = calculateDamage(player.baseAttack, player.lastRollTotal, player.attackMultiplier);
        mob.currentHp -= playerDamageDealt;
        appendToLog(`Támadtál! ${mob.name} ${Math.ceil(playerDamageDealt)} sebzést szenvedett.`);
        showFloatingText(document.getElementById('mob-avatar'), `${Math.ceil(playerDamageDealt)}`, true);
        // LOGOLÁS: Játékos támadás után
        console.log("Játékos által okozott sebzés:", playerDamageDealt);
    } else if (player.currentAction === 'defend') {
        appendToLog(`Védekeztél!`);
    } else if (player.currentAction === 'heal') {
        playerHealAmount = Math.ceil(player.maxHp * gameModifiers.POTION_HEAL_SCALAR_LV1);
        player.currentHp = Math.min(player.maxHp, player.currentHp + playerHealAmount);
        appendToLog(`Gyógyítottál! Gyógyultál: ${playerHealAmount} HP-t.`);
        showFloatingText(document.getElementById('player-avatar'), `+${playerHealAmount}`, false);
    }

    // Ellenőrizzük, hogy a mob meghalt-e
    if (mob.currentHp <= 0) {
        mob.currentHp = 0;
        appendToLog(`${mob.name} legyőzve!`);
        gainExp(mob.xpReward);
        gainGold(mob.coinReward);
        setTimeout(() => {
            nextMob();
        }, 1500);
        updateUI(player, mob);
        return;
    }

    // 2. Mob akció (csak ha a mob még él)
    setTimeout(() => {
        let mobDamageDealt = 0;
        let mobHealAmount = 0;
        
        const mobAction = chooseMobAction();
        mob.predictedAction = '???';
        displayMobPredictedAction(mob.predictedAction);

        if (mobAction === 'attack') {
            // LOGOLÁS: Mob támadás előtt
            console.log("Mob támadás számítás paraméterei:");
            console.log("  baseAttack:", mob.baseAttack);
            console.log("  totalDiceRoll:", mob.lastRollTotal);
            console.log("  attackMultiplier (mob):", 1); // Mob támadás szorzója fixen 1
            console.log("  player.armor (játékos védekezés előtt):", player.armor);

            // A calculateDamage függvény már nem várja a targetArmor-t.
            // A játékos armorját a mob sebzéséből itt KELL kivonni.
            let rawMobDamage = calculateDamage(mob.baseAttack, mob.lastRollTotal, 1); // Mob attackMultiplier-e 1
            mobDamageDealt = rawMobDamage - player.armor; // KIVONJUK a játékos páncélját
            mobDamageDealt = Math.max(0, mobDamageDealt); // Sebzés nem lehet negatív

            if (player.currentAction === 'defend') {
                mobDamageDealt = Math.ceil(mobDamageDealt * gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT);
                appendToLog(`A ${mob.name} megtámadott, de kivédted! ${Math.ceil(mobDamageDealt)} sebzést szenvedtél.`);
            } else {
                appendToLog(`A ${mob.name} megtámadott! ${Math.ceil(mobDamageDealt)} sebzést szenvedtél.`);
            }
            player.currentHp -= mobDamageDealt;
            showFloatingText(document.getElementById('player-avatar'), `${Math.ceil(mobDamageDealt)}`, true);
            // LOGOLÁS: Mob támadás után
            console.log("Mob által okozott sebzés (játékos armor levonása után):", mobDamageDealt);
        } else if (mobAction === 'defend') {
            appendToLog(`A ${mob.name} védekezett!`);
        } else if (mobAction === 'heal') {
            mobHealAmount = gameModifiers.HEAL_BASE_AMOUNT * mob.level;
            mob.currentHp = Math.min(mob.maxHp, mob.currentHp + mobHealAmount);
            appendToLog(`A ${mob.name} gyógyította magát! ${mobHealAmount} HP-t gyógyult.`);
            showFloatingText(document.getElementById('mob-avatar'), `+${mobHealAmount}`, false);
        }
        updateUI(player, mob);

        // Ellenőrizzük, hogy a játékos meghalt-e
        if (player.currentHp <= 0) {
            player.currentHp = 0;
            appendToLog("Meghaltál! A játék véget ért.");
            togglePlayerActionButtons(false);
            toggleHealingUI(false);
            toggleGameButtons(false);
            toggleRollButton(false);
            showDeathScreen();
            updateUI(player, mob);
            return;
        }

        // Kör vége, engedélyezzük a Roll gombot a következő körhöz
        toggleRollButton(true);
        updateUI(player, mob);
    }, 1000);

    updateUI(player, mob);
}

// Mob akciójának előrejelzése (Third Eye Spellhez)
function predictMobAction() {
    if (player.activeSpells.thirdEye) {
        mob.predictedAction = chooseMobAction();
        appendToLog(`A Harmadik Szem látja: A ${mob.name} valószínűleg ${mob.predictedAction} akciót hajt végre!`);
        displayMobPredictedAction(mob.predictedAction);
    } else {
        mob.predictedAction = '???';
        displayMobPredictedAction(mob.predictedAction);
    }
}

// Mob akciójának kiválasztása esélyek alapján
function chooseMobAction() {
    const rand = Math.random() * 100;
    let cumulativeChance = 0;

    for (const action in mob.actionChances) {
        cumulativeChance += mob.actionChances[action];
        if (rand < cumulativeChance) {
            if (action === 'attack') return 'Támad';
            if (action === 'defend') return 'Véd';
            if (action === 'heal') return 'Gyógyít';
        }
    }
    return 'Támad';
}

// Kockadobás - MOST MÁR VISSZATÉRÍTI AZ EGYES DOBÁSOKAT TÖMBKÉNT!
export function rollDice(count) {
    let results = [];
    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1;
        results.push(roll);
    }
    return results;
}


// --- Shop és Tárgyak kezelése ---

export function enterShop() {
    appendToLog("Beléptél a boltba!");
    updateShopButtons(player.bank, shopItems);
    
    const potion1Stats = calculatePotionStats(1);
    const potion2Stats = calculatePotionStats(2);
    const potion3Stats = calculatePotionStats(3);
    renderPotionPrices(potion1Stats.price, potion2Stats.price, potion3Stats.price);

    toggleGameButtons(false);
    document.getElementById('shop-modal').style.display = 'flex';
    updateUI(player, mob);
}

export function exitShop() {
    appendToLog("Kiléptél a boltból.");
    toggleGameButtons(true);
    document.getElementById('shop-modal').style.display = 'none';
    updateUI(player, mob);
}

// Item vásárlása (csak a nem potion itemekre)
export function buyItem(itemId) {
    const item = shopItems[itemId];
    if (!item) {
        appendToLog("Ismeretlen tárgy!");
        return;
    }

    if (item.unlocked) {
        appendToLog(`${item.name} már megvásároltad!`);
        return;
    }

    if (player.bank >= item.price) {
        player.bank -= item.price;
        if (item.effect.attackMultiplier) {
            player.baseAttackMultiplier += item.effect.attackMultiplier;
        }
        if (item.effect.armor) {
            player.armor += item.effect.armor;
        }
        item.unlocked = true;
        appendToLog(`${item.name} megvásárolva!`);
        updateShopButtons(player.bank, shopItems);
        updateUI(player, mob);
    } else {
        appendToLog("Nincs elegendő aranyad!");
    }
}

// Potion vásárlása
export function buyPotionFromShop(potionLevel) {
    const potionStats = calculatePotionStats(potionLevel);
    const price = potionStats.price;

    if (player.bank >= price) {
        player.bank -= price;
        player.potions[potionLevel]++;
        appendToLog(`Level ${potionLevel} poti megvásárolva ${price} aranyért!`);
        updateShopButtons(player.bank, shopItems);
        updateUI(player, mob);
    } else {
        appendToLog("Nincs elegendő aranyad a potihoz!");
    }
}

// Potion használata
export function usePotion(potionLevel) {
    if (player.potions[potionLevel] > 0) {
        const potionStats = calculatePotionStats(potionLevel);
        const healAmount = potionStats.heal;

        player.potions[potionLevel]--;
        player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
        appendToLog(`Level ${potionLevel} potit használtál, gyógyultál ${healAmount} HP-t.`);
        showFloatingText(document.getElementById('player-avatar'), `+${healAmount}`, false);
        updateUI(player, mob);
    } else {
        appendToLog(`Nincs Level ${potionLevel} potid.`);
    }
}

// --- Spellek kezelése ---
export function toggleThirdEye() {
    if (player.activeSpells.thirdEye) {
        player.activeSpells.thirdEye = false;
        appendToLog("Harmadik Szem kikapcsolva.");
        mob.predictedAction = '???';
        updateUI(player, mob);
        return;
    }

    if (player.bank >= gameModifiers.THIRD_EYE_PRICE) {
        player.bank -= gameModifiers.THIRD_EYE_PRICE;
        player.activeSpells.thirdEye = true;
        appendToLog(`Harmadik Szem aktiválva! Költség: ${gameModifiers.THIRD_EYE_PRICE} arany.`);
        predictMobAction();
        updateUI(player, mob);
    } else {
        appendToLog(`Nincs elegendő arany a Harmadik Szem aktiválásához (${gameModifiers.THIRD_EYE_PRICE} arany szükséges).`);
    }
}

export function toggleBoostSpell() {
    if (player.activeSpells.boostSpell) {
        player.activeSpells.boostSpell = false;
        player.attackMultiplier = player.baseAttackMultiplier;
        appendToLog("Támadás Fókusz varázslat kikapcsolva.");
        updateUI(player, mob);
        return;
    }

    if (player.bank >= gameModifiers.BOOST_SPELL_PRICE) {
        player.bank -= gameModifiers.BOOST_SPELL_PRICE;
        player.activeSpells.boostSpell = true;
        appendToLog(`Támadás Fókusz varázslat aktiválva! Költség: ${gameModifiers.BOOST_SPELL_PRICE} arany.`);
        updateUI(player, mob);
    } else {
        appendToLog(`Nincs elegendő arany a Támadás Fókusz varázslat aktiválásához (${gameModifiers.BOOST_SPELL_PRICE} arany szükséges).`);
    }
}

// --- Torony szintjének kezelése ---

export function ascendLevel() {
    if (player.floorLevel < gameModifiers.MAX_LEVEL) {
        player.floorLevel++;
        appendToLog(`Feljutottál a ${player.floorLevel}. toronyszintre!`);
        nextMob();
    } else {
        appendToLog("Már a torony legtetején vagy!");
    }
    updateUI(player, mob);
}

export function descendLevel() {
    if (player.floorLevel > 1) {
        player.floorLevel--;
        appendToLog(`Lejutottál a ${player.floorLevel}. toronyszintre!`);
        nextMob();
    } else {
        appendToLog("Már a torony alján vagy!");
    }
    updateUI(player, mob);
}

// Halál esetén
export function handleDeath() {
    appendToLog("A halál mély álomba merített. Újrakezdés...");
    // Reseteljük a játék állapotát
    player.level = 1;
    player.currentExp = 0;
    player.currentHp = 0;
    player.bank = 0;
    player.potions = { 1: 1, 2: 0, 3: 0 };
    player.diceCount = 1; // Dice count reset
    player.lastRollResults = [];
    player.lastRollTotal = 0;
    player.currentAction = null;
    player.floorLevel = 1;
    player.baseAttack = 10; // Base attack reset
    player.baseAttackMultiplier = 1; // Attack multiplier reset
    player.attackMultiplier = 1; // Attack multiplier reset
    player.armor = 0; // Armor reset
    player.activeSpells = { thirdEye: false, boostSpell: false };


    resetShopItems();

    hideDeathScreen();
    initGame();
    updateUI(player, mob);
}
