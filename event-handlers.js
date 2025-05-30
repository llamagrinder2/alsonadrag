// event-handlers.js

import { handlePlayerAction, startCombat, enterShop, exitShop, buyItem, buyPotionFromShop, usePotion, ascendLevel, descendLevel, rollForCombat } from './game-logic.js'; // rollForCombat hozzáadva

// Az eseményfigyelők inicializálása
export function initializeEventListeners() {
    // Harci akció gombok
    document.getElementById('attack-btn').addEventListener('click', () => handlePlayerAction('attack'));
    document.getElementById('defend-btn').addEventListener('click', () => handlePlayerAction('defend'));
    document.getElementById('heal-btn').addEventListener('click', () => handlePlayerAction('heal'));

    // Roll Dice gomb
    document.getElementById('roll-dice-btn').addEventListener('click', rollForCombat); // Ez indítja a dobást

    // Navigációs gombok
    document.getElementById('go-mob-btn').addEventListener('click', startCombat);
    document.getElementById('shop-btn').addEventListener('click', enterShop);
    document.getElementById('ascend-level-btn').addEventListener('click', ascendLevel);
    document.getElementById('descend-level-btn').addEventListener('click', descendLevel);

    // Shop gombok (általános itemek)
    document.getElementById('shop-exit-btn').addEventListener('click', exitShop); // A modal bezáró gombja
    document.getElementById('buy-bronze-sword').addEventListener('click', () => buyItem('bronzeSword'));
    document.getElementById('buy-wooden-shield').addEventListener('click', () => buyItem('woodenShield'));

    // Potion vásárlás gombok
    document.getElementById('buy-potion-1').addEventListener('click', () => buyPotionFromShop(1));
    document.getElementById('buy-potion-2').addEventListener('click', () => buyPotionFromShop(2));
    document.getElementById('buy-potion-3').addEventListener('click', () => buyPotionFromShop(3));

    // Potion használat gombok
    document.getElementById('use-potion-1').addEventListener('click', () => usePotion(1));
    document.getElementById('use-potion-2').addEventListener('click', () => usePotion(2));
    document.getElementById('use-potion-3').addEventListener('click', () => usePotion(3));

    // Spell gombok (ha vannak már implementálva)
    // document.getElementById('third-eye-btn').addEventListener('click', () => useSpell('thirdEye'));
    // document.getElementById('boost-spell-btn').addEventListener('click', () => useSpell('boostSpell'));
}

// updateShopButtons valószínűleg áthelyezhető a ui-manager.js-be, ha csak UI frissítést végez.
// Jelenleg nem hívódik meg sehol, de a célja az, hogy frissítse a shop gombok állapotát.
// Exportálva hagyom, ha máshonnan is hívnád.
export function updateShopButtons() {
    // Ezt a ui-manager.js fogja végezni, a renderPotionPrices-el együtt
}
