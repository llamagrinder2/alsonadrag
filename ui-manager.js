// ui-manager.js

import { player, mob, shopItems, gameModifiers } from './game-state.js';
import { calculatePotionStats } from './game-calculations.js'; // calculatePotionStats importálása

// DOM elemek gyors elérése
const playerHpSpan = document.getElementById('player-hp');
const playerMaxHpSpan = document.getElementById('player-max-hp'); // ÚJ: Max HP span
const playerHpBar = document.querySelector('.player-hp-bar'); // ÚJ: HP sáv
const playerLevelSpan = document.getElementById('player-level');
const playerExpSpan = document.getElementById('player-exp');
const playerExpToNextLevelSpan = document.getElementById('player-exp-to-next-level'); // ÚJ: XP to next level span
const playerExpBar = document.querySelector('.player-xp-bar'); // ÚJ: XP sáv
const playerBankSpan = document.getElementById('player-bank');
const playerAttackSpan = document.getElementById('player-attack');
const playerArmorSpan = document.getElementById('player-armor');
const playerPotion1Span = document.getElementById('player-potion-1-count');
const playerPotion2Span = document.getElementById('player-potion-2-count');
const playerPotion3Span = document.getElementById('player-potion-3-count');
const playerFloorLevelSpan = document.getElementById('player-floor-level');
const playerLog = document.getElementById('player-log');
const playerAvatar = document.getElementById('player-avatar'); // ÚJ: Játékos avatar
const playerFloatingText = document.getElementById('player-floating-text'); // ÚJ: Játékos lebegő szöveg

const mobNameSpan = document.getElementById('mob-name');
const mobHpSpan = document.getElementById('mob-hp');
const mobMaxHpSpan = document.getElementById('mob-max-hp'); // ÚJ: Max HP span
const mobHpBar = document.querySelector('.mob-hp-bar'); // ÚJ: HP sáv
const mobLevelSpan = document.getElementById('mob-level');
const mobPredictedActionSpan = document.getElementById('mob-predicted-action');
const mobAvatar = document.getElementById('mob-avatar'); // ÚJ: Mob avatar
const mobFloatingText = document.getElementById('mob-floating-text'); // ÚJ: Mob lebegő szöveg

const playerActionButtons = document.querySelectorAll('.player-action-btn'); // Attack, Defend, Heal
const combatButtonsContainer = document.getElementById('combat-buttons'); // A konténer, ami ezeket tartalmazza
const healingUIContainer = document.getElementById('healing-ui'); // A konténer, ami a potion gombokat tartalmazza
const gameButtons = document.getElementById('game-buttons'); // Go Mob, Shop, Level Up/Down konténer
const rollDiceButton = document.getElementById('roll-dice-btn'); // Roll Dice gomb

const playerDiceDisplay = document.getElementById('player-dice-display');
const mobDiceDisplay = document.getElementById('mob-dice-display');

const shopPotion1PriceSpan = document.getElementById('potion-1-price');
const shopPotion2PriceSpan = document.getElementById('potion-2-price');
const shopPotion3PriceSpan = document.getElementById('potion-3-price');

const shopModal = document.getElementById('shop-modal'); // Shop modal
const shopExitBtn = document.getElementById('shop-exit-btn'); // Shop bezáró gomb

const deathScreen = document.getElementById('death-screen'); // Halál képernyő
const restartGameBtn = document.getElementById('restart-game-btn'); // Újraindítás gomb

// A lock overlay elemek referenciái
const bronzeSwordLock = document.getElementById('bronze-sword-lock');
const woodenShieldLock = document.getElementById('wooden-shield-lock');
const whetstoneLock = document.getElementById('whetstone-lock');
const leather2Lock = document.getElementById('leather2-lock');


