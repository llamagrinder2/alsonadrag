// game-logic.js

import { player, mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, resetFightDisplay, toggleGameButtons } from './ui-manager.js';
import { bossCountUpdate, bossButton, bossSummon } from './boss-logic.js';
import { createHealingButtons, usePotion, cancelHealing } from './healing.js';
import { endThirdEye } from './spells.js';

// Univerzális számítási függvény a megadott képlet alapján
// figyelembe véve a Z értékeket (Zmin/Zmax tartomány vagy fix Z)
export function calculateValue(n, Y_value, Z_min_or_fixed, Z_max = null) {
    const X = gameModifiers.MAX_LEVEL;
    const denominator = X - Y_value;

    // Hibakezelés, ha a nevező nulla vagy negatív lenne
    if (denominator <= 0) {
        console.error(`Hiba: A képlet nevezője nulla vagy negatív! (n=${n}, Y=${Y_value}, X=${X})`);
        // Visszaad egy alapértéket hibás esetben, pl. n * Z_min_or_fixed, vagy 1
        return Math.max(1, n * (Z_min_or_fixed || 1));
    }

    const baseValue = n + (n * n) / denominator;
    let finalValue;

    if (Z_max !== null) {
        // Ha Zmin és Zmax is meg van adva, akkor tartományból választunk
        const minValue = baseValue * Z_min_or_fixed;
        const maxValue = baseValue * Z_max;
        finalValue = Math.random() * (maxValue - minValue) + minValue;
    } else {
        // Ha csak egy fix Z érték van megadva
        finalValue = baseValue * Z_min_or_fixed;
    }

    // A HP és sebzés értékeket általában felfelé kerekítjük, XP-nél, Goldnál is érdemes
    return Math.max(1, Math.ceil(finalValue)); // Legalább 1 legyen, felfelé kerekítve
}


// Kockadobás (ez valószínűleg egy alap mechanika, nem függ a képlettől)
export function diceRoll() {
    return Math.floor(Math.random() * gameModifiers.mod1) + 1;
}

// Sebzés számítása (átalakítva az új statokhoz)
export function calculateDamage(attackerAttack, defenderArmor) {
    const rawDamage = attackerAttack - defenderArmor;
    return Math.max(1, rawDamage); // Minimum 1 sebzés
}

// Támadás logikája
export function performAttack() {
    toggleGameButtons(false); // Gombok letiltása a támadás alatt
    appendToLog("You rolled the dice...");

    const playerRoll = diceRoll();
    const mobRoll = diceRoll();

    document.getElementById('playerRollResult').textContent = playerRoll;
    document.getElementById('mobRollResult').textContent = mobRoll;

    let playerDamageDealt = 0;
    let mobDamageDealt = 0;

    if (playerRoll >= mobRoll) {
        // Játékos támad
        playerDamageDealt = calculateDamage(player.baseAttack * player.attackMultiplier, mob.armor);
        mob.currentHp -= playerDamageDealt;
        showFloatingText(document.getElementById('mobCurrentHp').parentElement, `-${playerDamageDealt}`, 'red');
        appendToLog(`You hit the ${mob.name} for ${playerDamageDealt} damage!`);
    } else {
        // Mob támad
        mobDamageDealt = calculateDamage(mob.baseAttack, player.armor);
        player.currentHp -= mobDamageDealt;
        showFloatingText(document.getElementById('playerCurrentHp').parentElement, `-${mobDamageDealt}`, 'red');
        appendToLog(`The ${mob.name} hit you for ${mobDamageDealt} damage!`);
    }

    updateUI();

    // Várakozás, majd ellenőrzés
    setTimeout(() => {
        if (mob.currentHp <= 0) {
            mob.currentHp = 0; // Biztosítsuk, hogy ne legyen negatív
            appendToLog(`You defeated the ${mob.name}!`);
            handleMobDefeat();
        } else if (player.currentHp <= 0) {
            player.currentHp = 0; // Biztosítsuk, hogy ne legyen negatív
            appendToLog("You have been defeated!");
            death();
        } else {
            toggleGameButtons(true); // Gombok újra engedélyezése, ha a harc folytatódik
        }
    }, 1000); // Késleltetés a lebegő szöveg megjelenéséhez
}

