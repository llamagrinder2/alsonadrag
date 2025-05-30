// ui-manager.js

import { player, mob, shopItems, gameModifiers } from './game-state.js';
import { calculatePlayerStats } from './game-logic.js'; // player statok újraszámolásához

// UI elemek beszerzése
const playerLevelElement = document.getElementById('player-level');
const playerCurrentHpElement = document.getElementById('player-current-hp');
const playerMaxHpElement = document.getElementById('player-max-hp');
const playerCurrentExpElement = document.getElementById('player-current-exp');
const playerExpToNextLevelElement = document.getElementById('player-exp-to-next-level');
const playerBankElement = document.getElementById('player-bank');
const playerBaseAttackElement = document.getElementById('player-base-attack');
const playerArmorElement = document.getElementById('player-armor');
const playerFloorLevelElement = document.getElementById('player-floor-level');
const potion1CountElement = document.getElementById('potion-1-count');
const potion2CountElement = document.getElementById('potion-2-count');
const potion3CountElement = document.getElementById('potion-3-count');

const mobNameElement = document.getElementById('mob-name');
const mobLevelElement = document.getElementById('mob-level');
const mobCurrentHpElement = document.getElementById('mob-current-hp');
const mobMaxHpElement = document.getElementById('mob-max-hp');
const mobBaseAttackElement = document.getElementById('mob-base-attack');
const mobPredictedActionElement = document.getElementById('mob-predicted-action');
const mobXpRewardElement = document.getElementById('mob-xp-reward');
const mobCoinRewardElement = document.getElementById('mob-coin-reward');

const logOutputElement = document.getElementById('log-output');

const playerDiceResultsElement = document.getElementById('player-dice-results');
const mobDiceResultsElement = document.getElementById('mob-dice-results');

const gameButtonsContainer = document.getElementById('game-buttons-container');
const combatButtonsContainer = document.getElementById('combat-buttons-container');
const rollButtonContainer = document.getElementById('roll-button-container');
const playerActionButtonsContainer = document.getElementById('player-action-buttons-container');
const healingUIContainer = document.getElementById('healing-ui-container');

const shopModal = document.getElementById('shop-modal');
const shopItemsContainer = document.getElementById('shop-items-container');
const deathScreen = document.getElementById('death-screen');

const shopPotion1PriceElement = document.getElementById('shop-potion-1-price');
const shopPotion2PriceElement = document.getElementById('shop-potion-2-price');
const shopPotion3PriceElement = document.getElementById('shop-potion-3-price');

const thirdEyeCostElement = document.getElementById('third-eye-cost');
const boostSpellCostElement = document.getElementById('boost-spell-cost');

