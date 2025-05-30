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
    // Csak akkor állítjuk be currentHp-t maxHp-ra, ha meghalt, vagy most indul a játék.
    // Szintlépéskor az életerő nem áll vissza teljesen.
    if (player.currentHp <= 0 || player.currentHp > player.maxHp) { // Ha 0 vagy negatív, vagy valamiért a max felett van (nem szabadna)
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
    // Először kiszámoljuk a min és max HP-t a floorLevel-hez, majd ebből generálunk egy randomot
    const minHpAtFloor = calculateUniversalValue(floorLevel, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MIN);
    const maxHpAtFloor = calculateUniversalValue(floorLevel, gameModifiers.MOB_HP_Y, gameModifiers.MOB_HP_Z_MAX);
    
    // Mob HP véletlenszerű sorsolása a tartományon belül
    mob.maxHp = Math.ceil(minHpAtFloor + Math.random() * (maxHpAtFloor - minHpAtFloor));
    mob.currentHp = mob.maxHp;

    // Mob alap támadás számítás (Min és Max DMG közötti véletlen érték)
    const minMobDmg = calculateUniversalValue(floorLevel, gameModifiers.MOB_DAMAGE_Y, gameModifiers.MOB_DAMAGE_Z_MIN);
    const maxMobDmg = calculateUniversalValue(floorLevel, gameModifiers.MOB_DAMAGE_Y, gameModifiers.MOB_DAMAGE_Z_MAX);
    mob.baseAttack = Math.ceil(minMobDmg + Math.random() * (maxMobDmg - minMobDmg));

    // XP és Arany jutalom előzetes számítása a mob generált HP-jához,
    // eltároljuk a mob objektumban, hogy később ne kelljen újra számolni.
    // EZ A KULCS a PDF-ben leírt Delta képlet pontos implementálásához!
    calculateExpAndGoldRewardForMob(floorLevel, mob.maxHp, minHpAtFloor, maxHpAtFloor);
}

// XP és Arany jutalom kiszámítása a mob HP-ja alapján (interpolációval)
// Ez a függvény most már belső, és a calculateMobStats hívja meg
export function calculateExpAndGoldRewardForMob(floorLevel, mobActualHp, minHpAtFloor, maxHpAtFloor) {
    // --- XP számítás ---
    const minExp = calculateUniversalValue(floorLevel, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MIN);
    const maxExp = calculateUniversalValue(floorLevel, gameModifiers.MOB_XP_Y, gameModifiers.MOB_XP_Z_MAX);

    mob.minMobXpCalculated = Math.ceil(minExp); // Eltároljuk a mob.minMobXpCalculated-ban
    mob.maxMobXpCalculated = Math.ceil(maxExp); // Eltároljuk a mob.maxMobXpCalculated-ban

    let xpReward = minExp; 
    if (maxHpAtFloor > minHpAtFloor) { // Csak akkor interpolálunk, ha van tartomány
        const deltaExp = (maxExp - minExp) / (maxHpAtFloor - minHpAtFloor);
        // Az n index kiszámítása a mob aktuális HP-ja alapján (a PDF szerint: (MobHP - MinHP) + 1)
        const nIndexForHp = (mobActualHp - minHpAtFloor) + 1;
        xpReward = minExp + (nIndexForHp - 1) * deltaExp;
    }
    mob.xpReward = Math.ceil(xpReward); // Felfelé kerekítés

    // --- Arany számítás ---
    const minGold = calculateUniversalValue(floorLevel, gameModifiers.GOLD_DROP_MIN_Y, gameModifiers.GOLD_DROP_MIN_Z);
    const maxGold = calculateUniversalValue(floorLevel, gameModifiers.GOLD_DROP_MAX_Y, gameModifiers.GOLD_DROP_MAX_Z);

    mob.minMobGoldCalculated = Math.ceil(minGold); // Eltároljuk a mob.minMobGoldCalculated-ban
    mob.maxMobGoldCalculated = Math.ceil(maxGold); // Eltároljuk a mob.maxMobGoldCalculated-ban

    let goldReward = minGold; 
    if (maxHpAtFloor > minHpAtFloor) { // Csak akkor interpolálunk, ha van tartomány
        const deltaGold = (maxGold - minGold) / (maxHpAtFloor - minHpAtFloor);
        // Az n index ugyanaz, mint az XP-nél, hiszen ugyanazon a HP-n alapul
        const nIndexForHp = (mobActualHp - minHpAtFloor) + 1;
        goldReward = minGold + (nIndexForHp - 1) * deltaGold;
    }
    mob.coinReward = Math.ceil(goldReward); // Felfelé kerekítés
}

// Potion árak és gyógyítási értékek kiszámítása a játékos szintje alapján
export function calculatePotionStats(potionLevel) {
    const level = player.level; // Játékos szintje!

    // A PDF nem specifikálta a POTION_PRICE_Y-t, így a legközelebbi GOLD_DROP_Y-t használom.
    // Ez egy feltételezés. Ha van konkrét Y érték a potik árához, azt kellene használni.
    const averageGoldAtPlayerLevel = calculateUniversalValue(
        level, 
        gameModifiers.GOLD_DROP_MIN_Y, // Feltételezve, hogy a potion árak Y-ja megegyezik az arany drop Y-jával
        (gameModifiers.GOLD_DROP_MIN_Z + gameModifiers.GOLD_DROP_MAX_Z) / 2 // Átlag Z az arany drop Z-kből
    );

    let price = 0;
    let healAmount = 0;

    switch (potionLevel) {
        case 1:
            price = Math.ceil(averageGoldAtPlayerLevel * gameModifiers.POTION_PRICE_SCALAR_LV1);
            healAmount = Math.ceil(player.maxHp * gameModifiers.POTION_HEAL_SCALAR_LV1); 
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

// Sebzés számítása (baseAttack + totalDiceRoll * attackMultiplier - targetArmor)
export function calculateDamage(baseAttack, totalDiceRoll, attackMultiplier, targetArmor) {
    // A játékos támadás szorzója (baseAttackMultiplier) is beleszámít
    let calculatedAttack = baseAttack * player.baseAttackMultiplier; // Játékos alap támadás szorzója
    
    // Boost Spell hatása, ha aktív
    if (player.activeSpells.boostSpell) {
        calculatedAttack *= (1 + gameModifiers.BOOST_SPELL_MULTIPLIER);
    }
    
    // A kockadobás és az attackMultiplier (ideiglenes varázslatok, stb.)
    let damage = (calculatedAttack + totalDiceRoll) * attackMultiplier - targetArmor;
    
    return Math.max(0, Math.round(damage)); // Sebzés nem lehet negatív, felfelé kerekítve
}
