// game-state.js

export const player = {
    level: 1,
    currentExp: 0,
    expToNextLevel: 100, // Kezdeti érték, calculateExpToNextLevel felülírja
    maxHp: 100,
    currentHp: 100,
    baseAttack: 0, // Ezt a calculatePlayerStats fogja beállítani
    attackMultiplier: 1, // Aktív bónuszok miatt változhat
    baseAttackMultiplier: 1, // Alap attack multiplier (shop itemek növelhetik)
    armor: 0,
    bank: 0,
    potions: {
        1: 1, // Potion LV1: 1 darab
        2: 0, // Potion LV2: 0 darab
        3: 0  // Potion LV3: 0 darab
    },
    activeSpells: {
        thirdEye: false, // Jelenleg inaktív
        boostSpell: false // Jelenleg inaktív
    },
    lastRollResults: [], // A dobott kockák egyesével (pl. [3, 5])
    lastRollTotal: 0, // ÚJ: A dobások összege (pl. 8)
    currentAction: null, // "attack", "defend", "heal"
    floorLevel: 1, // ÚJ: Kezdeti torony szint
    diceCount: 2 // ÚJ: Játékos 2 kockával dob
};

export const mob = {
    name: "Goblin",
    level: 1, // Ez a torony szintjével fog megegyezni
    maxHp: 50,
    currentHp: 50,
    baseAttack: 5, // Ezt a calculateMobStats fogja beállítani
    xpReward: 0,
    coinReward: 0,
    minMobXpCalculated: 0, // A FloorLV alapján számolt min XP
    maxMobXpCalculated: 0, // A FloorLV alapján számolt max XP
    minMobGoldCalculated: 0, // A FloorLV alapján számolt min Gold (ÚJ)
    maxMobGoldCalculated: 0, // A FloorLV alapján számolt max Gold (ÚJ)
    actionChances: { // Százalékos esélyek a mob akciójára
        attack: 60,
        defend: 25,
        heal: 15
    },
    predictedAction: '???',
    diceCount: 4, // Mob kockák száma (a PDF szerint 4)
    lastRollResults: [], // A dobott kockák egyesével (pl. [1, 2, 3, 4])
    lastRollTotal: 0 // ÚJ: A dobások összege (pl. 10)
};

// Játék módosítók és konstansok
export const gameModifiers = {
    MAX_LEVEL: 50, // Maximálisan elérhető szint a játékban (X érték a képletben)

    // Játékos statisztika módosítók (n = player.level)
    PLAYER_HP_BASE: 100,
    PLAYER_HP_PER_LEVEL: 10,
    PLAYER_DAMAGE_Y: 1.5,
    PLAYER_DAMAGE_Z_MIN: 2,
    PLAYER_DAMAGE_Z_MAX: 12,
    PLAYER_LVL_UP_EXP_Y: 42, // Ez az XP képletben használt Y
    PLAYER_LVL_UP_EXP_Z: 50, // Ez az XP képletben használt Z

    // Mob statisztika módosítók (n = floorLevel)
    MOB_HP_Y: 46.2,
    MOB_HP_Z_MIN: 16,  
    MOB_HP_Z_MAX: 40,  
    MOB_DAMAGE_Y: 47, // Példa érték (ha a PDF nem specifikálta, ez csak egy feltételezés)
    MOB_DAMAGE_Z_MIN: 1, // Példa érték
    MOB_DAMAGE_Z_MAX: 3, // Példa érték

    // XP drop módosítók (n = floorLevel)
    MOB_XP_Y: 42,  
    MOB_XP_Z_MIN: 1,  
    MOB_XP_Z_MAX: 3,  

    // Arany drop módosítók (n = floorLevel) - FRISSÍTVE a legutóbbi pontosítás szerint
    GOLD_DROP_MIN_Y: 49.97999,  
    GOLD_DROP_MIN_Z: 0.04,  
    GOLD_DROP_MAX_Y: 49.9899979,  
    GOLD_DROP_MAX_Z: 0.08,  

    // Potion árak és gyógyítási módosítók (n = player.level) - FRISSÍTVE
    POTION_PRICE_SCALAR_LV1: 0.83, // Ezek a PDF szerint a Z értékek az ár képletében
    POTION_PRICE_SCALAR_LV2: 2,
    POTION_PRICE_SCALAR_LV3: 5.33,
    POTION_PRICE_Y: 49.9, // Példa Y érték a potion ár képletéhez (ha a PDF nem specifikálja)
    
    POTION_HEAL_SCALAR_LV1: 0.5, // Ezek valószínűleg arányok, amiket a gyógyítási képletben használnak
    POTION_HEAL_SCALAR_LV2: 1.5,
    POTION_HEAL_SCALAR_LV3: 3.0,

    // Egyéb mechanikák
    DICE_MAX_VALUE: 6, // Kocka maximális értéke (pl. D6)
    DEFEND_DAMAGE_REDUCTION_PERCENT: 0.5, // 50% sebzéscsökkentés védekezéskor
    HEAL_BASE_AMOUNT: 5, // Mob gyógyulás alapértéke

    // Spell adatok
    THIRD_EYE_BOOST: 10, // Kocka dobás bónusz (fix érték) - Ez valószínűleg `player.diceCount`-ot módosítja átmenetileg
    THIRD_EYE_PRICE: 200, // Arany költség (ez is dinamikus lehetne, de most fix)
    BOOST_SPELL_MULTIPLIER: 0.2, // +20% sebzés
    BOOST_SPELL_PRICE: 300 // Arany költség (ez is dinamikus lehetne, de most fix)
};

export const shopItems = {
    // Felszerelés (Példa)
    bronzeSword: {
        name: "Bronze Sword",
        price: 150,
        effect: { attackMultiplier: 0.1 }, // +10% attack multiplier
        unlocked: false
    },
    woodenShield: {
        name: "Wooden Shield",
        price: 100,
        effect: { armor: 5 }, // +5 armor
        unlocked: false
    },
    whetstone: { // Feltételezzük, hogy ez is shopItem
        name: "Whetstone",
        price: 50,
        effect: { attackMultiplier: 0.05 }, // Példa: +5% attack multiplier
        unlocked: false
    },
    leather2: { // Feltételezzük, hogy ez is shopItem
        name: "Leather Vest 2",
        price: 200,
        effect: { armor: 5 }, // +5 armor
        unlocked: false
    }
    // Itt nincsenek a potionok, mert azok árát dinamikusan számoljuk és nem 'felszerelés' típusúak
};

// Shop elemek alapállapotba állítása
export function resetShopItems() {
    for (const key in shopItems) {
        if (Object.hasOwnProperty.call(shopItems, key)) { // Biztonságosabb iterálás
            shopItems[key].unlocked = false;
        }
    }
}
