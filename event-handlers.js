// event-handlers.js

import { handlePlayerAction, startCombat, enterShop, exitShop, buyItem, buyPotionFromShop, usePotion, ascendLevel, descendLevel } from './game-logic.js';

// Az eseményfigyelők inicializálása
export function initializeEventListeners() {
    // Harci gombok
    document.getElementById('attack-btn').addEventListener('click', () => handlePlayerAction('attack'));
    document.getElementById('defend-btn').addEventListener('click', () => handlePlayerAction('defend'));
    document.getElementById('heal-btn').addEventListener('click', () => handlePlayerAction('heal'));

    // Navigációs gombok
    document.getElementById('go-mob-btn').addEventListener('click', startCombat);
    document.getElementById('shop-btn').addEventListener('click', enterShop);

    // Shop gombok (általános itemek)
    document.getElementById('shop-exit-btn').addEventListener('click', exitShop);
    document.getElementById('buy-bronze-sword').addEventListener('click', () => buyItem('bronzeSword'));
    document.getElementById('buy-wooden-shield').addEventListener('click', () => buyItem('woodenShield'));

    // Potion vásárlás gombok (dinamikusak)
    // Az árakat is a UI fogja frissíteni, itt csak a szintet adjuk át
    document.getElementById('buy-potion-1').addEventListener('click', () => buyPotionFromShop(1));
    document.getElementById('buy-potion-2').addEventListener('click', () => buyPotionFromShop(2));
    document.getElementById('buy-potion-3').addEventListener('click', () => buyPotionFromShop(3));

    // Potion használat gombok
    document.getElementById('use-potion-1').addEventListener('click', () => usePotion(1));
    document.getElementById('use-potion-2').addEventListener('click', () => usePotion(2));
    document.getElementById('use-potion-3').addEventListener('click', () => usePotion(3));

    // Torony szintjének navigációs gombjai (FRISSÍTVE)
    document.getElementById('ascend-level-btn').addEventListener('click', ascendLevel);
    document.getElementById('descend-level-btn').addEventListener('click', descendLevel);
}

// Shop gombok állapotának frissítése (nem változik)
export function updateShopButtons() {
    // Ezt a ui-manager.js végzi majd, a renderPotionPrices-el együtt
    // Ez a függvény valószínűleg áthelyezhető a ui-manager.js-be
}
