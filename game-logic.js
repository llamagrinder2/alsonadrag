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
    calculateExpAndGoldRewardForMob, // Megfelelő exportált név
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
    // Fontos: a potion árak függnek a játékos szintjétől,
    // így az initGame és levelUp után újra kell számolni.
    const potion1Stats = calculatePotionStats(1);
    const potion2Stats = calculatePotionStats(2);
    const potion3Stats = calculatePotionStats(3);
    renderPotionPrices(potion1Stats.price, potion2Stats.price, potion3Stats.price);
    
    // Kezdeti UI állapot beállítása
    toggleRollButton(false); // Roll gomb alapból tiltva, amíg nem indítjuk a combatot
    togglePlayerActionButtons(false); // Letiltjuk az akció gombokat
    hideAllCombatButtons(); // Elrejtjük az akció gombok konténerét
    toggleHealingUI(false); // Elrejtjük a gyógyítás UI-t
    toggleGameButtons(true); // Engedélyezzük a Go Mob / Level Up/Down gombokat
    hideDeathScreen(); // Elrejtjük a halál képernyőt

    appendToLog("Game ready! Click 'Go Mob' to start a battle!");
    updateUI(player, mob); // Kezdő UI frissítés
}

// Mob váltása vagy új mob generálása
export function nextMob() {
    resetFightDisplay(); // Reseteljük a harci kijelzőket (kockák, predikció)
    toggleGameButtons(true); // Engedélyezzük a Go Mob / Level Up/Down gombokat
    togglePlayerActionButtons(false); // Tiltsuk a harci gombokat
    hideAllCombatButtons(); // Rejtjük a harci gombokat (combatButtons és healingUI)
    toggleRollButton(false); // Roll gomb alapból tiltott

    // Mob statisztikák számítása az aktuális torony szint alapján
    calculateMobStats(player.floorLevel); // Ez hívja meg a calculateExpAndGoldRewardForMob-ot is

    appendToLog(`A ${mob.name} (LV${mob.level}) jelent meg! HP: ${mob.currentHp}/${mob.maxHp}`);
    updateUI(player, mob);
}