// UI frissítése
export function updateUI(playerState, mobState) { // player és mob állapotot is átvesz
    // Játékos UI frissítése
    playerHpSpan.textContent = Math.ceil(playerState.currentHp);
    playerMaxHpSpan.textContent = playerState.maxHp;
    playerLevelSpan.textContent = playerState.level;
    playerExpSpan.textContent = Math.ceil(playerState.currentExp);
    playerExpToNextLevelSpan.textContent = Math.ceil(playerState.expToNextLevel);
    playerBankSpan.textContent = playerState.bank;
    playerAttackSpan.textContent = Math.ceil(playerState.baseAttack * playerState.baseAttackMultiplier);
    playerArmorSpan.textContent = playerState.armor;
    playerPotion1Span.textContent = playerState.potions[1];
    playerPotion2Span.textContent = playerState.potions[2];
    playerPotion3Span.textContent = playerState.potions[3];
    playerFloorLevelSpan.textContent = playerState.floorLevel;

    // HP sáv frissítése
    let playerHpPercent = (playerState.currentHp / playerState.maxHp) * 100;
    playerHpBar.style.width = `${Math.max(0, playerHpPercent)}%`; // Ne legyen negatív, minimum 0
    playerHpBar.style.backgroundColor = playerHpPercent > 20 ? 'green' : 'red'; // Színek
    
    // XP sáv frissítése
    let playerExpPercent = (playerState.currentExp / playerState.expToNextLevel) * 100;
    playerExpBar.style.width = `${Math.max(0, playerExpPercent)}%`;

    // Mob UI frissítése
    mobNameSpan.textContent = mobState.name;
    mobHpSpan.textContent = Math.ceil(mobState.currentHp);
    mobMaxHpSpan.textContent = mobState.maxHp;
    mobLevelSpan.textContent = mobState.level;
    mobPredictedActionSpan.textContent = mobState.predictedAction;

    // Mob HP sáv frissítése
    let mobHpPercent = (mobState.currentHp / mobState.maxHp) * 100;
    mobHpBar.style.width = `${Math.max(0, mobHpPercent)}%`; // Ne legyen negatív, minimum 0
    mobHpBar.style.backgroundColor = mobHpPercent > 20 ? 'red' : 'darkred'; // Színek

    // Gomb állapotok frissítése a játék logikája alapján
    if (mobState.currentHp <= 0 && playerState.currentHp > 0) { // Mob halott, játékos él
        hideAllCombatButtons(true); // Rejtjük a harci/healing UI-t
        toggleGameButtons(true); // Engedélyezzük a Go Mob és szintlépő gombokat
        toggleRollButton(false); // Letiltjuk a Roll gombot
        resetFightDisplay(); // Biztosítjuk a tiszta harci kijelzőt
    } else if (playerState.currentHp <= 0) { // Játékos halott
        hideAllCombatButtons(true); // Rejtjük a harci/healing UI-t
        toggleGameButtons(false); // Letiltjuk az összes játék gombot
        toggleRollButton(false); // Letiltjuk a Roll gombot is
        // Itt még NEM hívjuk meg a showDeathScreen-t, mert azt a game-logic fogja
    }
}

// Log üzenetek hozzáadása
export function appendToLog(message) {
    const p = document.createElement('p');
    p.textContent = message;
    playerLog.appendChild(p);
    playerLog.scrollTop = playerLog.scrollHeight; // Görgetés le a legújabb üzenetre
}

// Lebegő szöveg megjelenítése (sebzés/gyógyulás)
export function showFloatingText(targetElement, text, isDamage = true) { // isDamage: true = piros, false = zöld
    const floaty = document.createElement('div');
    floaty.textContent = text;
    floaty.classList.add('floating-text');
    
    if (isDamage) {
        floaty.classList.add('damage');
    } else {
        floaty.classList.add('healing');
    }

    // Pozíció a targetElement-hez képest
    const rect = targetElement.getBoundingClientRect();
    floaty.style.left = `${rect.left + rect.width / 2}px`;
    floaty.style.top = `${rect.top - 20}px`; // Fölé ússzon

    // Dinamikusan hozzáadjuk a body-hoz
    document.body.appendChild(floaty);

    // Eltávolítás animáció után
    floaty.addEventListener('animationend', () => {
        floaty.remove();
    });
}


// Játék gombok (Go Mob, Shop, Level Up/Down) állapotának váltása
export function toggleGameButtons(enable) {
    document.getElementById('go-mob-btn').disabled = !enable;
    document.getElementById('shop-btn').disabled = !enable;
    document.getElementById('ascend-level-btn').disabled = !enable;
    document.getElementById('descend-level-btn').disabled = !enable;
}

