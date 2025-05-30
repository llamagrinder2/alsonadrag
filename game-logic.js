// game-logic.js

import { player, mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, toggleGameButtons, togglePlayerActionButtons, hideAllCombatButtons, toggleHealingUI, displayMobDice, displayPlayerDice, displayMobPredictedAction, resetFightDisplay } from './ui-manager.js';
import { calculatePlayerStats, calculateExpToNextLevel, calculateUniversalValue } from './game-calculations.js';
import { createHealingButtons, usePotion } from './healing.js'; // healing.js importálása

// Játék inicializálása
export function initGame() {
    calculatePlayerStats();
    calculateExpToNextLevel(); // Kiszámoljuk az első szintlépéshez szükséges XP-t
    player.currentHp = player.maxHp; // Kezdéskor teljes HP

    // Inicializáljuk a játékállapotot
    player.potions = { 1: 1, 2: 1, 3: 1 }; // Kezdő potik

    updateUI(); // Frissítjük a UI-t az inicializált adatokkal
    appendToLog("Game started! Find a mob to fight!");
    nextMob(); // Első mob generálása
    toggleGameButtons(true); // Engedélyezzük a fő játék gombokat
    togglePlayerActionButtons(false); // Elrejtjük az akció gombokat (Roll gomb látszik)
    toggleHealingUI(false); // Alapból rejtjük a gyógyító UI-t
}

// Mob XP és Gold range meghatározása
function setMobRewardRanges() {
    mob.minMobXpCalculated = calculateUniversalValue(
        mob.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.MOB_XP_Y,
        gameModifiers.MOB_XP_Z_MIN
    );
    mob.maxMobXpCalculated = calculateUniversalValue(
        mob.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.MOB_XP_Y,
        gameModifiers.MOB_XP_Z_MAX
    );

    const minGold = calculateUniversalValue(
        mob.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.GOLD_DROP_MIN_Y,
        gameModifiers.GOLD_DROP_MIN_Z
    );
    const maxGold = calculateUniversalValue(
        mob.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.GOLD_DROP_MAX_Y,
        gameModifiers.GOLD_DROP_MAX_Z
    );
    // Kerekítés egész számra, min 1 gold
    mob.coinReward = Math.max(1, Math.round(Math.random() * (maxGold - minGold) + minGold));
}

// Mob generálása
export function nextMob() {
    mob.level = player.level; // Mob szintje megegyezik a játékos szintjével

    // Mob HP számítása
    const minHp = calculateUniversalValue(
        mob.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.MOB_HP_Y,
        gameModifiers.MOB_HP_Z_MIN
    );
    const maxHp = calculateUniversalValue(
        mob.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.MOB_HP_Y,
        gameModifiers.MOB_HP_Z_MAX
    );

    mob.maxHp = Math.round(Math.random() * (maxHp - minHp) + minHp);
    mob.currentHp = mob.maxHp;

    // Mob Attack számítása
    const minAttack = calculateUniversalValue(
        mob.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.MOB_DAMAGE_Y,
        gameModifiers.MOB_DAMAGE_Z_MIN
    );
    const maxAttack = calculateUniversalValue(
        mob.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.MOB_DAMAGE_Y,
        gameModifiers.MOB_DAMAGE_Z_MAX
    );
    mob.baseAttack = Math.round(Math.random() * (maxAttack - minAttack) + minAttack);

    // XP jutalom beállítása (HP alapján interpolálva)
    setMobRewardRanges();
    const xpInterpolationFactor = (mob.maxHp - minHp) / (maxHp - minHp);
    mob.xpReward = Math.round(mob.minMobXpCalculated + (mob.maxMobXpCalculated - mob.minMobXpCalculated) * xpInterpolationFactor);

    // Mob akció esélyek alaphelyzetbe állítása (ha szükséges, bár a mob objektumban definiáltuk)
    mob.actionChances = {
        attack: 60,
        defend: 25,
        heal: 15
    };

    appendToLog(`A new ${mob.name} (LV${mob.level}) appeared!`);
    resetFightDisplay(); // Reseteljük a harci kijelzőket
    hideAllCombatButtons(false); // Megjelenítjük a Roll gombot
    togglePlayerActionButtons(false); // Elrejtjük az akció gombokat
    toggleHealingUI(false); // Elrejtjük a gyógyító UI-t
    updateUI(); // Frissítjük a UI-t az új mob adatokkal
}