// Szintet lépés
export function levelUp() {
    player.level++;
    player.currentExp -= player.expToNextLevel; // Levonjuk a szintlépéshez szükséges XP-t
    calculatePlayerStats(); // Frissítjük a játékos statisztikáit az új szint alapján (maxHp, baseAttack, expToNextLevel)
    player.currentHp = player.maxHp; // Teljes HP-ra gyógyulás szintlépéskor
    appendToLog(`Gratulálunk! ${player.level}. szintre léptél!`);
    // Frissítjük a potion árakat is, mivel a játékos szintjéhez kötődnek
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
    if (player.currentExp >= player.expToNextLevel && player.level < gameModifiers.MAX_LEVEL) { // Max szint ellenőrzés
        levelUp();
    } else if (player.level >= gameModifiers.MAX_LEVEL) {
        player.currentExp = player.expToNextLevel; // XP marad a max szinten
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
    toggleGameButtons(false); // Letiltjuk a Go Mob / Level Up/Down gombokat
    togglePlayerActionButtons(false); // Harci gombok alapból tiltva
    hideAllCombatButtons(false); // Megmutatjuk a harci gombok konténerét
    toggleHealingUI(true); // Megmutatjuk a gyógyítás UI-t is
    toggleRollButton(true); // Engedélyezzük a Roll gombot
    resetFightDisplay(); // Töröljük az előző kör dobásait/predikcióját
    updateUI(player, mob);
}

// Kockadobás fázis
export function rollForCombat() {
    if (player.currentHp <= 0) {
        appendToLog("Halott vagy, nem tudsz dobni!");
        showDeathScreen(); // Megmutatjuk a halál képernyőt
        return;
    }

    toggleRollButton(false); // Letiltjuk a Roll gombot, amíg nem dönt a játékos
    togglePlayerActionButtons(true); // Engedélyezzük a támadás, védekezés, gyógyítás gombokat

    // Játékos kockadobása
    player.lastRollResults = rollDice(player.diceCount); // Visszakapjuk a dobott értékek tömbjét
    player.lastRollTotal = player.lastRollResults.reduce((sum, roll) => sum + roll, 0); // Kiszámoljuk az összeget
    displayPlayerDice(player.lastRollResults); // Kijelezzük a játékos dobásait (egyesével)

    // Mob kockadobása
    mob.lastRollResults = rollDice(mob.diceCount); // Visszakapjuk a dobott értékek tömbjét
    mob.lastRollTotal = mob.lastRollResults.reduce((sum, roll) => sum + roll, 0); // Kiszámoljuk az összeget
    displayMobDice(mob.lastRollResults); // Kijelezzük a mob dobásait (egyesével)

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
    executeCombatAction(); // Mostantól ez hajtja végre az akciókat
}

// A harci akciók végrehajtása (a dobások után)
function executeCombatAction() {
    togglePlayerActionButtons(false); // Letiltjuk a harci gombokat akció után
    displayMobPredictedAction('???'); // Töröljük a predikciót, amint a mob cselekszik (a UI-managerben nullázzuk)

    // 1. Játékos akció
    let playerDamageDealt = 0;
    let playerHealAmount = 0;
    
    // A calculateDamage függvény már a game-calculations.js-ből jön.
    if (player.currentAction === 'attack') {
        playerDamageDealt = calculateDamage(player.baseAttack, player.lastRollTotal, player.attackMultiplier, mob.armor);
        mob.currentHp -= playerDamageDealt;
        appendToLog(`Támadtál! ${mob.name} ${playerDamageDealt} sebzést szenvedett.`);
        showFloatingText(document.getElementById('mob-avatar'), `${playerDamageDealt}`, true);
    } else if (player.currentAction === 'defend') {
        appendToLog(`Védekeztél!`);
    } else if (player.currentAction === 'heal') {
        // Ez az alap gyógyító képesség, nem poti használat!
        playerHealAmount = Math.ceil(player.maxHp * gameModifiers.POTION_HEAL_SCALAR_LV1); // Példa: 1. szintű poti gyógyításának mértékét vesszük alapnak
        player.currentHp = Math.min(player.maxHp, player.currentHp + playerHealAmount);
        appendToLog(`Gyógyítottál! Gyógyultál: ${playerHealAmount} HP-t.`);
        showFloatingText(document.getElementById('player-avatar'), `+${playerHealAmount}`, false);
    }

    // Ellenőrizzük, hogy a mob meghalt-e
    if (mob.currentHp <= 0) {
        mob.currentHp = 0; // Biztosítjuk, hogy ne legyen negatív
        appendToLog(`${mob.name} legyőzve!`);
        gainExp(mob.xpReward);
        gainGold(mob.coinReward);
        setTimeout(() => { // Késleltetés, hogy a floating text látszódjon
            nextMob(); // Új mob, új kör, új Roll gomb
        }, 1500); // Várjunk egy kicsit a következő mobra
        updateUI(player, mob);
        return;
    }

    // 2. Mob akció (csak ha a mob még él)
    setTimeout(() => { // Késleltetés a mob akciójához
        let mobDamageDealt = 0;
        let mobHealAmount = 0;
        
        const mobAction = chooseMobAction(); // Mob akciójának kiválasztása
        mob.predictedAction = '???'; // Akció megtörtént, visszaállítjuk
        displayMobPredictedAction(mob.predictedAction); // Frissítjük a UI-t

        if (mobAction === 'attack') {
            mobDamageDealt = calculateDamage(mob.baseAttack, mob.lastRollTotal, 1, player.armor); // Mob attackMultiplier-e 1
            if (player.currentAction === 'defend') {
                mobDamageDealt = Math.ceil(mobDamageDealt * gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT);
                appendToLog(`A ${mob.name} megtámadott, de kivédted! ${mobDamageDealt} sebzést szenvedtél.`);
            } else {
                appendToLog(`A ${mob.name} megtámadott! ${mobDamageDealt} sebzést szenvedtél.`);
            }
            player.currentHp -= mobDamageDealt;
            showFloatingText(document.getElementById('player-avatar'), `${mobDamageDealt}`, true);
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
            player.currentHp = 0; // Biztosítjuk, hogy ne legyen negatív
            appendToLog("Meghaltál! A játék véget ért.");
            togglePlayerActionButtons(false);
            toggleHealingUI(false);
            toggleGameButtons(false); // Letiltjuk az összes játék gombot
            toggleRollButton(false); // Letiltjuk a Roll gombot is
            showDeathScreen(); // Megmutatjuk a halál képernyőt
            updateUI(player, mob);
            return;
        }

        // Kör vége, engedélyezzük a Roll gombot a következő körhöz
        toggleRollButton(true);
        updateUI(player, mob);
    }, 1000); // 1 másodperc késleltetés a mob akció előtt

    updateUI(player, mob);
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
}

// Mob akciójának kiválasztása esélyek alapján
function chooseMobAction() {
    const rand = Math.random() * 100;
    let cumulativeChance = 0;

    for (const action in mob.actionChances) {
        cumulativeChance += mob.actionChances[action];
        if (rand < cumulativeChance) {
            // A "Támad", "Véd", "Gyógyít" stringek visszatérítése a UI-hoz
            if (action === 'attack') return 'Támad';
            if (action === 'defend') return 'Véd';
            if (action === 'heal') return 'Gyógyít';
        }
    }
    return 'Támad'; // Alapértelmezett
}

// Kockadobás - MOST MÁR VISSZATÉRÍTI AZ EGYES DOBÁSOKAT TÖMBKÉNT!
export function rollDice(count) {
    let results = [];
    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1;
        results.push(roll);
    }
    return results; // Visszatérítjük a dobott értékek tömbjét
}


// --- Shop és Tárgyak kezelése ---