// Játékos akció gombok (Támadás, Védekezés, Gyógyítás) állapotának váltása
export function togglePlayerActionButtons(enable) {
    playerActionButtons.forEach(button => {
        button.disabled = !enable;
    });
}

// Roll Dice gomb állapotának váltása
export function toggleRollButton(enable) {
    rollDiceButton.disabled = !enable;
}

// Harci gombok (combat-buttons és healing-ui) megjelenítése/elrejtése
export function hideAllCombatButtons(hide) {
    combatButtonsContainer.style.display = hide ? 'none' : 'block';
    healingUIContainer.style.display = hide ? 'none' : 'block';
}

// Gyógyító UI (potik) megjelenítése/elrejtése
export function toggleHealingUI(show) {
    healingUIContainer.style.display = show ? 'block' : 'none';
}

// Shop gombok állapotának frissítése (pl. megvásárolt itemek)
export function updateShopButtons(currentBank, shopItemsState) { // Bank és shopItems állapotot is átvesz
    // Shop itemek gombjainak állapotának frissítése és lock overlay
    const itemsToUpdate = {
        'bronzeSword': { buttonId: 'buy-bronze-sword', lockId: 'bronze-sword-lock' },
        'woodenShield': { buttonId: 'buy-wooden-shield', lockId: 'wooden-shield-lock' },
        'whetstone': { buttonId: 'buy-whetstone', lockId: 'whetstone-lock' },
        'leather2': { buttonId: 'buy-leather2', lockId: 'leather2-lock' }
    };

    for (const itemId in itemsToUpdate) {
        const item = shopItemsState[itemId];
        const button = document.getElementById(itemsToUpdate[itemId].buttonId);
        const lockOverlay = document.getElementById(itemsToUpdate[itemId].lockId);

        if (item) {
            if (item.unlocked) {
                button.disabled = true; // Ha már megvásárolták, letiltjuk
                button.textContent = "Purchased!"; // Megváltoztatjuk a szöveget
                lockOverlay.style.display = 'none'; // Elrejtjük a lakatot
            } else {
                button.disabled = currentBank < item.price; // Letiltjuk, ha nincs elég arany
                button.textContent = `Buy (${item.price} Gold)`; // Visszaállítjuk az árat
                lockOverlay.style.display = 'block'; // Megmutatjuk a lakatot, ha nem megvásárolt
            }
        }
    }

    // Potion gombok frissítése
    renderPotionPrices();
    document.getElementById('buy-potion-1').disabled = currentBank < calculatePotionStats(1).price;
    document.getElementById('buy-potion-2').disabled = currentBank < calculatePotionStats(2).price;
    document.getElementById('buy-potion-3').disabled = currentBank < calculatePotionStats(3).price;
}

// Mob kockadobás kijelzése
export function displayMobDice(rolls) { // Rolls egy tömb, pl. [3, 5]
    mobDiceDisplay.innerHTML = ''; // Töröljük a régi kockákat
    rolls.forEach(roll => {
        const diceDiv = document.createElement('div');
        diceDiv.classList.add('dice-result-single');
        // Unicode kocka karakterek
        diceDiv.textContent = String.fromCodePoint(0x2680 + roll - 1); // 0x2680 az '⚀' (Dice-1)
        mobDiceDisplay.appendChild(diceDiv);
    });
}

// Játékos kockadobás kijelzése
export function displayPlayerDice(rolls) { // Rolls egy tömb, pl. [1, 6]
    playerDiceDisplay.innerHTML = ''; // Töröljük a régi kockákat
    rolls.forEach(roll => {
        const diceDiv = document.createElement('div');
        diceDiv.classList.add('dice-result-single');
        // Unicode kocka karakterek
        diceDiv.textContent = String.fromCodePoint(0x2680 + roll - 1); // 0x2680 az '⚀' (Dice-1)
        playerDiceDisplay.appendChild(diceDiv);
    });
}

// Mob várható akciójának kijelzése
export function displayMobPredictedAction(action) {
    mobPredictedActionSpan.textContent = action; // Csak az akciót jelenítjük meg
}

