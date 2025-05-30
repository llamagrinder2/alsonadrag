// ui-manager.js

import { player, mob, gameModifiers } from './game-state.js';

// UI elemek lekérése
const playerHpBar = document.querySelector('.player-hp-bar');
const playerXpBar = document.querySelector('.player-xp-bar');
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

// Harci gombok és kijelzők
const rollButton = document.getElementById('rollButton');
const mobPredictedActionContainer = document.querySelector('.mob-action-prediction-container');
const mobPredictedActionText = document.getElementById('mobPredictedAction'); 
const playerActionButtonsContainer = document.querySelector('.player-action-buttons');
const attackActionButton = document.getElementById('attackActionButton');
const defendActionButton = document.getElementById('defendActionButton');
const healActionButton = document.getElementById('healActionButton');

const healingButtonsContainer = document.getElementById('healingButtonsContainer'); // Gyógyító gombok konténere
const potionCountsContainer = document.getElementById('potionCountsContainer'); // ÚJ: Potion számlálók konténere

// ÚJ: Potion számláló szöveg elemek
const potion1CountText = document.getElementById('potion1Count');
const potion2CountText = document.getElementById('potion2Count');
const potion3CountText = document.getElementById('potion3Count');

// Dice result display elements
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

// Dobókocka ikonok (csak 1-6)
const diceIcons = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
};

function getDiceIcon(roll) {
    if (roll >= 1 && roll <= 6) {
        return diceIcons[roll];
    }
    return roll; // Fallback, ha valamiért nem 1-6 közötti számot kap (nem szabadna előfordulnia)
}

// Mob akció ikonok
const mobActionIcons = {
    'attack': '⚔',
    'defend': '🛡',
    'heal': '✚'
};

// UI frissítése
export function updateUI() {
    // HP sávok és szöveg
    if (playerHpBar) playerHpBar.style.width = `${(player.currentHp / player.maxHp) * 100}%`;
    if (mobHpBar) mobHpBar.style.width = `${(mob.currentHp / mob.maxHp) * 100}%`;

    if (playerCurrentHpText) playerCurrentHpText.textContent = player.currentHp;
    if (playerMaxHpText) playerMaxHpText.textContent = player.maxHp;
    if (mobCurrentHpText) mobCurrentHpText.textContent = mob.currentHp;
    if (mobMaxHpText) mobMaxHpText.textContent = mob.maxHp;

    // Szint és XP kijelzés
    if (playerLevelText) playerLevelText.textContent = player.level;
    if (playerExpText) playerExpText.textContent = player.currentExp;
    if (playerNextLevelExpText) {
        playerNextLevelExpText.textContent = player.expToNextLevel;
    } else {
        console.warn("UI Warning: playerNextLevelExpText element not found in DOM.");
    }
    
    if (playerXpBar) playerXpBar.style.width = `${(player.currentExp / player.expToNextLevel) * 100}%`; // XP sáv frissítése

    // Bank
    if (bankAmountText) bankAmountText.textContent = player.bank;

    // ÚJ: Potion darabszámok frissítése
    if (potion1CountText) potion1CountText.textContent = player.potions[1];
    if (potion2CountText) potion2CountText.textContent = player.potions[2];
    if (potion3CountText) potion3CountText.textContent = player.potions[3];
}

// Naplóhoz hozzáadás
export function appendToLog(message) {
    if (gameLog) {
        const timestamp = new Date().toLocaleTimeString();
        gameLog.textContent += `[${timestamp}] ${message}\n`;
        gameLog.scrollTop = gameLog.scrollHeight; // Görgetés az aljára
    } else {
        console.warn("UI Warning: gameLog element not found in DOM.");
    }
}

