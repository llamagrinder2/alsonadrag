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
const playerLevelText = document.getElementById('playerLevel'); // Ha van ilyen a UI-ban
const playerExpText = document.getElementById('playerExp'); // Ha van ilyen a UI-ban
const playerNextLevelExpText = document.getElementById('playerNextLevelExp'); // Ha van ilyen a UI-ban
const bankAmountText = document.getElementById('bankAmount');
const potion1CountText = document.getElementById('potion1Count');
const potion2CountText = document.getElementById('potion2Count');
const potion3CountText = document.getElementById('potion3Count');

// Harci gombok (kikapcsolhatóak támadás közben)
const rollButton = document.getElementById('rollButton');
const goMobButton = document.getElementById('goMobButton');
const descendLevelButton = document.getElementById('descendLevelButton');
const ascendLevelButton = document.getElementById('ascendLevelButton');
const thirdEyeButton = document.getElementById('thirdEyeButton');
const boostSpellButton = document.getElementById('boostSpellButton');


// UI frissítése
export function updateUI() {
    // HP sávok és szöveg
    playerHpBar.style.width = `${(player.currentHp / player.maxHp) * 100}%`;
    mobHpBar.style.width = `${(mob.currentHp / mob.maxHp) * 100}%`;

    playerCurrentHpText.textContent = player.currentHp;
    playerMaxHpText.textContent = player.maxHp;
    mobCurrentHpText.textContent = mob.currentHp;
    mobMaxHpText.textContent = mob.maxHp;

    // Szint és XP kijelzés (ha vannak ilyen elemek az index.html-ben)
    if (playerLevelText) playerLevelText.textContent = player.level;
    // XP kijelzés formázottan, pl. (currentExp / expToNextLevel)
    if (playerExpText) playerExpText.textContent = `${player.currentExp}/${player.expToNextLevel}`;
    if (playerNextLevelExpText) playerNextLevelExpText.textContent = player.expToNextLevel; // Vagy csak a következő szinthez szükséges XP

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

    // Pozíció beállítása a cél elemhez képest
    const rect = targetElement.getBoundingClientRect();
    floatingText.style.left = `${rect.left + rect.width / 2}px`;
    floatingText.style.top = `${rect.top + rect.height / 2}px`;

    document.body.appendChild(floatingText);

    // Eltávolítás az animáció után
    floatingText.addEventListener('animationend', () => {
        floatingText.remove();
    });
}

// Harci kijelzők (roll eredmények, sebzések) resetelése
export function resetFightDisplay() {
    document.getElementById('playerRollResult').textContent = '0';
    document.getElementById('mobRollResult').textContent = '0';
    document.getElementById('playerDamageDisplay').textContent = '';
    document.getElementById('mobDamageDisplay').textContent = '';
}

// Gombok engedélyezése/letiltása
export function toggleGameButtons(enable) {
    rollButton.disabled = !enable;
    goMobButton.disabled = !enable;
    descendLevelButton.disabled = !enable;
    ascendLevelButton.disabled = !enable;
    thirdEyeButton.disabled = !enable;
    boostSpellButton.disabled = !enable;
    
    // Potivásárló gombok kezelése (ha a healing.js hozza létre őket, akkor azt is be kell ide importálni)
    // Ideiglenesen kikapcsoljuk, ha aktívak:
    const buyPotionButtons = document.querySelectorAll('.buy-potion-btn');
    buyPotionButtons.forEach(button => {
        button.disabled = !enable;
    });

    // Shop gomb
    document.getElementById('enterShopButton').disabled = !enable;
}