// Játékos akció gombjainak kezelése
export function handlePlayerAction(action) {
    player.currentAction = action; // Beállítjuk a játékos választott akcióját
    appendToLog(`Player chooses to ${action}!`);

    hideAllCombatButtons(true); // Elrejtjük az összes gombot, amíg a választás nem történik meg
    if (action === 'heal') {
        toggleHealingUI(true); // Megjelenítjük a gyógyító gombokat és a poti számlálókat
        createHealingButtons(); // Létrehozzuk a poti gombokat
        appendToLog("Choose a potion to use, or click 'Back' to choose another action.");

        // ÚJ: Vissza gomb a Healing UI-hoz
        const healingButtonsContainer = document.getElementById('healingButtonsContainer');
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.id = 'healingBackButton';
        backButton.classList.add('potion-button'); // Ugyanaz a stílus, mint a poti gombok
        backButton.addEventListener('click', () => {
            player.currentAction = null;
            toggleHealingUI(false); // Rejtjük a gyógyító UI-t
            togglePlayerActionButtons(true); // Visszaállítjuk az Attack/Defend/Heal gombokat
            appendToLog("Player returned to action selection.");
            if (backButton.parentNode) {
                backButton.parentNode.removeChild(backButton); // Eltávolítjuk a vissza gombot
            }
        });
        // Csak akkor adjuk hozzá a vissza gombot, ha még nincs a DOM-ban
        if (!document.getElementById('healingBackButton')) {
            if (healingButtonsContainer) {
                healingButtonsContainer.appendChild(backButton);
            }
        }
    } else {
        // Ha nem gyógyítás, akkor azonnal mehet a harci kör
        processCombatTurn();
    }
}

// Kockadobás
export function rollDice(count) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * gameModifiers.DICE_MAX_VALUE) + 1);
    }
    return rolls;
}

// Mob akciójának kiválasztása
function chooseMobAction() {
    const rand = Math.random() * 100; // 0-100 közötti véletlen szám
    let cumulativeChance = 0;

    for (const action in mob.actionChances) {
        cumulativeChance += mob.actionChances[action];
        if (rand < cumulativeChance) {
            mob.predictedAction = action;
            displayMobPredictedAction(action); // Kijelezzük a mob választását
            appendToLog(`Mob will ${action}.`);
            return;
        }
    }
    mob.predictedAction = 'attack'; // Alapértelmezett, ha valami hiba történne
    displayMobPredictedAction('attack');
    appendToLog(`Mob will attack (default).`);
}

// Harci kör feldolgozása
export function processCombatTurn() {
    appendToLog("--- Combat Turn ---");

    // 1. Kockadobások és mob akció kiválasztása
    player.lastRollResults = rollDice(player.diceCount);
    displayPlayerDice(player.lastRollResults);

    chooseMobAction(); // A mob megjósolt akcióját itt választjuk ki
    mob.lastRollResults = rollDice(mob.diceCount);
    displayMobDice(mob.lastRollResults);

    // 2. Sebzés és gyógyítás számítása
    let playerDamage = player.baseAttack * player.attackMultiplier;
    let mobDamage = mob.baseAttack;

    // Kocka eredmények hozzáadása a sebzéshez (összeg, vagy egyedi logika, pl. biggest roll)
    playerDamage += player.lastRollResults.reduce((sum, roll) => sum + roll, 0);
    mobDamage += mob.lastRollResults.reduce((sum, roll) => sum + roll, 0);

    let finalPlayerDamage = playerDamage;
    let finalMobDamage = mobDamage;

    // Defend mechanika
    if (player.currentAction === 'defend') {
        finalMobDamage *= (1 - gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT);
        appendToLog("Player is defending, damage reduced!");
    }
    if (mob.predictedAction === 'defend') {
        finalPlayerDamage *= (1 - gameModifiers.DEFEND_DAMAGE_REDUCTION_PERCENT);
        appendToLog("Mob is defending, player damage reduced!");
    }

    // Gyógyítás mechanika (Heal akció esetén itt történik a "gyógyulás")
    // A healing.js-ben kezeljük a tényleges gyógyítást a potik használatakor,
    // de az alap gyógyítás (ha nincs poti) itt történhet, ha a player akció 'heal'
    if (player.currentAction === 'heal') {
        // Mivel a heal gomb választáskor már a healing.js-be navigálunk,
        // ez az ág akkor futna le, ha lenne "alap" gyógyulás poti nélkül.
        // Jelenleg feltételezzük, hogy a usePotion már lefutott.
        // Ezt a részt itt kihagyjuk, mert a healing.js végzi a gyógyítást és indítja a kör végét.
    } else if (mob.predictedAction === 'heal') {
        const mobHealAmount = gameModifiers.HEAL_BASE_AMOUNT * mob.level; // Mob gyógyulása
        const actualMobHeal = Math.min(mobHealAmount, mob.maxHp - mob.currentHp);
        mob.currentHp += actualMobHeal;
        appendToLog(`Mob healed for ${actualMobHeal} HP!`);
        showFloatingText(document.querySelector('.mob-hp-bar'), `+${actualMobHeal}`, 'lightgreen');
    }

    // 3. Sebzés kalkuláció
    mob.currentHp -= Math.max(0, finalPlayerDamage - mob.armor);
    player.currentHp -= Math.max(0, finalMobDamage - player.armor);

    // Lebegő szöveg kijelzése
    showFloatingText(document.querySelector('.mob-hp-bar'), `-${Math.round(Math.max(0, finalPlayerDamage - mob.armor))}`, 'red');
    showFloatingText(document.querySelector('.player-hp-bar'), `-${Math.round(Math.max(0, finalMobDamage - player.armor))}`, 'red');


    mob.currentHp = Math.max(0, mob.currentHp); // Ne menjen 0 alá
    player.currentHp = Math.max(0, player.currentHp); // Ne menjen 0 alá

    appendToLog(`Player dealt ${Math.round(finalPlayerDamage)} damage.`);
    appendToLog(`Mob dealt ${Math.round(finalMobDamage)} damage.`);

    // 4. Forduló végi ellenőrzés
    if (player.currentHp <= 0) {
        // Játékos meghalt
        appendToLog("You have been defeated!");
        document.getElementById('deathButton').style.display = 'block';
        toggleGameButtons(false); // Letiltjuk a fő játék gombokat
        hideAllCombatButtons(true); // Letiltjuk a harci gombokat
    } else if (mob.currentHp <= 0) {
        // Mob legyőzve
        appendToLog(`You defeated the ${mob.name}!`);
        gainExp(mob.xpReward);
        gainGold(mob.coinReward);
        toggleGameButtons(true); // Engedélyezzük a fő játék gombokat
        hideAllCombatButtons(true); // Elrejtjük az összes harci gombot (roll gombot is)
        displayMobDice([]); // Tisztázzuk a mob kockákat
        displayPlayerDice([]); // Tisztázzuk a játékos kockákat
        displayMobPredictedAction('???'); // Reseteljük a mob akció előrejelzést
    } else {
        // A harc folytatódik
        togglePlayerActionButtons(true); // Megjelenítjük az Attack/Defend/Heal gombokat
        toggleHealingUI(false); // Elrejtjük a gyógyító UI-t, ha már nem gyógyít a játékos
    }
    updateUI(); // Frissítjük a UI-t minden kör után
}