// Mob legyőzésének kezelése (XP és Gold kiosztás)
function handleMobDefeat() {
    // XP jutalom számítása a mob HP-jához igazodva (PDF alapján)
    // Meg kell győződni arról, hogy mob.maxMobHpCalculated - mob.minMobHpCalculated ne legyen nulla
    const hpRange = mob.maxMobHpCalculated - mob.minMobHpCalculated;
    const xpRange = mob.maxMobXpCalculated - mob.minMobXpCalculated;

    let actualXPReward;
    if (hpRange === 0) {
        // Ha a HP tartomány nulla, akkor csak a minimum XP-t adjuk
        actualXPReward = mob.minMobXpCalculated;
    } else {
        const deltaXP = xpRange / hpRange;
        // A mob.currentHp itt a mob generálásakor kisorsolt tényleges mob.maxHp-t reprezentálja.
        // Ezt használjuk az XP skálázásához.
        const actualMobHpRelativeToMin = mob.maxHp - mob.minMobHpCalculated; 
        actualXPReward = mob.minMobXpCalculated + (actualMobHpRelativeToMin * deltaXP);
    }
    
    player.currentExp += Math.ceil(actualXPReward); // XP hozzáadása, felkerekítve

    // Gold jutalom
    player.bank += mob.coinReward;

    appendToLog(`You gained ${Math.ceil(actualXPReward)} XP and ${mob.coinReward} Gold.`);
    updateUI();
    checkPlayerLVUp(); // Szintlépés ellenőrzése
    bossCountUpdate(); // Boss számláló frissítése

    endThirdEye(); // Harmadik szem spell befejezése (ha aktív volt)
    
    // Healing gombok elrejtése a harc végeztével
    cancelHealing(); 
}

// Új mob generálása
export function nextMob() {
    // Mob szint beállítása (általában a játékos szintje)
    mob.level = player.level;

    // Mob HP számítása és tárolása a skálázáshoz
    mob.minMobHpCalculated = calculateValue(
        mob.level,
        gameModifiers.MOB_HP_Y,
        gameModifiers.MOB_HP_Z_MIN,
        null // Ezt a calculateValue kezeli úgy, hogy fix Z-t használ a Z_min_or_fixed paraméterrel
    );
    mob.maxMobHpCalculated = calculateValue(
        mob.level,
        gameModifiers.MOB_HP_Y,
        gameModifiers.MOB_HP_Z_MAX,
        null // Hasonlóan, itt is fix Z-t használ
    );
    // Véletlenszerűen kisorsoljuk a mob aktuális HP-ját a min és max között
    mob.maxHp = Math.ceil(Math.random() * (mob.maxMobHpCalculated - mob.minMobHpCalculated) + mob.minMobHpCalculated);
    mob.currentHp = mob.maxHp; // A mob életereje induláskor tele van


    // Mob sebzés számítása
    mob.baseAttack = calculateValue(
        mob.level,
        gameModifiers.MOB_DAMAGE_Y,
        gameModifiers.MOB_DAMAGE_Z_MIN,
        gameModifiers.MOB_DAMAGE_Z_MAX
    );

    // Mob XP jutalom alapértékeinek számítása a skálázáshoz
    mob.minMobXpCalculated = calculateValue(
        mob.level,
        gameModifiers.MOB_XP_Y,
        gameModifiers.MOB_XP_Z_MIN,
        null
    );
    mob.maxMobXpCalculated = calculateValue(
        mob.level,
        gameModifiers.MOB_XP_Y,
        gameModifiers.MOB_XP_Z_MAX,
        null
    );
    // A mob.xpReward-ot majd a handleMobDefeat-ben számoljuk ki a tényleges mob HP alapján

    // Mob Gold jutalom számítása (min és max)
    const minGold = calculateValue(mob.level, gameModifiers.GOLD_DROP_MIN_Y, gameModifiers.GOLD_DROP_MIN_Z);
    const maxGold = calculateValue(mob.level, gameModifiers.GOLD_DROP_MAX_Y, gameModifiers.GOLD_DROP_MAX_Z);
    // Véletlenszerűen választunk a min és max között
    mob.coinReward = Math.ceil(Math.random() * (maxGold - minGold) + minGold);


    appendToLog(`A new ${mob.name} (LV${mob.level}) appeared! HP: ${mob.maxHp}, DMG: ${mob.baseAttack}, XP: ${mob.minMobXpCalculated}-${mob.maxMobXpCalculated}, Gold: ${minGold}-${maxGold}`); // Log frissítése részletesebben
    resetFightDisplay();
    updateUI();
}

