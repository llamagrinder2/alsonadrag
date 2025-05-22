// ui-manager.js
import { player, mob, shopItems } from './game-state.js';

// HTML elemek referenciái
const playerHpBar = document.querySelector('.player-hp-bar');
const playerHpText = document.querySelector('.player-hp-text');
const mobHpBar = document.querySelector('.mob-hp-bar');
const mobHpText = document.querySelector('.mob-hp-text');
const playerRollResultSpan = document.getElementById('playerRollResult');
const mobRollResultSpan = document.getElementById('mobRollResult');
const playerDamageDisplay = document.getElementById('playerDamageDisplay');
const mobDamageDisplay = document.getElementById('mobDamageDisplay');
const gameLog = document.getElementById('gameLog');
const rollButton = document.getElementById('rollButton');
const bossCounterText = document.getElementById('bossCounterText');
const bankAmountSpan = document.getElementById('bankAmount');
const potionCounts = {
    '1': document.getElementById('potion1Count'),
    '2': document.getElementById('potion2Count'),
    '3': document.getElementById('potion3Count')
};
const healingButtonsContainer = document.getElementById('healingButtonsContainer');
const deathButton = document.getElementById('deathButton');
const shopModal = document.getElementById('shopModal');


export function updateUI() {
    playerHpBar.style.width = `${(player.currentHp / player.maxHp) * 100}%`;
    playerHpText.textContent = `Player HP: ${Math.max(0, Math.ceil(player.currentHp))}/${player.maxHp}`;
    mobHpBar.style.width = `${(mob.currentHp / mob.maxHp) * 100}%`;
    mobHpText.textContent = `Mob HP: ${Math.max(0, Math.ceil(mob.currentHp))}/${mob.maxHp}`;

    bossCounterText.textContent = `${mob.bossReq - mob.bossCount} mobs left until the Boss.`;
    if (mob.bossFight === 1) {
        bossCounterText.textContent = "BOSS FIGHT!";
    } else if (mob.bossCount >= mob.bossReq) {
        bossCounterText.textContent = "Boss ready!";
    }

    bankAmountSpan.textContent = player.bank;
    potionCounts['1'].textContent = player.potions['1'];
    potionCounts['2'].textContent = player.potions['2'];
    potionCounts['3'].textContent = player.potions['3'];

    if (player.currentHp < 1) {
        deathButton.style.display = 'flex';
        document.querySelectorAll('button:not(#deathButton)').forEach(btn => btn.disabled = true);
    } else {
        deathButton.style.display = 'none';
        document.querySelectorAll('button').forEach(btn => btn.disabled = false);
    }

    const playerRollContainer = playerRollResultSpan.closest('.roll-display');
    const mobRollContainer = mobRollResultSpan.closest('.roll-display');

    if (player.activeSpell === "Third Eye") {
        playerRollContainer.classList.add('third-eye-active');
        mobRollContainer.classList.add('third-eye-active');
    } else {
        playerRollContainer.classList.remove('third-eye-active');
        mobRollContainer.classList.remove('third-eye-active');
    }

    if (playerRollResultSpan.textContent !== '0' || mobRollResultSpan.textContent !== '0') {
         rollButton.style.display = 'none';
    } else {
         rollButton.style.display = 'block';
    }

    // Bolt elemek frissítése (zár ki/be)
    for (const itemKey in shopItems) {
        const item = shopItems[itemKey];
        const lockElement = document.getElementById(item.lockId);
        if (lockElement) {
            lockElement.style.display = item.bought ? 'none' : 'flex';
        }
    }
}

export function appendToLog(message) {
    gameLog.textContent += message + '\n';
    gameLog.scrollTop = gameLog.scrollHeight;
}

export function showFloatingText(element, text, color) {
    const textBox = document.createElement('div');
    textBox.classList.add('display-text-box');
    textBox.textContent = text;
    textBox.style.color = color;
    textBox.style.left = `${element.offsetLeft + element.offsetWidth / 2 - 75}px`;
    textBox.style.top = `${element.offsetTop + element.offsetHeight / 2 - 20}px`;
    textBox.style.zIndex = 10;
    document.querySelector('.game-container').appendChild(textBox);

    textBox.addEventListener('animationend', () => {
        textBox.remove();
    });
}

export function resetFightDisplay() {
    playerDamageDisplay.textContent = '';
    mobDamageDisplay.textContent = '';
    playerRollResultSpan.textContent = '0';
    mobRollResultSpan.textContent = '0';
    rollButton.style.display = 'block';
    healingButtonsContainer.innerHTML = '';

    const existingTextBoxes = document.querySelectorAll('.display-text-box');
    existingTextBoxes.forEach(box => box.remove());
}

export function setModalVisibility(visible) {
    shopModal.style.display = visible ? 'flex' : 'none';
    document.querySelectorAll('.game-container button').forEach(btn => btn.disabled = visible);
    if (visible) {
        shopModal.querySelector('.close-button').disabled = false;
        shopModal.querySelector('#exitShopButton').disabled = false;
        shopModal.querySelector('#shopResetButton').disabled = false;
        document.querySelectorAll('.shop-item button').forEach(btn => btn.disabled = false);
    }
}

export function toggleGameButtons(enable) {
    const buttonsToToggle = [
        document.getElementById('rollButton'),
        document.getElementById('goMobButton'),
        document.getElementById('descendLevelButton'),
        document.getElementById('ascendLevelButton'),
        document.getElementById('thirdEyeButton'),
        document.getElementById('boostSpellButton'),
        document.getElementById('enterShopButton')
    ];
    document.querySelectorAll('.buy-potion-btn').forEach(btn => btn.style.display = enable ? 'block' : 'none');

    buttonsToToggle.forEach(btn => {
        if (btn) btn.style.display = enable ? 'block' : 'none';
    });
    healingButtonsContainer.innerHTML = ''; // Törli a gyógyító gombokat is
}
