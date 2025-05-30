// game-calculations.js

import { player, mob, gameModifiers } from './game-state.js';

// Univerzális egyenlet minden szint alapú számításhoz
// n: a szint, ami alapján számolunk (player.level vagy player.floorLevel)
// Y_modifier: az Y érték a gameModifiers-ből
// Z_modifier: a Z érték a gameModifiers-ből
export function calculateUniversalValue(n, Y_modifier, Z_modifier) {
    const X = gameModifiers.MAX_LEVEL; // Maximálisan elérhető szint a játékban
    // Hibakezelés: elkerülni az osztást nullával
    if (X - Y_modifier === 0) {
        console.warn("Division by zero avoided in calculateUniversalValue. Check gameModifiers for Y_modifier.");
        return 0; // Vagy valamilyen alapértelmezett érték
    }
    const result = (n + (n * n) / (X - Y_modifier)) * Z_modifier;
    return result;
}

// Játékos statisztikáinak kiszámítása a játékos szintje alapján
export function calculatePlayerStats() {
    const level = player.level;

    // Maximum HP számítás
    player.maxHp = gameModifiers.PLAYER_HP_BASE + level * gameModifiers.PLAYER_HP_PER_LEVEL;
    // player.currentHp csak akkor nőjön max HP-ra, ha szintet lépett VAGY ha még nincs beállítva (initGame)
    if (player.currentHp === 0 || player.currentHp > player.maxHp) { // Kezdeti állapot vagy halál után
        player.currentHp = player.maxHp;
    }

    // Játékos alap támadás számítás (Min és Max DMG közötti átlag)
    const minDmg = calculateUniversalValue(level, gameModifiers.PLAYER_DAMAGE_Y, gameModifiers.PLAYER_DAMAGE_Z_MIN);
    const maxDmg = calculateUniversalValue(level, gameModifiers.PLAYER_DAMAGE_Y, gameModifiers.PLAYER_DAMAGE_Z_MAX);
    player.baseAttack = Math.ceil((minDmg + maxDmg) / 2); // Felfelé kerekítés

    // XP szükséges a következő szinthez
    player.expToNextLevel = Math.ceil(
        calculateUniversalValue(level, gameModifiers.PLAYER_LVL_UP_EXP_Y, gameModifiers.PLAYER_LVL_UP_EXP_Z)
    );
}

// Mob statisztikáinak kiszámítása a torony szintje alapján
export function calculateMobStats(floorLevel) {
    mob.level = floorLevel; // Mob szintje megegyezik a torony szintjével

    // Mob HP számítás (Min és Max HP közötti véletlen érték)
    const minHp = calculateUniversalValue(floorLevel, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MIN);
    const maxHp = calculateUniversalValue(floorLevel, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MAX);
    
    // Mob HP véletlenszerű sorsolása a tartományon belül
    mob.maxHp = Math.ceil(minHp + Math.random() * (maxHp - minHp));
    mob.currentHp = mob.maxHp;

    // Mob alap támadás számítás (Min és Max DMG közötti véletlen érték)
    // Feltételezve, hogy a mob sebzése is az univerzális képlet alapján skálázódik
    const minMobDmg = calculateUniversalValue(floorLevel, gameModifiers.MOB_DAMAGE_Y, gameModifiers.MOB_DAMAGE_Z_MIN);
    const maxMobDmg = calculateUniversalValue(floorLevel, gameModifiers.MOB_DAMAGE_Y, gameModifiers.MOB_DAMAGE_Z_MAX);
    mob.baseAttack = Math.ceil(minMobDmg + Math.random() * (maxMobDmg - minMobDmg));
}