// Lebegő szöveg (sebzés/gyógyítás kijelzésére)
export function showFloatingText(targetElement, text, color) {
    if (!targetElement) {
        console.warn("UI Warning: targetElement for floating text is null.");
        return;
    }
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

// Mob kockadobások kijelzése ICONOKKAL
export function displayMobDice(rolls) {
    mobRollResultElements.forEach((element, index) => {
        if (element) {
            element.textContent = rolls[index] !== undefined ? getDiceIcon(rolls[index]) : '';
        } else {
            console.warn(`UI Warning: mobRollResultElements[${index}] not found in DOM.`);
        }
    });
}

// Játékos kockadobások kijelzése ICONOKKAL
export function displayPlayerDice(rolls) {
    playerRollResultElements.forEach((element, index) => {
        if (element) {
            element.textContent = rolls[index] !== undefined ? getDiceIcon(rolls[index]) : '';
        } else {
            console.warn(`UI Warning: playerRollResultElements[${index}] not found in DOM.`);
        }
    });
}

// Mob akció előrejelzés kijelzése ICONOKKAL ÉS SZÍNBEÁLLÍTÁSSAL
export function displayMobPredictedAction(action) {
    if (mobPredictedActionText) {
        // Eltávolítjuk az összes korábbi színosztályt
        mobPredictedActionText.classList.remove('attack', 'defend', 'heal');

        if (action === '???') {
            mobPredictedActionText.textContent = '???';
            mobPredictedActionText.style.color = 'white'; // Alapértelmezett szín
            mobPredictedActionText.style.borderColor = '#777'; // Alapértelmezett keret
            if (mobPredictedActionContainer) mobPredictedActionContainer.style.display = 'none'; // Rejtett, ha nincs előrejelzés
        } else {
            mobPredictedActionText.textContent = mobActionIcons[action]; // Csak az ikon
            mobPredictedActionText.classList.add(action); // Hozzáadjuk a megfelelő osztályt a színhez
            if (mobPredictedActionContainer) mobPredictedActionContainer.style.display = 'flex'; // Láthatóvá teszi a konténert
        }
    } else {
        console.warn("UI Warning: mobPredictedActionText or mobPredictedActionContainer not found in DOM.");
    }
}

// Harci kijelzők (roll eredmények, sebzések) resetelése
export function resetFightDisplay() {
    displayPlayerDice([]);
    displayMobDice([]);
    displayMobPredictedAction('???');
}

// Fő játék gombok engedélyezése/letiltása (Go Mob, Level, Shop, Spells)
export function toggleGameButtons(enable) {
    if (goMobButton) goMobButton.disabled = !enable;
    if (descendLevelButton) descendLevelButton.disabled = !enable;
    if (ascendLevelButton) ascendLevelButton.disabled = !enable;
    if (enterShopButton) enterShopButton.disabled = !enable;
    if (thirdEyeButton) thirdEyeButton.disabled = !enable;
    if (boostSpellButton) boostSpellButton.disabled = !enable;
}

// Harci akció gombok (Attack, Defend, Heal) engedélyezése/letiltása és láthatósága
export function togglePlayerActionButtons(enable) {
    if (attackActionButton) attackActionButton.disabled = !enable;
    if (defendActionButton) defendActionButton.disabled = !enable;
    if (healActionButton) healActionButton.disabled = !enable;
    if (playerActionButtonsContainer) playerActionButtonsContainer.style.display = enable ? 'flex' : 'none';
    // Fontos: a healingButtonsContainer és potionCountsContainer láthatóságát a toggleHealingUI fogja kezelni!
}

// ÚJ: Gyógyító UI elemek (potik száma és gyógyító gombok) láthatóságának kezelése
export function toggleHealingUI(show) {
    if (healingButtonsContainer) healingButtonsContainer.style.display = show ? 'flex' : 'none';
    if (potionCountsContainer) potionCountsContainer.style.display = show ? 'flex' : 'none';
}

// Összes harci gomb elrejtése/megjelenítése (Roll, Spells, Player Actions)
export function hideAllCombatButtons(hide) {
    if (rollButton) rollButton.disabled = hide;
    togglePlayerActionButtons(!hide); // Az alap harci gombok
    toggleHealingUI(false); // A gyógyító UI mindig rejtett, ha nem a "Heal" akció van kiválasztva
}
