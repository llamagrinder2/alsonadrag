// event-handlers.js

import { player, mob, shopItems, gameModifiers } from './game-state.js'; // Hozzáadva a gameModifiers importja
import { attackMob, defendPlayer, healPlayer, rollDice, levelUp, resetGame, calculatePlayerStats, spawnMob, ascendFloor, descendFloor } from './game-logic.js'; // Hozzáadva a rollDice és resetGame importja
import { updateUI, appendToLog, showDeathScreen, hideDeathScreen, toggleGameButtons, toggleRollButton, togglePlayerActionButtons, toggleHealingUI, hideAllCombatButtons } from './ui-manager.js';
import { enterShop, exitShop, buyShopItem, shopReset } from './shop.js'; // shopReset importálva
import { activateThirdEye, activateBoostSpell } from './spells.js'; // Spellek importálva
import { buyPotion } from './healing.js'; // buyPotion importálva

// UI elemek beszerzése
const goMobButton = document.getElementById('go-mob-button');
const levelUpButton = document.getElementById('level-up-button');
const ascendButton = document.getElementById('ascend-button');
const descendButton = document.getElementById('descend-button');
const shopButton = document.getElementById('shop-button');
const rollButton = document.getElementById('roll-button');
const attackButton = document.getElementById('attack-button');
const defendButton = document.getElementById('defend-button');
const healButton = document.getElementById('heal-button');
const usePotion1Button = document.getElementById('use-potion-1-button');
const usePotion2Button = document.getElementById('use-potion-2-button');
const usePotion3Button = document.getElementById('use-potion-3-button');
const cancelHealingButton = document.getElementById('cancel-healing-button');
const exitShopButton = document.getElementById('exit-shop-button');
const restartGameButton = document.getElementById('restart-game-button');
const thirdEyeButton = document.getElementById('third-eye-button'); // Spellek gombjai
const boostSpellButton = document.getElementById('boost-spell-button'); // Spellek gombjai

// Shop gombok (dinamikusan generálódnak, de az eseményfigyelő a konténerre kerül)
const shopItemsContainer = document.getElementById('shop-items-container');
const potionShopButtons = document.querySelector('.potion-shop-buttons'); // A potion shop gombok konténere


export function initializeEventListeners() {
    // Fő játék gombok
    if (goMobButton) {
        goMobButton.addEventListener('click', () => {
            spawnMob(player.floorLevel); // Mob spawnolása az aktuális szintre
            toggleGameButtons(false); // Fő gombok elrejtése
            hideAllCombatButtons(false); // Harci gombok konténerének megjelenítése
            toggleRollButton(true); // Roll gomb megjelenítése
            updateUI(player, mob);
            appendToLog(`You encountered a ${mob.name}!`);
        });
    }

    if (levelUpButton) {
        levelUpButton.addEventListener('click', () => {
            levelUp();
            updateUI(player, mob);
        });
    }

    if (ascendButton) {
        ascendButton.addEventListener('click', () => {
            if (player.floorLevel < gameModifiers.MAX_FLOOR) { // Feltételezve, hogy van MAX_FLOOR
                ascendFloor();
                updateUI(player, mob);
            } else {
                appendToLog("You are already at the highest floor!");
            }
        });
    }

    if (descendButton) {
        descendButton.addEventListener('click', () => {
            if (player.floorLevel > 1) {
                descendFloor();
                updateUI(player, mob);
            } else {
                appendToLog("You are already at the lowest floor!");
            }
        });
    }

    // Shop gombok
    if (shopButton) {
        shopButton.addEventListener('click', () => {
            enterShop();
            updateUI(player, mob); // Frissíti a UI-t, hogy a shop állapot is látszódjon (lockok, árak)
        });
    }

    if (exitShopButton) {
        exitShopButton.addEventListener('click', () => {
            exitShop();
            updateUI(player, mob);
        });
    }

    // Shop itemek vásárlása (eseménydelegálás a konténerre)
    if (shopItemsContainer) {
        shopItemsContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.id.startsWith('buy-')) {
                const itemId = event.target.id.replace('buy-', '');
                buyShopItem(itemId);
            }
        });
    }

    // Shop poti vásárlása (eseménydelegálás a konténerre)
    if (potionShopButtons) {
        potionShopButtons.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.id.startsWith('buy-potion-')) {
                const potionLevel = parseInt(event.target.id.replace('buy-potion-', ''));
                buyPotion(potionLevel);
            }
        });
    }

    // Harci gombok
    if (rollButton) {
        rollButton.addEventListener('click', () => {
            rollDice(); // A diceRoll logika itt fut le
            toggleRollButton(false); // Roll gomb elrejtése
            togglePlayerActionButtons(true); // Akció gombok megjelenítése
            updateUI(player, mob);
        });
    }

    if (attackButton) {
        attackButton.addEventListener('click', () => {
            player.currentAction = 'attack';
            attackMob();
            updateUI(player, mob);
        });
    }

    if (defendButton) {
        defendButton.addEventListener('click', () => {
            player.currentAction = 'defend';
            defendPlayer();
            updateUI(player, mob);
        });
    }

    if (healButton) {
        healButton.addEventListener('click', () => {
            player.currentAction = 'heal';
            togglePlayerActionButtons(false); // Akció gombok elrejtése
            toggleHealingUI(true); // Gyógyítás UI megjelenítése
            updateUI(player, mob);
        });
    }

    // Gyógyító gombok
    if (usePotion1Button) {
        usePotion1Button.addEventListener('click', () => {
            buyPotion(1); // Itt a buyPotion hívása történik, nem a usePotion
            updateUI(player, mob);
        });
    }
    if (usePotion2Button) {
        usePotion2Button.addEventListener('click', () => {
            buyPotion(2); // Itt a buyPotion hívása történik, nem a usePotion
            updateUI(player, mob);
        });
    }
    if (usePotion3Button) {
        usePotion3Button.addEventListener('click', () => {
            buyPotion(3); // Itt a buyPotion hívása történik, nem a usePotion
            updateUI(player, mob);
        });
    }

    if (cancelHealingButton) {
        cancelHealingButton.addEventListener('click', () => {
            toggleHealingUI(false); // Gyógyítás UI elrejtése
            togglePlayerActionButtons(true); // Akció gombok vissza
            player.currentAction = null;
            updateUI(player, mob);
        });
    }

    // Spellek gombjai
    if (thirdEyeButton) {
        thirdEyeButton.addEventListener('click', () => {
            activateThirdEye();
            updateUI(player, mob);
        });
    }

    if (boostSpellButton) {
        boostSpellButton.addEventListener('click', () => {
            activateBoostSpell();
            updateUI(player, mob);
        });
    }

    // Death Screen
    if (restartGameButton) {
        restartGameButton.addEventListener('click', () => {
            resetGame();
            hideDeathScreen();
            updateUI(player, mob);
            appendToLog("Game restarted! A new adventure begins...");
        });
    }
}
