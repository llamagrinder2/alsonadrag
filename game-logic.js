// game-logic.js
import { player, mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, resetFightDisplay, toggleGameButtons } from './ui-manager.js';
import { bossCountUpdate, bossButton, bossSummon } from './boss-logic.js';
import { createHealingButtons } from './healing.js';
import { endThirdEye } from './spells.js';

function calculateDamage(baseDamage, armor = 0) {
    return Math.max(0, baseDamage - baseDamage * armor);
}

export function checkPlayerLVUp() {
    if (player.currentExp >= player.maxExp) {
        if (!document.getElementById('levelUpButton')) {
            const levelUpBtn = document.createElement('button');
            levelUpBtn.id = 'levelUpButton';
            levelUpBtn.textContent = 'Level up!';
            levelUpBtn.onclick = playerLVUp2;
            document.querySelector('.level-navigation').appendChild(levelUpBtn);
            appendToLog("You have enough experience to level up!");
        }
    }
}

export function playerLVUp2() {
    player.level++;
    appendToLog(`You leveled up to level ${player.level}!`);
    player.currentExp = 0;
    player.maxExp = Math.ceil(player.maxExp * 1.2);
    player.currentHp = player.maxHp;
    player.attackMultiplier = player.baseAttackMultiplier;
    player.potions['1']++;
    player.potions['2']++;
    player.potions['3']++;

    const levelUpBtn = document.getElementById('levelUpButton');
    if (levelUpBtn) {
        levelUpBtn.remove();
    }
    updateUI();
}

export function nextMob() {
    if (mob.bossMax < mob.level) {
        alert("Cannot ascend until the Boss is defeated!");
        return;
    }
    mob.level++;
    mob.maxHp = Math.ceil(mob.minHp + Math.random() * (mob.maxHpRange - mob.minHp));
    mob.currentHp = mob.maxHp;
    appendToLog(`Next mob! Level: ${mob.level}`);

    if (mob.bossMax > (mob.level - 1)) {
        mob.bossCount = -11111;
    } else {
        mob.bossCount = 0;
    }

    resetFightDisplay();
    updateUI();
}

export function prevMob() {
    if (mob.level === 1) return;

    mob.level--;
    mob.maxHp = Math.ceil(mob.minHp + Math.random() * (mob.maxHpRange - mob.minHp));
    mob.currentHp = mob.maxHp;
    appendToLog(`Previous mob! Level: ${mob.level}`);

    if (mob.bossCount >= -(mob.level)) {
         mob.bossCount = -11111;
    }
    resetFightDisplay();
    updateUI();
}

export function diceRoll() {
    resetFightDisplay(); // Törli az előző rollt és sebzéseket

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const mDie1 = Math.floor(Math.random() * 6) + 1;
    const mDie2 = Math.floor(Math.random() * 6) + 1;
    const mDie3 = Math.floor(Math.random() * 6) + 1;
    const mDie4 = Math.floor(Math.random() * 6) + 1;

    const sumRoll = die1 + die2;
    const sumEnemyRoll = mDie1 + mDie2 + mDie3 + mDie4;

    document.getElementById('playerRollResult').textContent = sumRoll;
    document.getElementById('mobRollResult').textContent = sumEnemyRoll;

    let mobFinalAttack = (sumEnemyRoll + gameModifiers.mod1) * gameModifiers.mod2;
    let mobFinalHeal = (sumEnemyRoll + gameModifiers.mod1) * gameModifiers.mod3;

    let playerFinalAttack = sumRoll * player.attackMultiplier;

    document.getElementById('playerDamageDisplay').textContent = `Your potential ATK: ${Math.ceil(playerFinalAttack)}`;
    document.getElementById('mobDamageDisplay').textContent = `Mob potential ATK/HEAL: ${Math.ceil(mobFinalAttack)}`;

    if (player.spellCounter > 0) {
        player.spellCounter--;
        if (player.activeSpell === "Boost") {
            player.attackMultiplier *= 1.1;
            appendToLog(`Boost active! Attack increased to ${player.attackMultiplier.toFixed(2)}.`);
        }

        if (player.spellCounter === 0) {
            if (player.activeSpell === "Third Eye") {
                endThirdEye();
            } else if (player.activeSpell === "Boost") {
                player.attackMultiplier = player.baseAttackMultiplier;
                appendToLog("Boost effect ended. Attack returned to normal.");
            }
            player.activeSpell = "";
        }
    }

    appendToLog(`You rolled ${sumRoll}. The enemy rolled ${sumEnemyRoll}.`);

    createHealingButtons(); // Megjeleníti a gyógyító gombokat
    updateUI();
}

