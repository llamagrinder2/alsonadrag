// game-calculations.js

import { player, mob, gameModifiers } from './game-state.js';

// Univerzális képlet a szint alapú számításokhoz
// Thing_n = (n + (n * n) / (X - Y)) * Z
export function calculateUniversalValue(n, X, Y, Z) {
    if (X - Y === 0) {
        // Kezeljük az osztást nullával, bár a paraméterek alapján nem kellene előfordulnia
        console.error("Division by zero in calculateUniversalValue! Check X and Y modifiers.");
        return 0;
    }
    return (n + (n * n) / (X - Y)) * Z;
}

// Játékos statisztikáinak kiszámítása
export function calculatePlayerStats() {
    // Player HP
    player.maxHp = gameModifiers.PLAYER_HP_BASE + (player.level * gameModifiers.PLAYER_HP_PER_LEVEL);

    // Player Base Damage
    const minDmg = calculateUniversalValue(
        player.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.PLAYER_DAMAGE_Y,
        gameModifiers.PLAYER_DAMAGE_Z_MIN
    );
    const maxDmg = calculateUniversalValue(
        player.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.PLAYER_DAMAGE_Y,
        gameModifiers.PLAYER_DAMAGE_Z_MAX
    );
    // Kerekítjük a sebzést egész számra
    player.baseAttack = Math.round(Math.random() * (maxDmg - minDmg) + minDmg);

    // Armor (egyelőre fix 0)
    player.armor = 0; // Jelenleg nincs armor számítás
}

// Mob statisztikáinak kiszámítása (ez átkerült a game-logic.js nextMob() függvényébe)
// De a számító függvények megmaradnak itt

// XP a következő szinthez
export function calculateExpToNextLevel() {
    player.expToNextLevel = Math.round(calculateUniversalValue(
        player.level,
        gameModifiers.MAX_LEVEL,
        gameModifiers.PLAYER_LVL_UP_EXP_Y,
        gameModifiers.PLAYER_LVL_UP_EXP_Z
    ));
}

// Megjegyzés: A mob HP, damage, XP és gold számításokat
// a game-logic.js hívja a calculateUniversalValue függvény segítségével,
// de az `import` miatt szükség van erre a fájlra.
