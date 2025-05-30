// ui-manager.js

// UI elemek referenciái
const playerLevelElem = document.getElementById('player-level');
const playerCurrentHpElem = document.getElementById('player-current-hp');
const playerMaxHpElem = document.getElementById('player-max-hp');
const playerCurrentExpElem = document.getElementById('player-current-exp');
const playerExpToNextLevelElem = document.getElementById('player-exp-to-next-level');
const playerBankElem = document.getElementById('player-bank');
const playerBaseAttackElem = document.getElementById('player-base-attack');
const playerArmorElem = document.getElementById('player-armor');
const playerFloorLevelElem = document.getElementById('player-floor-level');
const potion1CountElem = document.getElementById('potion-1-count');
const potion2CountElem = document.getElementById('potion-2-count');
const potion3CountElem = document.getElementById('potion-3-count');

const mobNameElem = document.getElementById('mob-name');
const mobLevelElem = document.getElementById('mob-level');
const mobCurrentHpElem = document.getElementById('mob-current-hp');
const mobMaxHpElem = document.getElementById('mob-max-hp');
const mobBaseAttackElem = document.getElementById('mob-base-attack');
const mobXpRewardElem = document.getElementById('mob-xp-reward');
const mobCoinRewardElem = document.getElementById('mob-coin-reward');
const mobPredictedActionElem = document.getElementById('mob-predicted-action');

const logOutput = document.getElementById('log-output');

const goMobButton = document.getElementById('go-mob-button');
const levelUpButton = document.getElementById('level-up-button');
const ascendButton = document.getElementById('ascend-button');
const descendButton = document.getElementById('descend-button');
const shopButton = document.getElementById('shop-button');
const thirdEyeButton = document.getElementById('third-eye-button');
const boostSpellButton = document.getElementById('boost-spell-button');
const thirdEyeCostElem = document.getElementById('third-eye-cost');
const boostSpellCostElem = document.getElementById('boost-spell-cost');

// Kockadobás kijelzők
const playerDiceResultsElem = document.getElementById('player-dice-results');
const mobDiceResultsElem = document.getElementById('mob-dice-results');

// Fő gomb konténerek (a láthatóság vezérléséhez)
const gameButtonsContainer = document.getElementById('game-buttons-container');
const combatButtonsContainer = document.getElementById('combat-buttons-container'); // Ez a "szülő" konténer a Roll/PlayerActions/HealingUI-nak

// Specifikus gomb konténerek
const rollButtonContainer = document.getElementById('roll-button-container'); // A "Roll" gomb konténere
const playerActionButtonsContainer = document.getElementById('player-action-buttons-container'); // Attack, Defend, Heal konténer
const healingUiContainer = document.getElementById('healing-ui-container'); // Potionok és Cancel konténer

// Shop UI elemek
const shopModal = document.getElementById('shop-modal');
const shopItemsContainer = document.getElementById('shop-items-container');
const exitShopButton = document.getElementById('exit-shop-button');
const shopPotion1PriceElem = document.getElementById('shop-potion-1-price');
const shopPotion2PriceElem = document.getElementById('shop-potion-2-price');
const shopPotion3PriceElem = document.getElementById('shop-potion-3-price');

// Death Screen
const deathScreen = document.getElementById('death-screen');
const restartGameButton = document.getElementById('restart-game-button');


// UI frissítése
export function updateUI(player, mob) {
    playerLevelElem.textContent = player.level;
    playerCurrentHpElem.textContent = Math.ceil(player.currentHp);
    playerMaxHpElem.textContent = Math.ceil(player.maxHp);
    playerCurrentExpElem.textContent = Math.ceil(player.currentExp);
    playerExpToNextLevelElem.textContent = Math.ceil(player.expToNextLevel);
    playerBankElem.textContent = player.bank;
    playerBaseAttackElem.textContent = Math.ceil(player.baseAttack);
    playerArmorElem.textContent = player.armor;
    playerFloorLevelElem.textContent = player.floorLevel;
    potion1CountElem.textContent = player.potions[1];
    potion2CountElem.textContent = player.potions[2];
    potion3CountElem.textContent = player.potions[3];

    mobNameElem.textContent = mob.name;
    mobLevelElem.textContent = mob.level;
    mobCurrentHpElem.textContent = Math.ceil(mob.currentHp);
    mobMaxHpElem.textContent = Math.ceil(mob.maxHp);
    mobBaseAttackElem.textContent = Math.ceil(mob.baseAttack);
    mobXpRewardElem.textContent = Math.ceil(mob.xpReward);
    mobCoinRewardElem.textContent = Math.ceil(mob.coinReward);
    mobPredictedActionElem.textContent = mob.predictedAction;

    // Spell gombok szövegének frissítése (költség)
    thirdEyeCostElem.textContent = player.gameModifiers.THIRD_EYE_PRICE; // Feltehetően importálod a gameModifiers-t
    boostSpellCostElem.textContent = player.gameModifiers.BOOST_SPELL_PRICE; // Ugyanez
}

// Log üzenet hozzáadása
export function appendToLog(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logOutput.appendChild(p);
    logOutput.scrollTop = logOutput.scrollHeight; // Görgetés az aljára
}

