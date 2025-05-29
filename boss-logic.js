// boss-logic.js

import { player, mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, toggleGameButtons } from './ui-manager.js';
import { calculateValue, performAttack, death } from './game-logic.js'; // performAttack és death kellhet

// Boss számlálóhoz
let mobsDefeated = 0;
const mobsUntilBoss = 5; // Ennyi mob után jön a boss
const bossCounterText = document.getElementById('bossCounterText');
const rollButton = document.getElementById('rollButton');
const goMobButton = document.getElementById('goMobButton');


// Boss gomb (ha van ilyen, vagy ha sima roll gomb lesz a boss gomb)
// const bossButton = document.getElementById('bossButton'); // Feltételezve, hogy van ilyen gomb

export function bossCountUpdate() {
    mobsDefeated++;
    bossCounterText.textContent = `${mobsUntilBoss - (mobsDefeated % mobsUntilBoss)} mobs left until the Boss.`;

    if (mobsDefeated % mobsUntilBoss === 0) {
        appendToLog("A Boss is approaching! Prepare for a mighty battle!");
        bossButton(); // Aktiválja a boss gombot, vagy egy felugró ablakot
    }
}

export function bossButton() {
    // Ezt a függvényt hívjuk meg, amikor a bossnak meg kell jelennie.
    // Dönthetünk, hogy a Roll gomb lesz a "Boss" gomb, vagy egy új gomb jelenik meg.
    // Most az egyszerűség kedvéért tegyük fel, hogy a Roll gomb felirata változik.

    rollButton.textContent = "ATTACK BOSS!";
    rollButton.onclick = bossSummon; // A gomb funkciója megváltozik
    toggleGameButtons(true); // Gombok újra engedélyezése, ha le voltak tiltva
    goMobButton.disabled = true; // A "Go Mob" gomb letiltása, amíg a boss él
    
    appendToLog("The dungeon trembles... A Boss has appeared!");
    // Esetleg itt is meg lehetne jeleníteni a boss statokat azonnal
}

export function bossSummon() {
    // A mob objektumot használjuk a boss statjaihoz is
    mob.name = "Ogre Lord"; // Boss neve
    mob.level = player.level + 5; // Boss szintje, pl. játékos szint + 5

    // Boss HP számítása (használjuk a mob HP képletet, de lehetnek egyedi Z értékek)
    // A PDF-ben nem volt külön boss HP képlet, így a sima mob HP képletet használjuk,
    // de az Y, Z értékeket érdemes felülbírálni, ha a boss erősebb.
    // Most a sima mob HP képletet használjuk a player.level+5 szinttel.
    mob.minMobHpCalculated = calculateValue(
        mob.level,
        gameModifiers.MOB_HP_Y, // Használjuk a mob HP Y-t
        gameModifiers.MOB_HP_Z_MIN * 2, // Pl. kétszeres Z érték a bossnak
        null
    );
    mob.maxMobHpCalculated = calculateValue(
        mob.level,
        gameModifiers.MOB_HP_Y,
        gameModifiers.MOB_HP_Z_MAX * 2, // Pl. kétszeres Z érték a bossnak
        null
    );
    mob.maxHp = Math.ceil(Math.random() * (mob.maxMobHpCalculated - mob.minMobHpCalculated) + mob.minMobHpCalculated);
    mob.currentHp = mob.maxHp;

    // Boss sebzés számítása
    mob.baseAttack = calculateValue(
        mob.level,
        gameModifiers.MOB_DAMAGE_Y, // Használjuk a mob sebzés Y-t
        gameModifiers.MOB_DAMAGE_Z_MIN * 1.5, // Pl. másfélszeres sebzés a bossnak
        gameModifiers.MOB_DAMAGE_Z_MAX * 1.5
    );
    mob.armor = 0; // Boss armor (ezt is paraméterezhetjük, ha van)

    // Boss XP és Gold jutalom (ezek is skálázhatóak)
    mob.minMobXpCalculated = calculateValue(
        mob.level,
        gameModifiers.MOB_XP_Y,
        gameModifiers.MOB_XP_Z_MIN * 5, // Pl. ötszörös XP
        null
    );
    mob.maxMobXpCalculated = calculateValue(
        mob.level,
        gameModifiers.MOB_XP_Y,
        gameModifiers.MOB_XP_Z_MAX * 5, // Pl. ötszörös XP
        null
    );
    // Gold jutalom (fix szorzóval vagy külön képlet is lehet)
    mob.coinReward = calculateValue(mob.level, gameModifiers.GOLD_DROP_MAX_Y, gameModifiers.GOLD_DROP_MAX_Z * 10); // Tízszeres arany

    appendToLog(`A terrifying ${mob.name} (LV${mob.level}) appeared! HP: ${mob.maxHp}, DMG: ${mob.baseAttack}`);
    updateUI();
    resetFightDisplay();

    rollButton.onclick = performAttack; // Visszaállítjuk a Roll gomb funkcióját a harcra
}

export function handleBossDefeat() {
    appendToLog(`You bravely defeated the ${mob.name}! You feel stronger than ever!`);
    
    // Alap XP és Gold jutalom
    player.currentExp += mob.xpReward; // Az XP-t a handleMobDefeatben számoltuk, de itt érdemes felülírni egy boss XP-vel.
    player.bank += mob.coinReward;

    updateUI();
    checkPlayerLVUp(); // Szintlépés ellenőrzése

    // Boss után vissza a normál mobokhoz
    rollButton.textContent = "Roll";
    rollButton.onclick = performAttack;
    goMobButton.disabled = false; // "Go Mob" újra engedélyezése
    
    // Reseteljük a boss számlálót
    mobsDefeated = 0;
    bossCounterText.textContent = `${mobsUntilBoss - (mobsDefeated % mobsUntilBoss)} mobs left until the Boss.`;

    // nextMob() hívása az új mob megjelenítéséhez
    // A nextMob() függvényt a main.js-ben hívjuk meg az inicializáláskor,
    // és a handleMobDefeat-ben nem hívjuk, mert az új mob az event listenerre kattintva jön be.
    // Itt kellene eldönteni, hogy automatikusan jön-e a következő mob vagy Go Mob gombra.
    // Jelenlegi beállítás szerint a Go Mob gomb hozza a következő mobot.
}