// XP szerzés
function gainExp(amount) {
    player.currentExp += amount;
    appendToLog(`Gained ${amount} XP.`);
    if (player.currentExp >= player.expToNextLevel) {
        levelUp();
    }
}

// Szintlépés
function levelUp() {
    player.level++;
    player.currentExp -= player.expToNextLevel; // Maradék XP
    calculatePlayerStats(); // Új statok kiszámítása
    calculateExpToNextLevel(); // Következő szinthez szükséges XP
    player.currentHp = player.maxHp; // Szintlépéskor teljes HP
    appendToLog(`You leveled up to Level ${player.level}!`);
    updateUI();
}

// Arany szerzés
function gainGold(amount) {
    player.bank += amount;
    appendToLog(`Gained ${amount} Gold.`);
    updateUI();
}

// Ez a függvény a main.js-ből hívódik meg, amikor a Roll gombra kattintanak
export function startCombat() {
    hideAllCombatButtons(true); // Elrejtjük a Roll gombot
    togglePlayerActionButtons(true); // Megjelenítjük az Attack/Defend/Heal gombokat
    toggleHealingUI(false); // Rejtjük a gyógyító UI-t
    appendToLog("Choose your action!");
}

// Shop funkciók (ideiglenesen itt, majd külön fájlba kerülhetnek)
export function enterShop() {
    appendToLog("Entering the shop...");
    document.getElementById('shopModal').style.display = 'block';
    toggleGameButtons(false); // Letiltjuk a fő játék gombokat
    hideAllCombatButtons(true); // Letiltjuk a harci gombokat
}

export function exitShop() {
    appendToLog("Exiting the shop...");
    document.getElementById('shopModal').style.display = 'none';
    toggleGameButtons(true); // Engedélyezzük a fő játék gombokat
    updateUI(); // Frissítjük a UI-t
}

export function buyItem(itemId) {
    // Implementáld az item vásárlási logikát itt
    // pl. shopItems[itemId].price
    appendToLog(`Attempting to buy ${itemId}... (Not fully implemented yet)`);
}

export function buyPotionFromShop(level) {
    const price = gameModifiers[`POTION_LV${level}_PRICE`];
    if (player.bank >= price) {
        player.bank -= price;
        player.potions[level]++;
        appendToLog(`Bought Potion LV${level} for ${price} Gold.`);
    } else {
        appendToLog(`Not enough gold to buy Potion LV${level}. (Needs ${price} Gold)`);
    }
    updateUI();
}