export function enterShop() {
    appendToLog("Beléptél a boltba!");
    updateShopButtons(player.bank, shopItems); // Frissíti a shop gombokat és árakat
    // Potion árakat is frissítjük
    const potion1Stats = calculatePotionStats(1);
    const potion2Stats = calculatePotionStats(2);
    const potion3Stats = calculatePotionStats(3);
    renderPotionPrices(potion1Stats.price, potion2Stats.price, potion3Stats.price);

    toggleGameButtons(false); // Letiltja a játék gombokat
    document.getElementById('shop-modal').style.display = 'flex'; // Modal megjelenítése
    updateUI(player, mob);
}

export function exitShop() {
    appendToLog("Kiléptél a boltból.");
    toggleGameButtons(true); // Visszaengedi a játék gombokat
    document.getElementById('shop-modal').style.display = 'none'; // Modal elrejtése
    updateUI(player, mob);
}

// Item vásárlása (csak a nem potion itemekre)
export function buyItem(itemId) {
    const item = shopItems[itemId];
    if (!item) {
        appendToLog("Ismeretlen tárgy!");
        return;
    }

    if (item.unlocked) { // Ha már megvásárolta
        appendToLog(`${item.name} már megvásároltad!`);
        return;
    }

    if (player.bank >= item.price) {
        player.bank -= item.price;
        if (item.effect.attackMultiplier) { // A bronzeSword pl. attackMultiplier-t ad
            player.baseAttackMultiplier += item.effect.attackMultiplier;
        }
        if (item.effect.armor) {
            player.armor += item.effect.armor;
        }
        // Itt lehetne más effekt is, pl. maxHp növelés
        item.unlocked = true; // Megjelöljük, hogy megvásárolt
        appendToLog(`${item.name} megvásárolva!`);
        updateShopButtons(player.bank, shopItems); // Frissítjük a shop gombokat és árakat
        updateUI(player, mob);
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
        updateShopButtons(player.bank, shopItems); // Frissítjük a shop gombokat
        updateUI(player, mob);
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
        showFloatingText(document.getElementById('player-avatar'), `+${healAmount}`, false);
        updateUI(player, mob);
    } else {
        appendToLog(`Nincs Level ${potionLevel} potid.`);
    }
}

// --- Spellek kezelése ---
export function toggleThirdEye() {
    // Ha már aktív, kikapcsoljuk
    if (player.activeSpells.thirdEye) {
        player.activeSpells.thirdEye = false;
        appendToLog("Harmadik Szem kikapcsolva.");
        mob.predictedAction = '???'; // Elrejtjük a predikciót
        updateUI(player, mob);
        return;
    }

    // Költség ellenőrzés és aktiválás
    if (player.bank >= gameModifiers.THIRD_EYE_PRICE) {
        player.bank -= gameModifiers.THIRD_EYE_PRICE;
        player.activeSpells.thirdEye = true;
        appendToLog(`Harmadik Szem aktiválva! Költség: ${gameModifiers.THIRD_EYE_PRICE} arany.`);
        predictMobAction(); // Azonnal megmutatja a mob akcióját
        updateUI(player, mob);
    } else {
        appendToLog(`Nincs elegendő arany a Harmadik Szem aktiválásához (${gameModifiers.THIRD_EYE_PRICE} arany szükséges).`);
    }
}

export function toggleBoostSpell() {
    // Ha már aktív, kikapcsoljuk
    if (player.activeSpells.boostSpell) {
        player.activeSpells.boostSpell = false;
        player.attackMultiplier = player.baseAttackMultiplier; // Visszaállítjuk az alap szorzót
        appendToLog("Támadás Fókusz varázslat kikapcsolva.");
        updateUI(player, mob);
        return;
    }

    // Költség ellenőrzés és aktiválás
    if (player.bank >= gameModifiers.BOOST_SPELL_PRICE) {
        player.bank -= gameModifiers.BOOST_SPELL_PRICE;
        player.activeSpells.boostSpell = true;
        appendToLog(`Támadás Fókusz varázslat aktiválva! Költség: ${gameModifiers.BOOST_SPELL_PRICE} arany.`);
        // A sebzés számításnál már bele van építve a multiplier
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
        nextMob(); // Új mob generálása az új szinten
    } else {
        appendToLog("Már a torony legtetején vagy!");
    }
    updateUI(player, mob);
}

export function descendLevel() {
    if (player.floorLevel > 1) {
        player.floorLevel--;
        appendToLog(`Lejutottál a ${player.floorLevel}. toronyszintre!`);
        nextMob(); // Új mob generálása az új szinten
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
    player.currentHp = 0; // Hogy az initGame beállítsa max HP-ra
    player.bank = 0;
    player.potions = { 1: 1, 2: 0, 3: 0 };
    player.floorLevel = 1;
    player.activeSpells = { thirdEye: false, boostSpell: false };
    player.baseAttackMultiplier = 1;
    player.attackMultiplier = 1;
    player.armor = 0;

    resetShopItems(); // Shop elemek visszaállítása unlocked: false-ra

    hideDeathScreen(); // Elrejtjük a halál képernyőt
    initGame(); // Újraindítjuk a játékot
    updateUI(player, mob);
}
