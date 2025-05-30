// ui-manager.js

import { player, mob, gameModifiers } from './game-state.js';

// UI elemek lekérése
const playerHpBar = document.querySelector('.player-hp-bar');
const mobHpBar = document.querySelector('.mob-hp-bar');
const playerCurrentHpText = document.getElementById('playerCurrentHp');
const playerMaxHpText = document.getElementById('playerMaxHp');
const mobCurrentHpText = document.getElementById('mobCurrentHp');
const mobMaxHpText = document.getElementById('mobMaxHp');
const gameLog = document.getElementById('gameLog');
const playerLevelText = document.getElementById('playerLevel');
const playerExpText = document.getElementById('playerExp');
const playerNextLevelExpText = document.getElementById('playerNextLevelExp');
const bankAmountText = document.getElementById('bankAmount');
const potion1CountText = document.getElementById('potion1Count');
const potion2CountText = document.getElementById('potion2Count');
const potion3CountText = document.getElementById('potion3Count');

// Harci gombok és kijelzők
const rollButton = document.getElementById('rollButton');
const mobPredictedActionText = document.getElementById('mobPredictedAction'); // Mob akció előrejelzés
const attackActionButton = document.getElementById('attackActionButton');
const defendActionButton = document.getElementById('defendActionButton');
const healActionButton = document.getElementById('healActionButton');

// Dice result display elements (ÚJ)
const mobRollResultElements = [
    document.getElementById('mobRollResult1'),
    document.getElementById('mobRollResult2'),
    document.getElementById('mobRollResult3'),
    document.getElementById('mobRollResult4')
];
const playerRollResultElements = [
    document.getElementById('playerRollResult1'),
    document.getElementById('playerRollResult2')
];

// Fő játék gombok (nem harci)
const goMobButton = document.getElementById('goMobButton');
const descendLevelButton = document.getElementById('descendLevelButton');
const ascendLevelButton = document.getElementById('ascendLevelButton');
const thirdEyeButton = document.getElementById('thirdEyeButton');
const boostSpellButton = document.getElementById('boostSpellButton');
const enterShopButton = document.getElementById('enterShopButton');


// UI frissítése
export function updateUI() {
    // HP sávok és szöveg
    playerHpBar.style.width = `${(player.currentHp / player.maxHp) * 100}%`;
    mobHpBar.style.width = `${(mob.currentHp / mob.maxHp) * 100}%`;

    playerCurrentHpText.textContent = player.currentHp;
    playerMaxHpText.textContent = player.maxHp;
    mobCurrentHpText.textContent = mob.currentHp;
    mobMaxHpText.textContent = mob.maxHp;

    // Szint és XP kijelzés
    if (playerLevelText) playerLevelText.textContent = player.level;
    if (playerExpText) playerExpText.textContent = `${player.currentExp}/${player.expToNextLevel}`;
    if (playerNextLevelExpText) playerNextLevelExpText.textContent = player.expToNextLevel;

    // Bank
    bankAmountText.textContent = player.bank;

    // Potik darabszáma
    potion1CountText.textContent = player.potions[1];
    potion2CountText.textContent = player.potions[2];
    potion3CountText.textContent = player.potions[3];
}

// Naplóhoz hozzáadás
export function appendToLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    gameLog.textContent += `[${timestamp}] ${message}\n`;
    gameLog.scrollTop = gameLog.scrollHeight; // Görgetés az aljára
}

// Lebegő szöveg (sebzés/gyógyítás kijelzésére)
export function showFloatingText(targetElement, text, color) {
    const floatingText = document.createElement('div');
    floatingText.classList.add('floating-text');
    floatingText.textContent = text;
    floatingText.style.color = color;

    const rect = targetElement.getBoundingClientRect();
    floatingText.style.left = `${rect.left + rect.width / 2}px`;
    floatingText.style.top = `${rect.top + rect.height / 2}px`;

    document.body.appendChild(floatingText);

    floatingText.addEventListener('animationend', () => {
        floatingText.remove();
    });
}

// Mob kockadobások kijelzése
export function displayMobDice(rolls) {
    mobRollResultElements.forEach((element, index) => {
        element.textContent = rolls[index] !== undefined ? rolls[index] : '0';
    });
}

// Játékos kockadobások kijelzése
export function displayPlayerDice(rolls) {
    playerRollResultElements.forEach((element, index) => {
        element.textContent = rolls[index] !== undefined ? rolls[index] : '0';
    });
}

// Mob akció előrejelzés kijelzése
export function displayMobPredictedAction(action) {
    mobPredictedActionText.textContent = action.toUpperCase();
}

// Harci kijelzők (roll eredmények, sebzések) resetelése
export function resetFightDisplay() {
    displayPlayerDice([]); // Üres tömbbel reseteli
    displayMobDice([]); // Üres tömbel reseteli
    document.getElementById('playerDamageDisplay').textContent = '';
    document.getElementById('mobDamageDisplay').textContent = '';
    displayMobPredictedAction('???');
}

// Fő játék gombok engedélyezése/letiltása (Go Mob, Level, Shop)
export function toggleGameButtons(enable) {
    goMobButton.disabled = !enable;
    descendLevelButton.disabled = !enable;
    ascendLevelButton.disabled = !enable;
    enterShopButton.disabled = !enable;
}

// Harci akció gombok (Attack, Defend, Heal) engedélyezése/letiltása
export function togglePlayerActionButtons(enable) {
    attackActionButton.disabled = !enable;
    defendActionButton.disabled = !enable;
    healActionButton.disabled = !enable;
}

// Összes harci gomb elrejtése/megjelenítése (Roll, Spells, Player Actions)
// Ez akkor hasznos, ha pl. a Shop nyitva van, vagy a játékos meghalt
export function hideAllCombatButtons(hide) {
    rollButton.disabled = hide;
    thirdEyeButton.disabled = hide;
    boostSpellButton.disabled = hide;
    togglePlayerActionButtons(hide); // Letiltja/Engedélyezi a játékos akció gombokat is

    // A poti vásárló gombok is kapcsolódhatnak ehhez, ha nem a shopban vannak
    const buyPotionButtons = document.querySelectorAll('.buy-potion-btn');
    buyPotionButtons.forEach(button => {
        button.disabled = hide;
    });

    // Ha hidden: true, akkor elrejti a mob akció előrejelzést is
    mobPredictedActionText.style.visibility = hide ? 'hidden' : 'visible';
    document.querySelector('.mob-action-prediction').style.visibility = hide ? 'hidden' : 'visible';
}