// XP és Arany jutalom kiszámítása a mob HP-ja alapján (interpolációval)
export function calculateExpAndGoldReward() {
    const floorLevel = player.floorLevel;
    const mobHp = mob.maxHp; // A mob generált HP-ja

    // --- XP számítás ---
    const minExp = calculateUniversalValue(floorLevel, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MIN);
    const maxExp = calculateUniversalValue(floorLevel, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MAX);

    // Kiszámolt min/max HP a mob szintjén (ezek kellenek az interpolációhoz)
    const minHpAtFloor = calculateUniversalValue(floorLevel, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MIN);
    const maxHpAtFloor = calculateUniversalValue(floorLevel, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MAX);

    let xpReward = minExp; // Alapértelmezett, ha nincs tartomány
    if (maxHpAtFloor > minHpAtFloor) { // Csak akkor interpolálunk, ha van tartomány
        const deltaExp = (maxExp - minExp) / (maxHpAtFloor - minHpAtFloor);
        // Az n index kiszámítása a mob aktuális HP-ja alapján (a PDF szerint: (MobHP - MinHP) + 1)
        const nIndex = (mobHp - minHpAtFloor) + 1;
        xpReward = minExp + (nIndex - 1) * deltaExp;
    }
    mob.xpReward = Math.ceil(xpReward); // Felfelé kerekítés

    // --- Arany számítás ---
    const minGold = calculateUniversalValue(floorLevel, gameModifiers.GOLD_DROP_MIN_Y, gameModifiers.GOLD_DROP_MIN_Z);
    const maxGold = calculateUniversalValue(floorLevel, gameModifiers.GOLD_DROP_MAX_Y, gameModifiers.GOLD_DROP_MAX_Z);

    let goldReward = minGold; // Alapértelmezett, ha nincs tartomány
    if (maxHpAtFloor > minHpAtFloor) { // Csak akkor interpolálunk, ha van tartomány
        const deltaGold = (maxGold - minGold) / (maxHpAtFloor - minHpAtFloor);
        // Az n index ugyanaz, mint az XP-nél, hiszen ugyanazon a HP-n alapul
        const nIndex = (mobHp - minHpAtFloor) + 1;
        goldReward = minGold + (nIndex - 1) * deltaGold;
    }
    mob.coinReward = Math.ceil(goldReward); // Felfelé kerekítés
}

// Potion árak és gyógyítási értékek kiszámítása a játékos szintje alapján
export function calculatePotionStats(potionLevel) {
    const level = player.level; // Játékos szintje!

    // Kiszámoljuk a játékos szintjéhez tartozó MIN és MAX arany drop átlagát
    // Ezt a mob.coinReward számításhoz használt GOLD_DROP módosítókkal tesszük
    const minGoldAtPlayerLevel = calculateUniversalValue(level, gameModifiers.GOLD_DROP_MIN_Y, gameModifiers.GOLD_DROP_MIN_Z);
    const maxGoldAtPlayerLevel = calculateUniversalValue(level, gameModifiers.GOLD_DROP_MAX_Y, gameModifiers.GOLD_DROP_MAX_Z);
    const averageGoldAtPlayerLevel = (minGoldAtPlayerLevel + maxGoldAtPlayerLevel) / 2;

    let price = 0;
    let healAmount = 0;

    switch (potionLevel) {
        case 1:
            price = Math.ceil(averageGoldAtPlayerLevel * gameModifiers.POTION_PRICE_SCALAR_LV1);
            healAmount = Math.ceil(player.maxHp * gameModifiers.POTION_HEAL_SCALAR_LV1); // Példa: HP százalékos gyógyulás
            break;
        case 2:
            price = Math.ceil(averageGoldAtPlayerLevel * gameModifiers.POTION_PRICE_SCALAR_LV2);
            healAmount = Math.ceil(player.maxHp * gameModifiers.POTION_HEAL_SCALAR_LV2);
            break;
        case 3:
            price = Math.ceil(averageGoldAtPlayerLevel * gameModifiers.POTION_PRICE_SCALAR_LV3);
            healAmount = Math.ceil(player.maxHp * gameModifiers.POTION_HEAL_SCALAR_LV3);
            break;
        default:
            console.warn(`Unknown potion level: ${potionLevel}`);
            break;
    }

    return { price: price, heal: healAmount };
}