// Előző mob generálása (szint csökkentése)
export function prevMob() {
    if (player.level > 1) {
        player.level--;
        nextMob(); // Új mob generálása az új szinten
        appendToLog(`You descended to Level ${player.level}. A new ${mob.name} appeared!`);
    } else {
        appendToLog("Cannot descend below Level 1.");
    }
}

// Játékos statisztikáinak frissítése (szintlépéskor és játék indításakor hívjuk)
export function updatePlayerStats() {
    // Játékos HP (még nincsenek paraméterek, de az univerzális képlet szerint kell majd)
    // Ha majd megadod a PLAYER_HP_Y és Z értékeket, akkor így fog kinézni:
    // player.maxHp = calculateValue(player.level, gameModifiers.PLAYER_HP_Y, gameModifiers.PLAYER_HP_Z);
    
    // IDEIGLENES Játékos HP, amíg nem kapok paramétereket hozzá
    player.maxHp = 100 + (player.level - 1) * 10;
    // Biztosítsuk, hogy a currentHp ne legyen nagyobb a maxHp-nál szintlépéskor
    player.currentHp = Math.min(player.currentHp, player.maxHp);
    if (player.currentHp === 0 || player.currentHp === undefined || isNaN(player.currentHp)) { // Első betöltéskor 0, ha nincs mentett adat, vagy NaN
        player.currentHp = player.maxHp;
    }

    // Játékos támadás (PDF alapján)
    player.baseAttack = calculateValue(
        player.level,
        gameModifiers.PLAYER_DAMAGE_Y,
        gameModifiers.PLAYER_DAMAGE_Z_MIN,
        gameModifiers.PLAYER_DAMAGE_Z_MAX
    );

    // Szükséges XP a következő szintlépéshez (PDF alapján)
    player.expToNextLevel = calculateValue(
        player.level,
        gameModifiers.PLAYER_LVL_UP_EXP_Y,
        gameModifiers.PLAYER_LVL_UP_EXP_Z
    );
    
    // ... további játékos statisztikák (pl. Armor, HealStat, ha szinttől függnek) ...
}

// Szintlépés ellenőrzése
export function checkPlayerLVUp() {
    // Frissítjük a szükséges XP-t, mert az függ a szinttől.
    updatePlayerStats(); // Ezt hívjuk meg előbb, hogy az expToNextLevel frissüljön
    
    if (player.currentExp >= player.expToNextLevel) {
        player.level++;
        player.currentExp -= player.expToNextLevel; // Fennmaradó XP

        appendToLog(`Congratulations! You reached Level ${player.level}!`);
        updatePlayerStats(); // Frissíti a játékos statokat az új szint alapján
        checkPlayerLVUp(); // Rekurzív hívás, ha több szintet léptünk (gyors egymásutáni szintlépés)
    }
}

// Halál kezelése
export function death() {
    appendToLog("Game Over!");
    document.getElementById('deathButton').style.display = 'block';
    toggleGameButtons(false); // Letiltjuk az összes játék gombot halál esetén
}
