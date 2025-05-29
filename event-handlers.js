// event-handlers.js

import { performAttack, nextMob, prevMob, updatePlayerStats, checkPlayerLVUp } from './game-logic.js';
import { updateUI, appendToLog, toggleGameButtons } from './ui-manager.js';
import { createHealingButtons, buyPotion, usePotion } from './healing.js'; // buyPotion importálása
import { activateThirdEye, activateBoostSpell } from './spells.js';
import { shopItems } from './game-state.js'; // shopItems importálása a shop logika miatt
import { resetShopItems } from './game-state.js'; // resetShopItems importálása
import { player } from './game-state.js'; // player importálása


export function initializeEventListeners() {
    // Harc gomb
    document.getElementById('rollButton').addEventListener('click', performAttack);

    // Mob navigáció
    document.getElementById('goMobButton').addEventListener('click', () => {
        nextMob();
        toggleGameButtons(true); // Gombok visszaállítása
    });
    document.getElementById('descendLevelButton').addEventListener('click', prevMob);
    document.getElementById('ascendLevelButton').addEventListener('click', () => {
        player.level++; // Szint növelése
        nextMob(); // Új mob generálása az új szinten
        appendToLog(`You ascended to Level ${player.level}. A new mob appeared!`);
    });

    // Gyógyító gombok konténerén delegálás (mivel dinamikusan jönnek létre)
    document.getElementById('healingButtonsContainer').addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const button = event.target;
            if (button.textContent.includes('Use Potion')) {
                const potionLevel = parseInt(button.textContent.match(/LV(\d)/)[1]);
                usePotion(potionLevel);
            } else if (button.textContent === 'Cancel Healing') {
                createHealingButtons(); // Ez valószínűleg nem a legjobb, a cancelHealing() hívása a jobb
            }
        }
    });

    // Poti vásárló gombok (dinamikusak lehetnek, vagy fixek, most a fix gombokra)
    document.querySelectorAll('.buy-potion-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const potionLevel = parseInt(event.target.dataset.potionLevel);
            buyPotion(potionLevel);
        });
    });

    // Spell gombok
    document.getElementById('thirdEyeButton').addEventListener('click', activateThirdEye);
    document.getElementById('boostSpellButton').addEventListener('click', activateBoostSpell);

    // Shop gombok
    const shopModal = document.getElementById('shopModal');
    document.getElementById('enterShopButton').addEventListener('click', () => {
        shopModal.style.display = 'flex'; // Modal megjelenítése
        toggleGameButtons(false); // Fő játék gombok letiltása
        // Frissítjük a shop gombokat az aktuális bank állás alapján
        updateShopButtons(); 
    });

    document.querySelector('.close-button').addEventListener('click', () => {
        shopModal.style.display = 'none'; // Modal elrejtése
        toggleGameButtons(true); // Fő játék gombok engedélyezése
    });

    document.getElementById('exitShopButton').addEventListener('click', () => {
        shopModal.style.display = 'none'; // Modal elrejtése
        toggleGameButtons(true); // Fő játék gombok engedélyezése
    });

    document.getElementById('shopResetButton').addEventListener('click', () => {
        resetShopItems(); // Shop elemek resetelése
        appendToLog("Shop items have been reset!");
        updateShopButtons(); // Gombok frissítése
    });

    // Shop item vásárlás (delegálás)
    document.querySelector('.shop-items-container').addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-item-btn')) {
            const itemKey = event.target.dataset.item;
            buyShopItem(itemKey);
        }
    });

    // Halál gomb (újraindítás)
    document.getElementById('deathButton').addEventListener('click', () => {
        // Reseteli a játék állapotát
        player.level = 1;
        player.currentExp = 0;
        player.currentHp = 0; // UpdatePlayerStats beállítja a max HP-t
        player.bank = 0;
        player.potions = { 1: 1, 2: 1, 3: 1 };
        player.attackMultiplier = 1;
        player.baseAttackMultiplier = 1;
        player.armor = 0;
        player.activeSpells.thirdEye = false;
        player.activeSpells.boostSpell = false;

        resetShopItems(); // Shop is resetel
        updatePlayerStats(); // Frissíti a játékos statokat (pl. max HP)
        nextMob(); // Új játék indítása új mobbal
        document.getElementById('deathButton').style.display = 'none'; // Elrejti a gombot
        toggleGameButtons(true); // Engedélyezi a játék gombokat
        appendToLog("You have been resurrected! A new adventure begins!");
    });
}

// Shop gombok frissítése (megvásárolható/zárolt állapot)
export function updateShopButtons() {
    for (const key in shopItems) {
        const item = shopItems[key];
        const button = document.querySelector(`.buy-item-btn[data-item="${key}"]`);
        const lockOverlay = document.getElementById(`lock${Array.from(document.querySelectorAll('.shop-item')).findIndex(el => el.id === `item${key.charAt(0).toUpperCase() + key.slice(1)}`) + 1}`);

        if (button) {
            button.textContent = `Buy (${item.price} Gold)`; // Frissítjük az árat is, ha dinamikus
            // Zárolás/feloldás
            if (item.unlocked) {
                if (lockOverlay) lockOverlay.style.display = 'none';
                button.disabled = true; // Ha már megvettük, letiltjuk
                button.textContent = 'Bought!';
            } else {
                if (lockOverlay) lockOverlay.style.display = 'flex'; // Kezdetben zárolva
                button.disabled = (player.bank < item.price); // Ha nincs elég pénz
                button.textContent = `Buy (${item.price} Gold)`;
            }
        }
    }
}

// Shop item vásárlási logika
function buyShopItem(itemKey) {
    const item = shopItems[itemKey];

    if (!item) {
        appendToLog("Error: Item not found!");
        return;
    }

    if (item.unlocked) {
        appendToLog(`You already own the ${item.name}.`);
        return;
    }

    if (player.bank >= item.price) {
        player.bank -= item.price;
        item.unlocked = true; // Jelölje meg megvásároltnak

        // Item hatásának alkalmazása
        if (item.effect.attack) {
            player.baseAttack += item.effect.attack;
            appendToLog(`You bought ${item.name}! Your base attack increased by ${item.effect.attack}.`);
        }
        if (item.effect.armor) {
            player.armor += item.effect.armor;
            appendToLog(`You bought ${item.name}! Your armor increased by ${item.effect.armor}.`);
        }

        updateUI(); // Frissíti a bank összegét és a statisztikákat
        updateShopButtons(); // Frissíti a shop gombokat
    } else {
        appendToLog(`Not enough gold to buy ${item.name}. You need ${item.price} Gold.`);
    }
}
