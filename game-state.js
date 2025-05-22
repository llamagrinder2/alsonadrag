// game-state.js
// Globális játékállapot változók

export let player = {
    level: 1,
    currentExp: 0,
    maxExp: 100,
    currentHp: 100,
    maxHp: 100,
    attackMultiplier: 10,
    baseAttackMultiplier: 10,
    armor: 0,
    healStat: 1,
    healMultiplier: 5,
    potions: {
        '1': 1,
        '2': 1,
        '3': 1
    },
    bank: 0,
    spellCounter: 0,
    activeSpell: ""
};

export let mob = {
    level: 1,
    currentHp: 50,
    maxHp: 50,
    minHp: 40,
    maxHpRange: 60,
    attackDamage: 5,
    healStat: 1,
    bossMax: 5,
    bossReq: 5,
    bossCount: 0,
    bossFight: 0,
    xpReward: 10,
    coinReward: 5
};

export let gameModifiers = {
    mod1: -4,
    mod2: 1,
    mod3: 1
};

export let shopItems = {
    dagger: { price: 100, bought: false, lockId: 'lock1' },
    leatherVest: { price: 150, bought: false, lockId: 'lock2' },
    whetstone: { price: 50, bought: false, lockId: 'lock3' },
    leather2: { price: 200, bought: false, lockId: 'lock4' }
};

// Visszaállító funkciók (ezt is exportálni kell)
export function resetPlayerState() {
    player = {
        level: 1,
        currentExp: 0,
        maxExp: 100,
        currentHp: 100,
        maxHp: 100,
        attackMultiplier: 10,
        baseAttackMultiplier: 10,
        armor: 0,
        healStat: 1,
        healMultiplier: 5,
        potions: { '1': 1, '2': 1, '3': 1 },
        bank: 0,
        spellCounter: 0,
        activeSpell: ""
    };
}

export function resetMobState() {
    mob = {
        level: 1,
        currentHp: 50,
        maxHp: 50,
        minHp: 40,
        maxHpRange: 60,
        attackDamage: 5,
        healStat: 1,
        bossMax: 5,
        bossReq: 5,
        bossCount: 0,
        bossFight: 0,
        xpReward: 10,
        coinReward: 5
    };
}

export function resetGameModifiers() {
    gameModifiers.mod1 = -4;
}

export function resetShopItems() {
    for (const itemKey in shopItems) {
        shopItems[itemKey].bought = false;
    }
}