// Harci kijelzők resetelése (kockadobások, predikció)
export function resetFightDisplay() {
    playerDiceDisplay.innerHTML = ''; // Töröljük a DOM elemeket
    mobDiceDisplay.innerHTML = ''; // Töröljük a DOM elemeket
    mobPredictedActionSpan.textContent = '???';
}

// Potion árak dinamikus renderelése a shopban
export function renderPotionPrices(price1, price2, price3) { // Ár paramétereket vár
    shopPotion1PriceSpan.textContent = `${price1} Gold`;
    shopPotion2PriceSpan.textContent = `${price2} Gold`;
    shopPotion3PriceSpan.textContent = `${price3} Gold`;
}

// ÚJ: Halál képernyő megjelenítése
export function showDeathScreen() {
    deathScreen.style.display = 'flex'; // Flex container megjelenítése
}

// ÚJ: Halál képernyő elrejtése
export function hideDeathScreen() {
    deathScreen.style.display = 'none';
}

// Eseményfigyelők inicializálása (fontos, hogy exportálva legyen, és a main.js hívja meg!)
export function initializeUIEventListeners(gameLogic) { // Átadjuk a gameLogic objektumot
    // Játék gombok
    document.getElementById('go-mob-btn').addEventListener('click', gameLogic.startCombat);
    document.getElementById('ascend-level-btn').addEventListener('click', gameLogic.ascendLevel);
    document.getElementById('descend-level-btn').addEventListener('click', gameLogic.descendLevel);
    document.getElementById('shop-btn').addEventListener('click', gameLogic.enterShop);
    
    // Harci gombok
    rollDiceButton.addEventListener('click', gameLogic.rollForCombat);
    document.getElementById('attack-btn').addEventListener('click', () => gameLogic.handlePlayerAction('attack'));
    document.getElementById('defend-btn').addEventListener('click', () => gameLogic.handlePlayerAction('defend'));
    document.getElementById('heal-btn').addEventListener('click', () => gameLogic.handlePlayerAction('heal'));

    // Potion használat gombok
    document.getElementById('use-potion-1').addEventListener('click', () => gameLogic.usePotion(1));
    document.getElementById('use-potion-2').addEventListener('click', () => gameLogic.usePotion(2));
    document.getElementById('use-potion-3').addEventListener('click', () => gameLogic.usePotion(3));

    // Shop gombok
    shopExitBtn.addEventListener('click', gameLogic.exitShop);
    document.getElementById('buy-bronze-sword').addEventListener('click', () => gameLogic.buyItem('bronzeSword'));
    document.getElementById('buy-wooden-shield').addEventListener('click', () => gameLogic.buyItem('woodenShield'));
    document.getElementById('buy-whetstone').addEventListener('click', () => gameLogic.buyItem('whetstone'));
    document.getElementById('buy-leather2').addEventListener('click', () => gameLogic.buyItem('leather2'));

    document.getElementById('buy-potion-1').addEventListener('click', () => gameLogic.buyPotionFromShop(1));
    document.getElementById('buy-potion-2').addEventListener('click', () => gameLogic.buyPotionFromShop(2));
    document.getElementById('buy-potion-3').addEventListener('click', () => gameLogic.buyPotionFromShop(3));

    // Spell gombok
    document.getElementById('third-eye-btn').addEventListener('click', gameLogic.toggleThirdEye);
    document.getElementById('boost-spell-btn').addEventListener('click', gameLogic.toggleBoostSpell);

    // Death screen gomb
    restartGameBtn.addEventListener('click', gameLogic.handleDeath); // Halál utáni újraindítás
    
    // Shop Reset gomb (extra funkció)
    document.getElementById('shopResetButton').addEventListener('click', () => {
        shopItems.bronzeSword.unlocked = false;
        shopItems.woodenShield.unlocked = false;
        shopItems.whetstone.unlocked = false;
        shopItems.leather2.unlocked = false;
        updateShopButtons(player.bank, shopItems); // Frissítjük a shop gombokat
        appendToLog("A bolt visszaállítva az alap állapotba.");
    });
}
