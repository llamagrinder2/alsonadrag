// boss-logic.js
import { mob, gameModifiers } from './game-state.js';
import { updateUI, appendToLog, resetFightDisplay } from './ui-manager.js';
import { nextMob } from './game-logic.js'; // Hogy tudja hívni a következő mobot a boss után

export function bossCountUpdate() {
    if (mob.bossFight === 0) {
        if (mob.bossMax >= mob.level) {
            mob.bossCount = -11111; // Eredeti VBA érték, lehetne 0 vagy más jelentés
            return;
        }

        if (mob.bossCount < mob.bossReq) {
            mob.bossCount++;
            appendToLog(`Mobs defeated: ${mob.bossCount}/${mob.bossReq}`);
            if (mob.bossCount === mob.bossReq) {
                bossButton();
            }
        }
    } else if (mob.bossFight === 1) {
        mob.bossMax++;
        mob.bossFight = 0;
        gameModifiers.mod1 = -4; // Reset mod_1 after boss fight
        appendToLog("Boss defeated! You can now ascend to the next Boss level.");
        nextMob(); // Automatikusan megy a következő mob szintre a boss után
    }
    updateUI();
}

export function bossButton() {
    if (!document.getElementById('bossCallButton')) {
        const bossCallBtn = document.createElement('button');
        bossCallBtn.id = 'bossCallButton';
        bossCallBtn.textContent = 'BossCall';
        document.querySelector('.roll-section').prepend(bossCallBtn);
        bossCallBtn.onclick = bossSummon;
        appendToLog("A Boss has appeared! Prepare for battle!");
    }
}

export function bossSummon() {
    const baseMobMaxHp = mob.maxHp;
    const baseMobMaxCoin = mob.coinReward;

    mob.maxHp = Math.ceil(baseMobMaxHp + (baseMobMaxHp * 0.1));
    mob.currentHp = mob.maxHp;

    gameModifiers.mod1 = -2;
    mob.bossFight = 1;
    mob.xpReward = baseMobMaxHp * 0.1;
    mob.coinReward = Math.ceil(baseMobMaxCoin * 1.5);

    const bossCallBtn = document.getElementById('bossCallButton');
    if (bossCallBtn) {
        bossCallBtn.remove();
    }
    appendToLog("The Boss battle begins!");
    resetFightDisplay();
    updateUI();
}