// Fő UI frissítő függvény
export function updateUI() {
    // Játékos statok
    playerLevelElement.textContent = player.level;
    playerCurrentHpElement.textContent = player.currentHp;
    playerMaxHpElement.textContent = player.maxHp;
    playerCurrentExpElement.textContent = player.currentExp;
    playerExpToNextLevelElement.textContent = player.expToNextLevel;
    playerBankElement.textContent = player.bank;

    // A calculatePlayerStats() hívása után a player.baseAttack és player.attack már friss.
    // playerBaseAttackElement.textContent = player.baseAttack; // EZ NEM KELL, MERT AZ ATTACK FOG MONDANI A SPELL MIATT
    playerBaseAttackElement.textContent = Math.floor(player.baseAttack * player.attackMultiplier); // Mutassuk a tényleges támadást, ami a spell-lel módosul

    playerArmorElement.textContent = player.armor;
    playerFloorLevelElement.textContent = player.floorLevel;

    // Potik darabszáma
    potion1CountElement.textContent = player.potions[1];
    potion2CountElement.textContent = player.potions[2];
    potion3CountElement.textContent = player.potions[3];

    // HP és XP sávok
    updateHpBars();
    updateExpBar();

    // Mob statok (csak ha van aktív mob)
    if (mob.currentHp > 0) { // Csak akkor frissíti, ha a mob él
        mobNameElement.textContent = mob.name;
        mobLevelElement.textContent = mob.level;
        mobCurrentHpElement.textContent = mob.currentHp;
        mobMaxHpElement.textContent = mob.maxHp;
        mobBaseAttackElement.textContent = mob.baseAttack;
        mobXpRewardElement.textContent = mob.xpReward;
        mobCoinRewardElement.textContent = mob.coinReward;
        displayMobPredictedAction(mob.predictedAction); // Frissíti a mob predikciót
    } else {
        // Ha a mob meghalt, elrejtjük vagy töröljük az adatait
        mobNameElement.textContent = '---';
        mobLevelElement.textContent = '---';
        mobCurrentHpElement.textContent = '---';
        mobMaxHpElement.textContent = '---';
        mobBaseAttackElement.textContent = '---';
        mobPredictedActionElement.textContent = '---';
        mobXpRewardElement.textContent = '---';
        mobCoinRewardElement.textContent = '---';
        displayMobPredictedAction('???'); // Alapértelmezett visszaállítás
    }

    // Gombok állapotának frissítése
    updateButtonStates();
    updateShopButtons(); // Frissíti a shop gombokat és a lockokat
    updateSpellCosts(); // Frissíti a spell költségeket

    // Játékos avatar frissítése (ha szükséges, pl. szintlépéskor)
    // Ha van logikád az avatar cseréjére, az itt történhet
}

// HP sávok frissítése
function updateHpBars() {
    const playerHpBar = document.getElementById('player-hp-bar');
    const mobHpBar = document.getElementById('mob-hp-bar');

    const playerHpPercent = (player.currentHp / player.maxHp) * 100;
    playerHpBar.style.width = `${playerHpPercent}%`;

    const mobHpPercent = (mob.currentHp / mob.maxHp) * 100;
    mobHpBar.style.width = `${mobHpPercent}%`;
}

// XP sáv frissítése
function updateExpBar() {
    const playerXpBar = document.getElementById('player-xp-bar');
    const playerExpPercent = (player.currentExp / player.expToNextLevel) * 100;
    playerXpBar.style.width = `${playerExpPercent}%`;
}

// Eseménynapló frissítése
export function appendToLog(message) {
    const p = document.createElement('p');
    p.textContent = `> ${message}`;
    logOutputElement.appendChild(p);
    logOutputElement.scrollTop = logOutputElement.scrollHeight; // Görget az aljára
}

// Lebegő szöveg megjelenítése (sebzés/gyógyítás)
export function showFloatingText(targetElement, text, isDamage) {
    const floatingText = document.createElement('div');
    floatingText.textContent = text;
    floatingText.classList.add('floating-text');
    if (isDamage) {
        floatingText.style.color = '#dc3545'; // Piros sebzéshez
    } else {
        floatingText.style.color = '#28a745'; // Zöld gyógyításhoz
    }

    const targetRect = targetElement.getBoundingClientRect();
    const gameContainerRect = document.querySelector('.game-container').getBoundingClientRect();

    // Pozicionálás a targetElement felett, de a game-containerhez viszonyítva
    floatingText.style.left = `${targetRect.left - gameContainerRect.left + targetRect.width / 2}px`;
    floatingText.style.top = `${targetRect.top - gameContainerRect.top - targetRect.height / 2}px`;
    floatingText.style.transform = `translateX(-50%)`; // Középre igazítás

    document.querySelector('.game-container').appendChild(floatingText);

    floatingText.addEventListener('animationend', () => {
        floatingText.remove();
    });
}


// Halál képernyő megjelenítése/elrejtése
export function showDeathScreen() {
    deathScreen.style.display = 'flex';
}

export function hideDeathScreen() {
    deathScreen.style.display = 'none';
}

// Gombok láthatóságának kezelése
export function toggleGameButtons(show) {
    gameButtonsContainer.style.display = show ? 'flex' : 'none';
}

