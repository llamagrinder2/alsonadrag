// event-handlers.js

// Importáljuk a szükséges DOM elemeket a UI kezeléséhez
import { updateUI, appendToLog, toggleGameButtons, togglePlayerActionButtons, hideAllCombatButtons, toggleHealingUI } from './ui-manager.js';
// Importáljuk a game-logicból az aktuális, exportált függvényeket
import {
    nextMob,
    startCombat, // Ez hívódik a Roll gombra
    handlePlayerAction, // Ez kezeli az Attack, Defend, Heal választást
    enterShop,
    exitShop,
    buyItem, // Bár shop-item-ekre van külön függvény, ez egy általános helykitöltő lehet
    buyPotionFromShop // Ez a shopból való poti vásárlás
} from './game-logic.js';
import { player, mob, gameModifiers } from './game-state.js';
import { resetShopItems, shopItems } from './game-state.js'; // A shop elemek reseteléséhez és a shopItems eléréséhez
import { calculatePlayerStats } from './game-calculations.js'; // A játékos statisztikák újraszámításához halál esetén
import { activateThirdEye, activateBoostSpell } from './spells.js'; // Spells importálása

// Globális referencia a shop modalra
const shopModal = document.getElementById('shopModal');

export function initializeEventListeners() {
    // Harc gomb (Roll)
    // Most már a startCombat függvényt hívja, ami előkészíti a játékost az akcióválasztásra
    document.getElementById('rollButton').addEventListener('click', startCombat);

    // Játékos akció gombok (Attack, Defend, Heal)
    // Mindegyik a handlePlayerAction függvényt hívja a választott akcióval
    document.getElementById('attackActionButton').addEventListener('click', () => handlePlayerAction('attack'));
    document.getElementById('defendActionButton').addEventListener('click', () => handlePlayerAction('defend'));
    document.getElementById('healActionButton').addEventListener('click', () => handlePlayerAction('heal')); // A Heal akció is a handlePlayerAction-ön keresztül fut

    // Mob navigáció (Go Mob, Descend Level, Ascend Level)
    document.getElementById('goMobButton').addEventListener('click', () => {
        nextMob(); // Új mob generálása
        toggleGameButtons(true); // Fő játék gombok visszaállítása
        hideAllCombatButtons(false); // Harci gombok (Roll) visszaállítása, a player action gombok rejtve maradnak
        appendToLog("You move to the next mob!");
    });
    
    // Nincs prevMob függvény a game-logic.js-ben, így ezt kikommenteltem
    // Ha szeretnél ilyen funkcionalitást, implementálni kell a game-logic.js-ben
    // document.getElementById('descendLevelButton').addEventListener('click', prevMob); 

    document.getElementById('ascendLevelButton').addEventListener('click', () => {
        player.level++; // Szint növelése
        calculatePlayerStats(); // Frissíti a játékos statisztikáit az új szint alapján
        player.currentHp = player.maxHp; // Szintlépéskor teljes HP
        nextMob(); // Új mob generálása az új szinten
        appendToLog(`You ascended to Level ${player.level}. A new mob appeared!`);
        toggleGameButtons(true); // Fő játék gombok visszaállítása
        hideAllCombatButtons(false); // Harci gombok (Roll) visszaállítása
        updateUI(); // Frissíti a UI-t, hogy az új HP és Level látszódjon
    });

    // Gyógyító gombok konténerén delegálás
    // A healing.js már kezeli a gombokat és a "Back" gombot,
    // de a "Back" gomb eseménykezelője a game-logic.js-ben van dinamikusan hozzáadva.
    // Így itt nem kell külön event listenert rátenni, csak a shop-ból való vásárlásra.
    // A usePotion függvényt is a healing.js hívja, nem itt.

    // Shopból való poti vásárló gombok
    document.querySelectorAll('.buy-potion-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const potionLevel = parseInt(event.target.dataset.potionLevel);
            buyPotionFromShop(potionLevel); // Ez a game-logic.js-ben lévő függvény
        });
    });

    // Spell gombok
    document.getElementById('thirdEyeButton').addEventListener('click', activateThirdEye);
    document.getElementById('boostSpellButton').addEventListener('click', activateBoostSpell);

    // Shop gombok
    document.getElementById('enterShopButton').addEventListener('click', () => {
        // enterShop függvény hívása a game-logic.js-ből
        enterShop();
        updateShopButtons(); // Frissítjük a shop gombokat az aktuális bank állás alapján
    });

    // Shop modal bezárása X gombbal
    document.querySelector('.modal .close-button').addEventListener('click', () => {
        exitShop(); // exitShop függvény hívása a game-logic.js-ből
    });

    // Shop modal bezárása Exit Shop gombbal
    document.getElementById('exitShopButton').addEventListener('click', () => {
        exitShop(); // exitShop függvény hívása a game-logic.js-ből
    });

    // Shop reset gomb
    document.getElementById('shopResetButton').addEventListener('click', () => {
        resetShopItems(); // Shop elemek resetelése a game-state.js-ből
        appendToLog("Shop items have been reset!");
        updateShopButtons(); // Gombok frissítése
        updateUI(); // Frissíti a UI-t (bankot is, ha resetelünk)
    });

    // Shop item vásárlás (delegálás a konténeren)
    document.querySelector('.shop-items-container').addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-item-btn')) {
            const itemKey = event.target.dataset.item;
            buyShopItem(itemKey); // Helyi függvény a shop item vásárlására
        }
    });

    // Halál gomb (újraindítás)
    document.getElementById('deathButton').addEventListener('click', () => {
        // Reseteli a játék állapotát
        player.level = 1;
        player.currentExp = 0;
        player.bank = 0;
        player.potions = { 1: 1, 2: 1, 3: 1 };
        player.attackMultiplier = 1;
        player.baseAttackMultiplier = 1;
        player.armor = 0;
        player.activeSpells.thirdEye = false;
        player.activeSpells.boostSpell = false;

        resetShopItems(); // Shop is resetel
        calculatePlayerStats(); // Frissíti a játékos statokat (pl. max HP)
        player.currentHp = player.maxHp; // Teljes HP halál után
        nextMob(); // Új játék indítása új mobbal
        document.getElementById('deathButton').style.display = 'none'; // Elrejti a gombot
        toggleGameButtons(true); // Engedélyezi a fő játék gombokat
        hideAllCombatButtons(false); // Engedélyezi a Roll gombot
        togglePlayerActionButtons(false); // Letiltja az Attack/Defend/Heal gombokat
        toggleHealingUI(false); // Rejtjük a gyógyító UI-t
        appendToLog("You have been resurrected! A new adventure begins!");
        updateUI(); // Frissítjük a UI-t
    });

    // Kezdetben letiltjuk a játékos akció gombokat, amíg nem történik roll
    togglePlayerActionButtons(false);
}

