// shop.js
import { player, shopItems, resetShopItems } from './game-state.js';
import { appendToLog, updateUI, setModalVisibility } from './ui-manager.js';

export function enterShop() {
    setModalVisibility(true);
    updateUI(); // A shop elemek állapotának frissítése (lock-ok)
}

export function exitShop() {
    setModalVisibility(false);
    player.attackMultiplier = player.baseAttackMultiplier; // Visszaállítja a támadás multi-t
    updateUI();
}

export function buyShopItem(itemName) {
    const item = shopItems[itemName];
    if (!item) return;

    if (item.bought) {
        alert("Item already bought!");
        return;
    }

    const price = item.price; // Az ár már a shopItems objektumban van

    if (player.bank < price) {
        alert("Not enough money for this item!!");
        return;
    }

    player.bank -= price;
    item.bought = true;
    appendToLog(`Bought ${itemName} for ${price} Gold.`);

    // Tárgy hatásának alkalmazása
    if (itemName === 'dagger') {
        player.attackMultiplier += 5;
        player.baseAttackMultiplier += 5;
    } else if (itemName === 'leatherVest') {
        player.armor += 0.1;
    } else if (itemName === 'whetstone') {
        player.attackMultiplier += 2;
        player.baseAttackMultiplier += 2;
    } else if (itemName === 'leather2') {
        player.armor += 0.2;
    }

    updateUI(); // Frissíti a UI-t, eltünteti a lockot
}

export function shopReset() {
    resetShopItems(); // Visszaállítja a shopItems bought státuszát
    // Visszaállítja a játékos statjait, ha a bolti tárgyak adtak statot.
    // Ez komplexebb lehet, ha a tárgyak eltávolítása negatívan hat.
    // Egyelőre csak a lockokat tesszük vissza.
    // A Player statjait (attackMultiplier, armor) valószínűleg egy külön reset függvénynek kellene visszaállítania,
    // vagy a bolt resetnek figyelembe vennie, hogy miket adott a tárgy, és azokat levonni.
    // Egyszerűbb, ha a `resetGame` hívja a `resetPlayerState()`-et, ami mindent alapra állít.

    // Újra létrehozza a lock elemeket a UI-ban
    for (const itemKey in shopItems) {
        const item = shopItems[itemKey];
        const shopItemDiv = document.getElementById(`item${capitalizeFirstLetter(itemKey)}`);
        if (shopItemDiv && !document.getElementById(item.lockId)) {
            const lockDiv = document.createElement('div');
            lockDiv.classList.add('item-lock');
            lockDiv.id = item.lockId;
            lockDiv.textContent = 'ITEM LOCKED';
            shopItemDiv.appendChild(lockDiv);
        }
    }
    appendToLog("Shop has been reset!");
    updateUI();
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