export function hideAllCombatButtons(hide) { // EZ A FÜGGVÉNY REJTI EL AZ EGÉSZ HARCI GOMB KONTÉNERT
    combatButtonsContainer.style.display = hide ? 'none' : 'flex'; // Itt flex, hogy a belső elemeket kezelni lehessen
}

export function toggleRollButton(show) {
    rollButtonContainer.style.display = show ? 'block' : 'none';
}

export function togglePlayerActionButtons(show) {
    playerActionButtonsContainer.style.display = show ? 'flex' : 'none';
}

export function toggleHealingUI(show) {
    healingUIContainer.style.display = show ? 'flex' : 'none';
}

// Mob akció előrejelzésének kijelzése
export function displayMobPredictedAction(action) {
    if (mobPredictedActionElement) {
        mobPredictedActionElement.textContent = action.toUpperCase(); // Nagybetűs kijelzés

        // Stílus hozzáadása az akció típusától függően
        mobPredictedActionElement.classList.remove('attack', 'defend', 'heal'); // Régi classok eltávolítása
        if (action !== '???') {
            mobPredictedActionElement.classList.add(action);
        }
    }
}


// Shop modal láthatóságának kezelése
export function setModalVisibility(visible) {
    if (visible) {
        shopModal.style.display = 'flex';
    } else {
        shopModal.style.display = 'none';
    }
}

// Gombok (shop és spellek) állapotának frissítése (disabled, textContent)
function updateButtonStates() {
    const levelUpButton = document.getElementById('level-up-button');
    const ascendButton = document.getElementById('ascend-button');
    const descendButton = document.getElementById('descend-button');
    const goMobButton = document.getElementById('go-mob-button');
    const shopButton = document.getElementById('shop-button');
    const attackButton = document.getElementById('attack-button');
    const defendButton = document.getElementById('defend-button');
    const healButton = document.getElementById('heal-button');

    // Szintlépés gomb
    if (levelUpButton) {
        levelUpButton.disabled = player.currentExp < player.expToNextLevel;
    }

    // Ascend/Descend gombok
    if (ascendButton) {
        ascendButton.disabled = player.floorLevel >= gameModifiers.MAX_FLOOR || mob.currentHp > 0;
    }
    if (descendButton) {
        descendButton.disabled = player.floorLevel <= 1 || mob.currentHp > 0;
    }
    // "Go Mob" gomb (ha él a mob, disabled)
    if (goMobButton) {
        goMobButton.disabled = mob.currentHp > 0;
    }

    // Harci akció gombok (alapértelmezetten disabled, csak a roll után engedélyezzük)
    // Ezeket a togglePlayerActionButtons() és toggleRollButton() kezeli, nem itt kell.

    // Poti vásárlás gombok a shopban
    const buyPotion1Button = document.getElementById('buy-potion-1-button');
    const buyPotion2Button = document.getElementById('buy-potion-2-button');
    const buyPotion3Button = document.getElementById('buy-potion-3-button');

    if (buyPotion1Button) {
        buyPotion1Button.disabled = player.bank < gameModifiers.POTION_LV1_PRICE;
    }
    if (buyPotion2Button) {
        buyPotion2Button.disabled = player.bank < gameModifiers.POTION_LV2_PRICE;
    }
    if (buyPotion3Button) {
        buyPotion3Button.disabled = player.bank < gameModifiers.POTION_LV3_PRICE;
    }

    // Poti használat gombok harc közben (az healing.js createHealingButtons() függvénye hozza létre)
    // Itt csak a darabszámot frissíthetjük, ha vannak fix gombok:
    const usePotion1Button = document.getElementById('use-potion-1-button');
    const usePotion2Button = document.getElementById('use-potion-2-button');
    const usePotion3Button = document.getElementById('use-potion-3-button');

    if (usePotion1Button) usePotion1Button.disabled = player.potions[1] <= 0;
    if (usePotion2Button) usePotion2Button.disabled = player.potions[2] <= 0;
    if (usePotion3Button) usePotion3Button.disabled = player.potions[3] <= 0;

    // Third Eye és Boost Spell gombok
    const thirdEyeButton = document.getElementById('third-eye-button');
    const boostSpellButton = document.getElementById('boost-spell-button');

    if (thirdEyeButton) {
        thirdEyeButton.disabled = player.bank < gameModifiers.THIRD_EYE_PRICE || player.activeSpells.thirdEye;
    }
    if (boostSpellButton) {
        boostSpellButton.disabled = player.bank < gameModifiers.BOOST_SPELL_PRICE || player.activeSpells.boostSpell;
    }
}

