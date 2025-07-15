import { world, Player, EntityHealthComponent } from '@minecraft/server';
import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerCPS } from "cps";

const defaultKb = 0.37;
let customKb = 0;
let knockbackEnabled = true;
let counterEnabled = true;

function subtitle(msg, player) {
    return player.runCommandAsync(`titleraw @s actionbar {"rawtext":[{"text":${JSON.stringify(msg)}}]}`);
};

function message(msg, player) {
    return player.runCommandAsync(`tellraw @s {"rawtext":[{"text":${JSON.stringify(msg)}}]}`);
};

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
    if (damageSource.damagingEntity) {
        let health = hurtEntity.getComponent(EntityHealthComponent.componentId);
        if (counterEnabled) {
            subtitle(`§l§aCPS§e: §b${getPlayerCPS(damageSource.damagingEntity)}§e, §dTarget Health§e: §c${health.currentValue.toFixed(1)}`, damageSource.damagingEntity);
        };
        if (knockbackEnabled) {
            hurtEntity.applyKnockback(0, 0, defaultKb + customKb, defaultKb + customKb);
        };
    }
});

const gui = new ActionFormData();
gui.title('§l§bKnockback Settings');
gui.body('§l§fActions:');
gui.button('§l§aEnable Knockback');
gui.button('§l§cDisable Knockback');
gui.button('§l§eIncrease Height');
gui.button('§l§eDecrease Height');
gui.button('§l§eReset Height');
gui.button('§l§dToggle CPS/Health counter');
gui.button('§l§bTo the air!');

world.afterEvents.itemUse.subscribe(data => {
    const source = data.source
    if (!(source instanceof Player)) return;
    if (data.itemStack.typeId === 'kb:knockback_settings') gui.show(source).then(result => {
        if (result.selection === 0) { knockbackEnabled = true; message(`§e[§cKB§e]§a Knockback has been enabled§e.§r`, source); };
        if (result.selection === 1) { knockbackEnabled = false; message(`§e[§cKB§e]§c Knockback has been disabled§e.§r`, source); };
        if (result.selection === 2) { customKb += 0.01; message(`§e[§cKB§e]§b Extra knockback height has been increased to ${customKb.toFixed(2)}§e.§r`, source); };
        if (result.selection === 3) { if (customKb > -0.1) { customKb += -0.01; message(`§e[§cKB§e]§b Extra knockback height has been decreased to ${customKb.toFixed(2)}§e.§r`, source); } else { message(`§e[§cKB§e]§c Knockback height is already at the minimum value§e.§r`, source); }; };
        if (result.selection === 4) { customKb = 0; message(`§e[§cKB§e]§a Extra knockback height was set to default§e.`, source); };
        if (result.selection === 5) { if (counterEnabled) { counterEnabled = false; message(`§e[§cKB§e]§c CPS/Health counter has been disabled§e.§r`, source); } else { counterEnabled = true; message(`§e[§cKB§e]§a CPS/Health counter has been enabled§e.§r`, source); } };
        if (result.selection === 6) { source.applyKnockback(0, 0, 5, 5); message(`§e[§cKB§e]§b Whoosh§e!§r`, source); };
    })
});

// By @slimeedude aka Amin MT. Please do not re-upload without permission.
