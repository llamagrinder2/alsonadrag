// game-state.js

export const player = {
    level: 1,
    currentExp: 0,
    expToNextLevel: 100, // Kezdeti érték, calculatePlayerStats fogja frissíteni
    maxHp: 100, // Kezdeti érték, calculatePlayerStats fogja frissíteni
    currentHp: 100, // Kezdeti érték, calculatePlayerStats fogja frissíteni
    bank: 0,
    baseAttack: 10, // Kezdeti érték, calculatePlayerStats fogja frissíteni
    armor: 0, // A játékos páncélja megmarad
    potions: {
        1: 1, // Kezdéskor 1 db 1-es szintű poti
        2: 0,
        3: 0
    },
    diceCount: 1,
    lastRollResults: [], // Az egyes dobások eredményei
    lastRollTotal: 0, // A dobások összege
    currentAction: null, // 'attack', 'defend', 'heal'
    floorLevel: 1, // Aktuális torony szint
    baseAttackMultiplier: 1, // Alap támadás szorzó (pl. fegyverektől)
    attackMultiplier: 1, // Effektekkel módosított támadás szorzó
    activeSpells: {
        thirdEye: false, // Third Eye varázslat
        boostSpell: false // Boost Spell varázslat
    }
};

export const mob = {
    name: 'Goblin',
    level: 1,
    maxHp: 10,
    currentHp: 10,
    baseAttack: 2,
    // armor: 0, // <-- ELTÁVOLÍTVA: Mobnak sosem lesz armorja
    diceCount: 1,
    lastRollResults: [],
    lastRollTotal: 0,
    xpReward: 0,
    coinReward: 0,
    predictedAction: '???',
    actionChances: { // Esélyek a mob akciókra
        attack: 70,
        defend: 20,
        heal: 10
    }
};

export const gameModifiers = {
    MAX_LEVEL: 50, // Maximális szint a játékban (X érték)

    // Player Statisztikák (Universal Equation)
    PLAYER_HP_BASE: 50,
    PLAYER_HP_PER_LEVEL: 10,
    PLAYER_DAMAGE_Y: 1.5,
    PLAYER_DAMAGE_Z_MIN: 2,
    PLAYER_DAMAGE_Z_MAX: 12,
    PLAYER_LVL_UP_EXP_Y: 42, // XP a szintlépéshez
    PLAYER_LVL_UP_EXP_Z: 2,

    // Mob Statisztikák (Universal Equation)
    MOB_HP_Y: 46.2,
    MOB_HP_Z_MIN: 16,
    MOB_HP_Z_MAX: 40,
    MOB_DAMAGE_Y: 48,
    MOB_DAMAGE_Z_MIN: 0.5,
    MOB_DAMAGE_Z_MAX: 3,
    MOB_XP_Y: 42,
    MOB_XP_Z_MIN: 1,
    MOB_XP_Z_MAX: 3,
    GOLD_DROP_MIN_Y: 49.98,
    GOLD_DROP_MIN_Z: 0.04,
    GOLD_DROP_MAX_Y: 49.99,
    GOLD_DROP_MAX_Z: 0.08,

    // Potion Modifierek
    POTION_PRICE_SCALAR_LV1: 0.5,
    POTION_PRICE_SCALAR_LV2: 1.5,
    POTION_PRICE_SCALAR_LV3: 3,
    POTION_HEAL_SCALAR_LV1: 0.2, // Max HP 20%-a
    POTION_HEAL_SCALAR_LV2: 0.5, // Max HP 50%-a
    POTION_HEAL_SCALAR_LV3: 1, // Max HP 100%-a

    // Harc modifierek
    DICE_MAX_VALUE: 6, // Kocka maximum értéke
    DEFEND_DAMAGE_REDUCTION_PERCENT: 0.5, // Védekezéskor 50% sebzéscsökkentés
    HEAL_BASE_AMOUNT: 5, // A mob gyógyításának alapértéke

    // Spellek
    THIRD_EYE_PRICE: 10, // Arany költsége
    BOOST_SPELL_PRICE: 20, // Arany költsége
    BOOST_SPELL_MULTIPLIER: 0.2 // 20% támadás bónusz
};

export const shopItems = {
    bronzeSword: {
        id: 'bronzeSword',
        name: 'Bronz Kard',
        price: 50,
        unlocked: false,
        effect: { attackMultiplier: 0.1 } // +10% támadás
    },
    woodenShield: {
        id: 'woodenShield',
        name: 'Fa Pajzs',
        price: 30,
        unlocked: false,
        effect: { armor: 5 } // +5 páncél
    },
    whetstone: {
        id: 'whetstone',
        name: 'Élezőkő',
        price: 75,
        unlocked: false,
        effect: { attackMultiplier: 0.05 } // +5% támadás
    },
    leather2: {
        id: 'leather2',
        name: 'Bőr Páncélzat II',
        price: 60,
        unlocked: false,
        effect: { armor: 8 } // +8 páncél
    }
    // További itemek hozzáadhatók itt
};

// Shop itemek visszaállítása
export function resetShopItems() {
    for (const itemId in shopItems) {
        if (shopItems.hasOwnProperty(itemId)) {
            shopItems[itemId].unlocked = false;
        }
    }
}
