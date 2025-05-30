import { player, shopItems, resetShopItems } from './game-state.js';
import { appendToLog, updateUI, setModalVisibility } from './ui-manager.js';

export function enterShop() {
    setModalVisibility(true);
    updateUI(); // A shop elemek állapotának frissítése (lock-ok)
}

export function exitShop() {
    setModalVisibility(false);
    player.attackMultiplier = player.baseAttackMultiplier; // Visszaállítja a támadás multi-t - EZ A SOR VALÓSZÍNŰLEG NEM KELL IDE, MERT A BOLT NEM AD ÁTMENETI ATTACK MULTIPLIERT, AZ A SPELL
    updateUI();
}

export function buyShopItem(itemName) {
    const item = shopItems[itemName];
    if (!item) return;

    // Eredetileg 'bought' volt, de a 'game-state.js'-ben 'unlocked'-ra van átírva
    if (item.unlocked) {
        appendToLog("Item already bought!"); // Módosítva: alert helyett appendToLog
        return;
    }

    const price = item.price;

    if (player.bank < price) {
        appendToLog("Not enough money for this item!"); // Módosítva: alert helyett appendToLog
        return;
    }

    player.bank -= price;
    item.unlocked = true; // Módosítva: 'bought' helyett 'unlocked'
    appendToLog(`Bought ${item.name} for ${price} Gold.`); // Módosítva: itemName helyett item.name

    // Tárgy hatásának alkalmazása
    if (item.effect) {
        if (item.effect.attackMultiplier) {
            player.baseAttackMultiplier += item.effect.attackMultiplier;
        }
        if (item.effect.armor) {
            player.armor += item.effect.armor;
        }
    }

    updateUI(); // Frissíti a UI-t, eltünteti a lockot
}

export function shopReset() {
    resetShopItems(); // Visszaállítja a shopItems bought státuszát
    
    // A játékos statjainak (attackMultiplier, armor) VISSZAÁLLÍTÁSA:
    // Fontos: a shopReset nem tudja magától levonni azokat a statokat, amiket a tárgyak adtak,
    // mivel a resetShopItems csak a `unlocked` flaget állítja vissza.
    // A teljes játékállapot (player object) resetelését a `resetGame()` függvénynek kellene kezelnie,
    // amit a halál utáni újraindításkor hívunk meg.
    // Ezért az alábbi sorokat kikommenteztem, mivel a `player` resetelése nem itt kell, hogy történjen.
    // player.attackMultiplier = 1; // Visszaállít az alapértékre
    // player.baseAttackMultiplier = 1; // Visszaállít az alapértékre
    // player.armor = 0; // Visszaállít az alapértékre


    // Újra létrehozza a lock elemeket a UI-ban - EZT AZ UI-MANAGER-NEK KELLENE KEZELNIE,
    // AZ updateShopButtons FÜGGVÉNYEN KERESZTÜL, NEM ITT.
    // A `shopReset` célja a logikai állapot visszaállítása.
    // Ha az `updateUI` hívása tartalmazza az `updateShopButtons` hívását, az megoldja.
    
    appendToLog("Shop has been reset!");
    updateUI(); // Frissíti az UI-t, ami majd újrarendezi a shop elemeket és a lockokat.
}

// Ezt a függvényt valószínűleg nem használja a kód máshol,
// de ha mégis, akkor jó, ha itt marad.
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
