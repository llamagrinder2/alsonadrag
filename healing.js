// healing.js
import { player, mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, showFloatingText, resetFightDisplay } from './ui-manager.js';
import { bossCountUpdate, checkPlayerLVUp, death } from './game-logic.js'; // Import death


const healingButtonsContainer = document.getElementById('healingButtonsContainer');

export function usePotion(potionLevel) {
    let healingMultiplier = 0;

    switch (potionLevel) {
        case 1: healingMultiplier = 0.0223; break;
        case 2: healingMultiplier = 0.0242; break;
        case 3: healingMultiplier = 0.0311; break;
        default: console.error("Invalid potion level"); return;
    }

    if (player.potions[potionLevel] === 0) {
        alert("No potions available!");
        return;
    }

    player.potions[potionLevel]--;
    const playerHealAmount = (player.healStat + 4) * (player.maxHp * healingMultiplier);

    // Mob akció (ismétlés, mert a gyógyítás külön kör)
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

    const mobRollResult = parseFloat(document.getElementById('mobRollResult').textContent);
    const mobAttackDamageBase = (mobRollResult + gameModifiers.mod1) * gameModifiers.mod2;
    const mobHealAmountBase = (mobRollResult + gameModifiers.mod1) * gameModifiers.mod3;
    let actualMobDamage = calculateDamage(mobAttackDamageBase, player.armor);

    let mobHealed = 0;
    let playerDamageTaken = 0;

    // Player gyógyítása
    player.currentHp += playerHealAmount;
    player.currentHp = Math.min(player.currentHp, player.maxHp);
    showFloatingText(document.querySelector('.player-hp-bar'), `+${Math.ceil(playerHealAmount)} HP`, 'rgb(84, 134, 53)');
    appendToLog(`You used Potion LV${potionLevel} and healed ${Math.ceil(playerHealAmount)} HP.`);

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

    // Check Death (player first)
    if (player.currentHp < 1) {
        player.currentHp = 0;
        death();
        updateUI();
        return;
    }

    // Check Mob Death
    if (mob.currentHp < 1) {
        mob.currentHp = 0;
        appendToLog(`You defeated the mob! You gained ${mob.xpReward} XP and ${mob.coinReward} Gold.`);
        player.currentExp += mob.xpReward;
        player.bank += mob.coinReward;
        bossCountUpdate();
        checkPlayerLVUp();
    }

    resetFightDisplay();
    updateUI();
}

export function createHealingButtons() {
    healingButtonsContainer.innerHTML = '';

    const potionLevels = [1, 2, 3];
    potionLevels.forEach(level => {
        const btn = document.createElement('button');
        btn.textContent = `LV${level} Potion (${player.potions[level]})`;
        btn.id = `healing${level}Btn`;
        btn.onclick = () => usePotion(level);
        btn.disabled = player.potions[level] === 0; // Letiltja, ha nincs poti
        healingButtonsContainer.appendChild(btn);
    });

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.id = 'cancelHealingBtn';
    cancelButton.onclick = cancelHealing;
    healingButtonsContainer.appendChild(cancelButton);
}

export function cancelHealing() {
    healingButtonsContainer.innerHTML = '';
    resetFightDisplay();
    updateUI();
}

function calculateDamage(baseDamage, armor = 0) { // Duplikált, de a modulon belül maradhat
    return Math.max(0, baseDamage - baseDamage * armor);
}
