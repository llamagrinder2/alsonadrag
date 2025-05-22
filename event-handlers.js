// event-handlers.js
import { diceRoll, performAttack, nextMob, prevMob, death } from './game-logic.js';
import { usePotion, buyPotion } from './healing.js';
import { thirdEye, boostSpell } from './spells.js';
import { enterShop, exitShop, buyShopItem, shopReset } from './shop.js';
import { resetGame as fullResetGame } from './main.js'; // Importáljuk a main.js-ből a teljes reset-et

export function setupEventListeners() {
    document.getElementById('rollButton').addEventListener('click', () => {
        diceRoll();
        // A roll után egyből támadni kellene, vagy egy "Attack" gombot megjeleníteni.
        // A VBA kód alapján a Roll után egyből történik a mob akció.
        // Itt most egy timeout-ot használok, hogy a roll eredménye látható legyen, mielőtt a sebzés történik.
        setTimeout(performAttack, 1000);
    });
    document.getElementById('goMobButton').addEventListener('click', nextMob);
    document.getElementById('ascendLevelButton').addEventListener('click', nextMob);
    document.getElementById('descendLevelButton').addEventListener('click', prevMob);

    document.querySelectorAll('.buy-potion-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const level = event.target.dataset.potionLevel;
            buyPotion(parseInt(level));
        });
    });

    document.getElementById('thirdEyeButton').addEventListener('click', thirdEye);
    document.getElementById('boostSpellButton').addEventListener('click', boostSpell);

    document.getElementById('enterShopButton').addEventListener('click', enterShop);
    document.getElementById('exitShopButton').addEventListener('click', exitShop);
    document.querySelector('#shopModal .close-button').addEventListener('click', exitShop);
    document.getElementById('shopResetButton').addEventListener('click', shopReset);

    document.querySelectorAll('.shop-item .buy-item-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const item = event.target.dataset.item;
            buyShopItem(item);
        });
    });

    // Death gomb eseménykezelője
    document.getElementById('deathButton').addEventListener('click', fullResetGame);
}