// Shop gombok frissítése (lock, vásárolt állapot)
export function updateShopButtons() {
    shopItemsContainer.innerHTML = ''; // Törli a meglévő itemeket

    for (const itemId in shopItems) {
        const item = shopItems[itemId];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('shop-item');
        itemDiv.innerHTML = `
            <span>${item.name} (${item.price}G)</span>
            <button id="buy-${item.id}" ${item.unlocked ? 'disabled' : ''}>Buy</button>
        `;

        const buyButton = itemDiv.querySelector(`#buy-${item.id}`);
        if (buyButton) {
            buyButton.disabled = item.unlocked || player.bank < item.price;
        }

        // Lock overlay hozzáadása, ha az item le van zárva
        if (item.unlocked) {
            // Már megvásárolt, nem kell overlay
        } else if (player.bank < item.price) {
            const lockOverlay = document.createElement('div');
            lockOverlay.classList.add('lock-overlay');
            lockOverlay.innerHTML = '<img src="images/lock.png" alt="Locked">'; // Feltételezve, hogy van egy lock.png kép
            itemDiv.appendChild(lockOverlay);
        }

        shopItemsContainer.appendChild(itemDiv);
    }

    // Update potion prices in shop modal
    if (shopPotion1PriceElement) shopPotion1PriceElement.textContent = gameModifiers.POTION_LV1_PRICE;
    if (shopPotion2PriceElement) shopPotion2PriceElement.textContent = gameModifiers.POTION_LV2_PRICE;
    if (shopPotion3PriceElement) shopPotion3PriceElement.textContent = gameModifiers.POTION_LV3_PRICE;

    // Update potion prices in combat UI
    const potion1PriceElement = document.getElementById('potion-1-price');
    const potion2PriceElement = document.getElementById('potion-2-price');
    const potion3PriceElement = document.getElementById('potion-3-price');

    if (potion1PriceElement) potion1PriceElement.textContent = gameModifiers.POTION_LV1_PRICE;
    if (potion2PriceElement) potion2PriceElement.textContent = gameModifiers.POTION_LV2_PRICE;
    if (potion3PriceElement) potion3PriceElement.textContent = gameModifiers.POTION_LV3_PRICE;
}

// Spellek költségeinek frissítése
function updateSpellCosts() {
    if (thirdEyeCostElement) thirdEyeCostElement.textContent = gameModifiers.THIRD_EYE_PRICE;
    if (boostSpellCostElement) boostSpellCostElement.textContent = gameModifiers.BOOST_SPELL_PRICE;
}


// Kockadobások kijelzése
export function displayPlayerDice(results) {
    playerDiceResultsElement.innerHTML = ''; // Törli az előző dobásokat
    results.forEach(roll => {
        const span = document.createElement('span');
        span.classList.add('dice-roll-number'); // Használjuk a CSS-ben definiált stílust
        span.textContent = roll;
        playerDiceResultsElement.appendChild(span);
    });
}

export function displayMobDice(results) {
    mobDiceResultsElement.innerHTML = ''; // Törli az előző dobásokat
    results.forEach(roll => {
        const span = document.createElement('span');
        span.classList.add('dice-roll-number'); // Használjuk a CSS-ben definiált stílust
        span.textContent = roll;
        mobDiceResultsElement.appendChild(span);
    });
}

// Harci kijelzők resetelése (dobások és predikció)
export function resetFightDisplay() {
    playerDiceResultsElement.innerHTML = '';
    mobDiceResultsElement.innerHTML = '';
    displayMobPredictedAction('???'); // Visszaállítja a predikciót alapértékre
}
