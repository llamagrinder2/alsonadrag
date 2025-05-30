// healing.js

import { player, mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, showFloatingText } from './ui-manager.js';
import { processCombatTurn  } from './game-logic.js'; // calculateValue nem kell ide, mert fix árakat használunk

const healingButtonsContainer = document.getElementById('healingButtonsContainer');

// Létrehozza a gyógyító (Use Potion) gombokat a harc során
export function createHealingButtons() {
    healingButtonsContainer.innerHTML = ''; // Törli a meglévő gombokat

    if (player.currentHp >= player.maxHp) {
        appendToLog("Your HP is already full!");
        return;
    }

    const potionLevels = [1, 2, 3];
    potionLevels.forEach(level => {
        if (player.potions[level] > 0) {
            const button = document.createElement('button');
            button.textContent = `Use Potion LV${level} (${player.potions[level]})`;
            button.onclick = () => usePotion(level);
            healingButtonsContainer.appendChild(button);
        }
    });

    const cancelButton = document.createElement('button');
    cancelButton.textContent = "Cancel Healing";
    cancelButton.onclick = cancelHealing;
    healingButtonsContainer.appendChild(cancelButton);
}

// Poti használata
export function usePotion(potionLevel) {
    if (player.potions[potionLevel] > 0) {
        let healAmount = 0;
        switch (potionLevel) {
            case 1:
                healAmount = 20; // Alapértelmezett gyógyítás LV1
                break;
            case 2:
                healAmount = 40; // Alapértelmezett gyógyítás LV2
                break;
            case 3:
                healAmount = 80; // Alapértelmezett gyógyítás LV3
                break;
        }

        player.currentHp += healAmount;
        if (player.currentHp > player.maxHp) {
            player.currentHp = player.maxHp; // Nem lépheti túl a max HP-t
        }
        player.potions[potionLevel]--;

        showFloatingText(document.getElementById('playerCurrentHp').parentElement, `+${healAmount}`, 'green');
        appendToLog(`You used Potion LV${potionLevel} and healed for ${healAmount} HP.`);
        updateUI();
        createHealingButtons(); // Frissíti a gombokat a megmaradt potik számával
    } else {
        appendToLog(`You don't have any Potion LV${potionLevel}!`);
    }
}

// Gyógyítás megszakítása / gombok elrejtése
export function cancelHealing() {
    healingButtonsContainer.innerHTML = '';
}

// Poti vásárlása
export function buyPotion(potionLevel) {
    let price = 0;
    switch (potionLevel) {
        case 1:
            price = gameModifiers.POTION_LV1_PRICE;
            break;
        case 2:
            price = gameModifiers.POTION_LV2_PRICE;
            break;
        case 3:
            price = gameModifiers.POTION_LV3_PRICE;
            break;
        default:
            appendToLog("Invalid potion level for purchase.");
            return;
    }

    if (player.bank < price) {
        alert(`Not enough money for Potion LV${potionLevel}! Requires ${price} Gold.`);
        return;
    }

    player.bank -= price;
    player.potions[potionLevel]++;
    appendToLog(`Bought Potion LV${potionLevel} for ${price} Gold.`);
    updateUI(); // Frissíti a UI-t (pénz, poti darabszám)
    // Nem hívjuk a createHealingButtons-t, mert ez a shopon keresztül történik, nem harc közben
    // A potik száma automatikusan frissül az updateUI() hívásával.
}