export function performAttack() {
    const playerAttackDamage = parseFloat(document.getElementById('playerRollResult').textContent) * player.attackMultiplier;
    const mobRollResult = parseFloat(document.getElementById('mobRollResult').textContent);
    const mobAttackDamageBase = (mobRollResult + gameModifiers.mod1) * gameModifiers.mod2;
    const mobHealAmountBase = (mobRollResult + gameModifiers.mod1) * gameModifiers.mod3;

    let actualMobDamage = calculateDamage(mobAttackDamageBase, player.armor);

    const actionRoll = Math.floor(Math.random() * 100) + 1;
    let mobAction = "";

    if (mob.currentHp <= mob.maxHp * 0.35) {
        if (actionRoll < 17) {
            mobAction = "HEAL";
        } else if (actionRoll <= 45) {
            mobAction = "DEF";
        } else {
            mobAction = "ATK";
        }
    } else {
        if (actionRoll > 30) {
            mobAction = "ATK";
        } else {
            mobAction = "DEF";
        }
    }

    let playerDamageTaken = 0;
    let mobHealed = 0;

    // Player támad
    mob.currentHp -= playerAttackDamage;
    showFloatingText(document.querySelector('.mob-hp-bar'), `-${Math.ceil(playerAttackDamage)} HP`, 'red');
    appendToLog(`You dealt ${Math.ceil(playerAttackDamage)} damage.`);

    // Mob akciója
    switch (mobAction) {
        case "ATK":
            player.currentHp -= actualMobDamage;
            playerDamageTaken = actualMobDamage;
            showFloatingText(document.querySelector('.player-hp-bar'), `-${Math.ceil(actualMobDamage)} HP`, 'orange');
            appendToLog(`Mob dealt ${Math.ceil(playerDamageTaken)} damage.`);
            break;
        case "DEF":
            mob.currentHp += (mob.maxHp * 0.01);
            mobHealed = mob.maxHp * 0.01;
            mob.currentHp = Math.min(mob.currentHp, mob.maxHp);
            showFloatingText(document.querySelector('.mob-hp-bar'), `+${Math.ceil(mobHealed)} HP`, 'green');
            appendToLog(`Mob chose to DEFEND and healed ${Math.ceil(mobHealed)} HP.`);
            break;
        case "HEAL":
            mob.currentHp += mobHealAmountBase;
            mobHealed = mobHealAmountBase;
            mob.currentHp = Math.min(mob.currentHp, mob.maxHp);
            showFloatingText(document.querySelector('.mob-hp-bar'), `+${Math.ceil(mobHealed)} HP`, 'green');
            appendToLog(`Mob chose to HEAL and restored ${Math.ceil(mobHealed)} HP.`);
            break;
    }

    appendToLog(`Mob's action: ${mobAction}`);

    // Ellenőrzések (halál, mob legyőzés)
    if (player.currentHp < 1) {
        player.currentHp = 0;
        death();
        updateUI();
        return;
    }

    if (mob.currentHp < 1) {
        mob.currentHp = 0;
        appendToLog(`You defeated the mob! You gained ${mob.xpReward} XP and ${mob.coinReward} Gold.`);
        player.currentExp += mob.xpReward;
        player.bank += mob.coinReward;
        bossCountUpdate();

        checkPlayerLVUp();
    }

    resetFightDisplay(); // Törli a sebzéskijelzőket
    updateUI();
}

export function death() {
    appendToLog("YOU DIED!");
    toggleGameButtons(false); // Letilt minden játék gombot
    document.getElementById('deathButton').style.display = 'flex';
}

export function resetGame() {
    // Ezeket a game-state.js-ből importált reset fv-ek hívják
    // Itt hívja meg a main.js a resetGame.

    // A deathButton onclick eseményére rá van kötve.
    // Így ha a halál gombra kattintunk, minden visszaáll.
}
