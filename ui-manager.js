// ui-manager.js

import { player, mob, shopItems } from './game-state.js';
import { calculatePotionStats } from './game-calculations.js'; // calculatePotionStats importálása

// DOM elemek gyors elérése
const playerHpSpan = document.getElementById('player-hp');
const playerLevelSpan = document.getElementById('player-level');
const playerExpSpan = document.getElementById('player-exp');
const playerBankSpan = document.getElementById('player-bank');
const playerAttackSpan = document.getElementById('player-attack');
const playerArmorSpan = document.getElementById('player-armor');
const playerPotion1Span = document.getElementById('player-potion-1-count');
const playerPotion2Span = document.getElementById('player-potion-2-count');
const playerPotion3Span = document.getElementById('player-potion-3-count');
const playerFloorLevelSpan = document.getElementById('player-floor-level'); // ÚJ: Torony szint kijelzése
const playerLog = document.getElementById('player-log');

const mobNameSpan = document.getElementById('mob-name');
const mobHpSpan = document.getElementById('mob-hp');
const mobLevelSpan = document.getElementById('mob-level');
const mobPredictedActionSpan = document.getElementById('mob-predicted-action');

const playerActionButtons = document.querySelectorAll('.player-action-btn');
const combatButtons = document.getElementById('combat-buttons');
const healingUI = document.getElementById('healing-ui');
const gameButtons = document.getElementById('game-buttons');

const playerDiceDisplay = document.getElementById('player-dice-display');
const mobDiceDisplay = document.getElementById('mob-dice-display');

const shopPotion1PriceSpan = document.getElementById('potion-1-price'); // ÚJ: Potion ár spanek
const shopPotion2PriceSpan = document.getElementById('potion-2-price');
const shopPotion3PriceSpan = document.getElementById('potion-3-price');

// UI frissítése
export function updateUI() {
    playerHpSpan.textContent = `${Math.ceil(player.currentHp)}/${player.maxHp}`;
    playerLevelSpan.textContent = player.level;
    playerExpSpan.textContent = `${player.currentExp}/${player.expToNextLevel}`;
    playerBankSpan.textContent = player.bank;
    playerAttackSpan.textContent = Math.ceil(player.baseAttack * player.attackMultiplier); // Kerekítve
    playerArmorSpan.textContent = player.armor;
    playerPotion1Span.textContent = player.potions[1];
    playerPotion2Span.textContent = player.potions[2];
    playerPotion3Span.textContent = player.potions[3];
    playerFloorLevelSpan.textContent = player.floorLevel; // ÚJ: Torony szint frissítése

    mobNameSpan.textContent = mob.name;
    mobHpSpan.textContent = `${Math.ceil(mob.currentHp)}/${mob.maxHp}`;
    mobLevelSpan.textContent = mob.level;
    mobPredictedActionSpan.textContent = mob.predictedAction;

    // UI elemek megjelenítése/elrejtése
    if (mob.currentHp <= 0 && player.currentHp > 0) { // Mob halott, játékos él
        hideAllCombatButtons(true);
        toggleHealingUI(false);
        toggleGameButtons(true); // Engedélyezzük a Go Mob és szintlépő gombokat
        resetFightDisplay(); // Biztosítjuk a tiszta harci kijelzőt
    } else if (player.currentHp <= 0) { // Játékos halott
        hideAllCombatButtons(true);
        toggleHealingUI(false);
        toggleGameButtons(false); // Letiltjuk az összes játék gombot
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
export function showFloatingText(targetElement, text, isCritical = false, isHeal = false) {
    const floaty = document.createElement('div');
    floaty.textContent = text;
    floaty.classList.add('floating-text');
    if (isCritical) floaty.classList.add('critical');
    if (isHeal) floaty.classList.add('healing');

    const rect = targetElement.getBoundingClientRect();
    floaty.style.left = `${rect.left + rect.width / 2}px`;
    floaty.style.top = `${rect.top - 20}px`; // Fölé ússzon

    document.body.appendChild(floaty);

    floaty.addEventListener('animationend', () => {
        floaty.remove();
    });
}

// Játék gombok (Go Mob, Shop, Level Up/Down) állapotának váltása
export function toggleGameButtons(enable) {
    document.getElementById('go-mob-btn').disabled = !enable;
    document.getElementById('shop-btn').disabled = !enable;
    document.getElementById('ascend-level-btn').disabled = !enable; // Ezt is kezeli
    document.getElementById('descend-level-btn').disabled = !enable; // Ezt is kezeli
}

// Játékos akció gombok (Támadás, Védekezés, Gyógyítás) állapotának váltása
export function togglePlayerActionButtons(enable) {
    playerActionButtons.forEach(button => {
        button.disabled = !enable;
    });
}

export function toggleRollButton(enable) { // <--- ELLENŐRIZD, HOGY ITT VAN-E AZ 'export'
    rollDiceButton.disabled = !enable;
}

// Harci gombok (combat-buttons container) megjelenítése/elrejtése
export function hideAllCombatButtons(hide) {
    combatButtons.style.display = hide ? 'none' : 'block';
}

// Gyógyító UI (potik) megjelenítése/elrejtése
export function toggleHealingUI(show) {
    healingUI.style.display = show ? 'block' : 'none';
}

// Shop gombok állapotának frissítése (pl. megvásárolt itemek)
export function updateShopButtons() {
    // Standard itemek
    document.getElementById('buy-bronze-sword').disabled = shopItems.bronzeSword.unlocked;
    document.getElementById('buy-wooden-shield').disabled = shopItems.woodenShield.unlocked;

    // Potion gombok frissítése
    renderPotionPrices();
}

// Mob kockadobás kijelzése
export function displayMobDice(roll) {
    mobDiceDisplay.textContent = roll > 0 ? `Mob dobott: ${roll}` : '';
}

// Játékos kockadobás kijelzése
export function displayPlayerDice(roll) {
    playerDiceDisplay.textContent = roll > 0 ? `Játékos dobott: ${roll}` : '';
}

// Mob várható akciójának kijelzése
export function displayMobPredictedAction(action) {
    mobPredictedActionSpan.textContent = `Várható: ${action}`;
}

// Harci kijelzők resetelése (kockadobások, predikció)
export function resetFightDisplay() {
    playerDiceDisplay.textContent = '';
    mobDiceDisplay.textContent = '';
    mobPredictedActionSpan.textContent = '???';
}

// ÚJ: Potion árak dinamikus renderelése a shopban
export function renderPotionPrices() {
    const potion1Stats = calculatePotionStats(1);
    const potion2Stats = calculatePotionStats(2);
    const potion3Stats = calculatePotionStats(3);

    shopPotion1PriceSpan.textContent = `${potion1Stats.price} Gold`;
    shopPotion2PriceSpan.textContent = `${potion2Stats.price} Gold`;
    shopPotion3PriceSpan.textContent = `${potion3Stats.price} Gold`;
}
