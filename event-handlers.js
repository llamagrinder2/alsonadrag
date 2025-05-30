// event-handlers.js

import { nextMob, prevMob, updatePlayerStats, checkPlayerLVUp, rollDiceAndPredictMobAction, playerAction } from './game-logic.js'; // rollDiceAndPredictMobAction és playerAction importálva
import { updateUI, appendToLog, toggleGameButtons, togglePlayerActionButtons, hideAllCombatButtons } from './ui-manager.js';
import { createHealingButtons, buyPotion, usePotion, cancelHealing } from './healing.js';
import { activateThirdEye, activateBoostSpell } from './spells.js';
import { shopItems, player } from './game-state.js';
import { resetShopItems } from './game-state.js';


export function initializeEventListeners() {
    // Harc gomb (most már dob és előrejelzi a mob akcióját)
    document.getElementById('rollButton').addEventListener('click', rollDiceAndPredictMobAction);

    // Játékos akció gombok (Attack, Defend, Heal)
    document.getElementById('attackActionButton').addEventListener('click', () => playerAction('attack'));
    document.getElementById('defendActionButton').addEventListener('click', () => playerAction('defend'));
    document.getElementById('healActionButton').addEventListener('click', () => {
        // Amikor a játékos a "Heal" gombot nyomja meg, felajánljuk a potihasználat lehetőséget
        createHealingButtons(); // Ez létrehozza a Use Potion gombokat
        appendToLog("You chose to heal. Select a potion or cancel.");
        // Letiltjuk a fő harci gombokat amíg a poti választás zajlik
        document.getElementById('rollButton').disabled = true;
        togglePlayerActionButtons(false);
    });

    // Mob navigáció
    document.getElementById('goMobButton').addEventListener('click', () => {
        nextMob();
        toggleGameButtons(true); // Fő játék gombok visszaállítása
        hideAllCombatButtons(false); // Harci gombok (Roll, Spells, Actions) visszaállítása
    });
    document.getElementById('descendLevelButton').addEventListener('click', prevMob);
    document.getElementById('ascendLevelButton').addEventListener('click', () => {
        player.level++; // Szint növelése
        nextMob(); // Új mob generálása az új szinten
        appendToLog(`You ascended to Level ${player.level}. A new mob appeared!`);
        toggleGameButtons(true); // Fő játék gombok visszaállítása
        hideAllCombatButtons(false); // Harci gombok (Roll, Spells, Actions) visszaállítása
    });

    // Gyógyító gombok konténerén delegálás (ez a `createHealingButtons` által generált gombokat kezeli)
    document.getElementById('healingButtonsContainer').addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const button = event.target;
            if (button.textContent.includes('Use Potion')) {
                const potionLevel = parseInt(button.textContent.match(/LV(\d)/)[1]);
                usePotion(potionLevel);
                // Miután potit használt, folytathatja a harcot
                cancelHealing(); // Elrejti a poti választó gombokat
                // A harci körnek folytatódnia kellene, de mivel a playerAction("heal") hívta,
                // a `game-logic.js`-ben lévő `executeCombatRound` függvény végzi el a további lépéseket.
                // Itt csak a UI-t kell visszaállítani.
                document.getElementById('rollButton').disabled = false; // Roll gomb újra engedélyezése
                togglePlayerActionButtons(true); // Játékos akció gombok visszaállítása
            } else if (button.textContent === 'Cancel Healing') {
                cancelHealing(); // Elrejti a poti választó gombokat
                document.getElementById('rollButton').disabled = false; // Roll gomb újra engedélyezése
                togglePlayerActionButtons(true); // Játékos akció gombok visszaállítása
            }
        }
    });

    // Poti vásárló gombok
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
        hideAllCombatButtons(true); // Harci gombok teljes letiltása/elrejtése
        updateShopButtons(); // Frissítjük a shop gombokat az aktuális bank állás alapján
    });

    document.querySelector('.close-button').addEventListener('click', () => {
        shopModal.style.display = 'none'; // Modal elrejtése
        toggleGameButtons(true); // Fő játék gombok engedélyezése
        hideAllCombatButtons(false); // Harci gombok újra engedélyezése
    });

    document.getElementById('exitShopButton').addEventListener('click', () => {
        shopModal.style.display = 'none'; // Modal elrejtése
        toggleGameButtons(true); // Fő játék gombok engedélyezése
        hideAllCombatButtons(false); // Harci gombok újra engedélyezése
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
        toggleGameButtons(true); // Engedélyezi a fő játék gombokat
        hideAllCombatButtons(false); // Engedélyezi a harci gombokat
        appendToLog("You have been resurrected! A new adventure begins!");
    });

    // Kezdetben letiltjuk a játékos akció gombokat, amíg nem történik roll
    togglePlayerActionButtons(false);
}

// Shop gombok frissítése (megvásárolható/zárolt állapot)
export function updateShopButtons() {
    for (const key in shopItems) {
        const item = shopItems[key];
        const button = document.querySelector(`.buy-item-btn[data-item="${key}"]`);
        // Az index meghatározása a lock ID-hez
        const itemIndex = Object.keys(shopItems).indexOf(key) + 1;
        const lockOverlay = document.getElementById(`lock${itemIndex}`);

        if (button) {
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
