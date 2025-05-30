// game-state.js

export const player = {
    level: 1, // Kezdő szint
    currentExp: 0,
    expToNextLevel: 0, // Ezt is számolni kell
    maxHp: 0, // Ezt is számolni kell
    currentHp: 0,
    baseAttack: 0, // Ezt is számolni kell (Játékos sebzése)
    attackMultiplier: 1,
    baseAttackMultiplier: 1, // Boost spell miatt
    armor: 0,
    healStat: 5,
    potions: { 1: 1, 2: 1, 3: 1 },
    bank: 0,
    activeSpells: {
        thirdEye: false,
        boostSpell: false
    },
    // ÚJ: Kockadobás adatok a játékosnak
    diceCount: 2, // Játékos 2 kockával dob
    lastRollResults: [], // Itt tároljuk a játékos utolsó dobásainak eredményét
    currentAction: null // Tárolja a játékos választott akcióját (Attack, Defend, Heal)
};

export const mob = {
    name: "Goblin", // Példa
    level: 0, // Ezt a player.level alapján fogjuk beállítani
    maxHp: 0, // Ezt is számolni kell
    currentHp: 0,
    baseAttack: 0, // Ezt is számolni kell (MobDamage)
    armor: 0,
    xpReward: 0, // Ezt is számolni kell (a PDF alapján finomhangolva)
    coinReward: 0, // Ezt is számolni kell
    // Az XP elosztáshoz szükséges, a mob generálásakor kiszámolt alapértékek
    minMobHpCalculated: 0,
    maxMobHpCalculated: 0,
    minMobXpCalculated: 0,
    maxMobXpCalculated: 0,
    // ÚJ: Kockadobás adatok a mobnak
    diceCount: 4, // Mob 4 kockával dob
    lastRollResults: [], // Itt tároljuk a mob utolsó dobásainak eredményét
    predictedAction: null, // ÚJ: A mob által választott akció (Attack, Defend, Heal)
    // ÚJ: Mob akciók esélyei (százalékban)
    actionChances: {
        attack: 60, // 60% esély a támadásra
        defend: 25, // 25% esély a védekezésre
        heal: 15    // 15% esély a gyógyításra
    }
};

export const gameModifiers = {
    MAX_LEVEL: 50, // Az X érték minden számításhoz

    // Mob HP
    MOB_HP_Y: 46.2,
    MOB_HP_Z_MIN: 16,
    MOB_HP_Z_MAX: 40,

    // Mob Damage
    MOB_DAMAGE_Y: 0, // A PDF szerint Y = 0
    MOB_DAMAGE_Z_MIN: 2,
    MOB_DAMAGE_Z_MAX: 12,

    // Player Base Damage (ÚJ, a PDF alapján)
    PLAYER_DAMAGE_Y: 1.5,
    PLAYER_DAMAGE_Z_MIN: 2,
    PLAYER_DAMAGE_Z_MAX: 12,

    // Exp for mob (XP Reward)
    MOB_XP_Y: 42,
    MOB_XP_Z_MIN: 1,
    MOB_XP_Z_MAX: 3,

    // Gold Drop Minimum (Y érték pontosítva a legutolsó kérésed szerint)
    GOLD_DROP_MIN_Y: 49.9899979,
    GOLD_DROP_MIN_Z: 0.04,

    // Gold Drop Maximum (Y érték pontosítva a legutolsó kérésed szerint)
    GOLD_DROP_MAX_Y: 49.97999,
    GOLD_DROP_MAX_Z: 0.08,

    // Exp for player LVL up (Exp To Next Level)
    PLAYER_LVL_UP_EXP_Y: 49,
    PLAYER_LVL_UP_EXP_Z: 10,

    // Potion árak (ezekről még nem kaptunk Y és Z paramétereket, fix értékek, ha nem az univerzális képlet szerint számolódnak)
    POTION_LV1_PRICE: 20,
    POTION_LV2_PRICE: 40,
    POTION_LV3_PRICE: 80,

    // Player HP (ezekről még nem kaptunk Y és Z paramétereket, addig is alapértelmezett)
    // IDEIGLENES, amíg nem kapunk paramétereket
    PLAYER_HP_BASE: 100,
    PLAYER_HP_PER_LEVEL: 10,

    // További módosítók (pl. kockadobás maximum értéke)
    DICE_MAX_VALUE: 6, // *** EZT VÁLTOZTATTAM MEG 10-RŐL 6-RA! ***

    // Védekezés / Gyógyítás mechanika módosítók
    DEFEND_DAMAGE_REDUCTION_PERCENT: 0.5, // 50% sebzéscsökkentés védekezéskor
    HEAL_POTION_HEAL_AMOUNT: { // Poti gyógyítás mennyisége
        1: 20,
        2: 40,
        3: 80
    },
    HEAL_BASE_AMOUNT: 5, // Alap gyógyítás (ha nincs poti)
};

export const shopItems = {
    dagger: {
        name: "Dagger",
        price: 100,
        unlocked: false,
        effect: { attack: 5 } // Példa: +5 ATK
    },
    leatherVest: {
        name: "Leather Vest",
        price: 150,
        unlocked: false,
        effect: { armor: 0.1 } // Példa: +0.1 ARMOR
    },
    whetstone: {
        name: "Whetstone",
        price: 50,
        unlocked: false,
        effect: { attack: 2 } // Példa: +2 ATK
    },
    leather2: {
        name: "Leather Vest 2",
        price: 200,
        unlocked: false,
        effect: { armor: 0.2 } // Példa: +0.2 ARMOR
    }
};

export function resetShopItems() {
    for (const key in shopItems) {
        shopItems[key].unlocked = false;
    }
}