// Shop gombok frissítése (megvásárolható/zárolt állapot)
export function updateShopButtons() {
    // Végigfutunk az összes itemen, ami a shopItems-ben van definiálva
    for (const key in shopItems) {
        const item = shopItems[key];
        // Csak a nem potion itemeket kezeljük itt, mert a potionok külön gombokat kapnak
        // A shopItems.js-ben lévő itemek `type` property-je segíthet ebben
        if (item.type && item.type === 'potion') {
            // A potion gombokat külön kezeljük, itt csak a buy-item-btn-eket frissítjük
            continue;
        }

        const button = document.querySelector(`.buy-item-btn[data-item="${key}"]`);
        // Az index meghatározása a lock ID-hez (fontos, hogy az index.html-ben is legyen ilyen ID)
        // Ezt a lock logikát érdemes a shopItems.js-ből vezérelni, hogy dinamikusabb legyen.
        // Jelenleg feltételezzük, hogy a lock ID-k 'lock1', 'lock2' stb.
        const itemIndex = Object.keys(shopItems).filter(k => shopItems[k].type !== 'potion').indexOf(key) + 1;
        const lockOverlay = document.getElementById(`lock${itemIndex}`);

        if (button) {
            if (item.unlocked) {
                if (lockOverlay) lockOverlay.style.display = 'none'; // Lock elrejtése
                button.disabled = true; // Ha már megvettük, letiltjuk
                button.textContent = 'Bought!';
            } else {
                if (lockOverlay) lockOverlay.style.display = 'flex'; // Lock megjelenítése (ha zárolva van)
                button.disabled = (player.bank < item.price); // Ha nincs elég pénz
                button.textContent = `Buy (${item.price} Gold)`;
            }
        }
    }
}

// Shop item vásárlási logika (nem potion)
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
            player.baseAttackMultiplier += item.effect.attack; // Feltehetően multiplier, nem baseAttack
            appendToLog(`You bought ${item.name}! Your attack multiplier increased by ${item.effect.attack}.`);
        }
        if (item.effect.armor) {
            player.armor += item.effect.armor;
            appendToLog(`You bought ${item.name}! Your armor increased by ${item.effect.armor}.`);
        }
        // Ha valami más hatás van, azt is itt kell kezelni

        updateUI(); // Frissíti a bank összegét és a statisztikákat
        updateShopButtons(); // Frissíti a shop gombokat
    } else {
        appendToLog(`Not enough gold to buy ${item.name}. You need ${item.price} Gold.`);
    }
}