// Lebegő szöveg megjelenítése
export function showFloatingText(element, text, isDamage) {
    const floatingText = document.createElement('div');
    floatingText.textContent = text;
    floatingText.classList.add('floating-text');
    if (isDamage) {
        floatingText.classList.add('damage-text');
    } else {
        floatingText.classList.add('heal-text');
    }

    const rect = element.getBoundingClientRect();
    // A szöveg az elem fölött jelenik meg, az elem közepén
    floatingText.style.left = `${rect.left + rect.width / 2}px`;
    floatingText.style.top = `${rect.top}px`;

    document.body.appendChild(floatingText);

    // Animáció és eltávolítás
    floatingText.style.opacity = '1';
    floatingText.style.transform = 'translate(-50%, -20px)'; // Felfelé mozog

    setTimeout(() => {
        floatingText.style.opacity = '0';
        floatingText.style.transform = 'translate(-50%, -50px)'; // Még feljebb mozog és eltűnik
        floatingText.addEventListener('transitionend', () => {
            floatingText.remove();
        });
    }, 1000); // 1 másodperc után kezdődik az eltűnés
}

// --- Gombok láthatóságának kezelése ---

// Fő játékgombok (Go Mob, Level Up, Shop, Ascend/Descend, Spells)
export function toggleGameButtons(show) {
    gameButtonsContainer.style.display = show ? 'grid' : 'none'; // 'grid' vagy 'flex' ahogy épp van
}

// A Roll gomb láthatósága
export function toggleRollButton(show) {
    rollButtonContainer.style.display = show ? 'block' : 'none';
}

// Játékos akció gombjainak (Attack, Defend, Heal) láthatósága
export function togglePlayerActionButtons(show) {
    playerActionButtonsContainer.style.display = show ? 'grid' : 'none'; // 'grid' vagy 'flex'
}

// Gyógyítás UI (Potionok és Cancel) láthatósága
export function toggleHealingUI(show) {
    healingUiContainer.style.display = show ? 'grid' : 'none'; // 'grid' vagy 'flex'
}

// Összes harci gomb konténerének láthatósága (ez vezérli a Roll/PlayerActions/HealingUI szülőjét)
export function hideAllCombatButtons(hide) {
    // Ha hide igaz, elrejti a combatButtonsContainer-t, ami az összes harci gombot tartalmazza.
    // Ezen felül expliciten elrejtjük a Roll, PlayerAction és HealingUI konténereket is.
    if (hide) {
        combatButtonsContainer.style.display = 'none';
        toggleRollButton(false);
        togglePlayerActionButtons(false);
        toggleHealingUI(false);
    } else {
        combatButtonsContainer.style.display = 'block'; // Vagy 'flex'/'grid' ahogy neked van beállítva
    }
}


// Mob kockadobás kijelzése
export function displayMobDice(results) {
    mobDiceResultsElem.innerHTML = ''; // Törli az előző dobásokat
    results.forEach(roll => {
        const span = document.createElement('span');
        span.textContent = roll;
        span.classList.add('dice-roll-number');
        mobDiceResultsElem.appendChild(span);
    });
}

// Játékos kockadobás kijelzése
export function displayPlayerDice(results) {
    playerDiceResultsElem.innerHTML = ''; // Törli az előző dobásokat
    results.forEach(roll => {
        const span = document.createElement('span');
        span.textContent = roll;
        span.classList.add('dice-roll-number');
        playerDiceResultsElem.appendChild(span);
    });
}

// Mob predikált akciójának kijelzése
export function displayMobPredictedAction(action) {
    mobPredictedActionElem.textContent = action;
}

// Harci kijelzők (kockák, predikció) resetelése
export function resetFightDisplay() {
    playerDiceResultsElem.innerHTML = '';
    mobDiceResultsElem.innerHTML = '';
    mobPredictedActionElem.textContent = '???';
}

// Shop gombok frissítése
export function updateShopButtons(playerGold, shopItems) {
    shopItemsContainer.innerHTML = ''; // Törli az előző itemeket

    for (const itemId in shopItems) {
        const item = shopItems[itemId];
        const button = document.createElement('button');
        button.id = `buy-${itemId}-button`;
        button.textContent = `${item.name} (${item.price}G)`;
        if (item.unlocked) {
            button.classList.add('purchased');
            button.disabled = true;
            button.textContent += ' (Megvásárolva)';
        } else if (playerGold < item.price) {
            button.disabled = true;
        }
        shopItemsContainer.appendChild(button);
        // Event listener hozzáadása az app.js-ben történik
    }
}

// Potion árak megjelenítése a Shopban
export function renderPotionPrices(price1, price2, price3) {
    document.getElementById('shop-potion-1-price').textContent = price1;
    document.getElementById('shop-potion-2-price').textContent = price2;
    document.getElementById('shop-potion-3-price').textContent = price3;
}

// Death Screen megjelenítése/elrejtése
export function showDeathScreen() {
    deathScreen.style.display = 'flex';
}

export function hideDeathScreen() {
    deathScreen.style.display = 'none';
}
