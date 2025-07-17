import { world, Player, EntityHealthComponent } from '@minecraft/server';
import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerCPS } from "cps";

const defaultKb = 0.37;

const defaultOptions = {
  customKb: 0,
  knockbackEnabled: true,
  cpsCounterEnabled: true,
};

let options = {};

if (world.getDynamicProperty("knockback_options") === undefined) {
  world.setDynamicProperty("knockback_options", JSON.stringify(defaultOptions));
  options = defaultOptions;
} else {
  options = JSON.parse(world.getDynamicProperty("knockback_options"));
};

function saveOptions() {
  world.setDynamicProperty("knockback_options", JSON.stringify(options));
};

function subtitle(msg, player) {
  return player.runCommandAsync(`titleraw @s actionbar {"rawtext":[{"text":"${msg}"}]}`);
};

function message(msg, player) {
  return player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"${msg}"}]}`);
};

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
  if (damageSource.damagingEntity) {
    let health = hurtEntity.getComponent(EntityHealthComponent.componentId);
    if (options.cpsCounterEnabled) {
      subtitle(`§l§aCPS§e: §b${getPlayerCPS(damageSource.damagingEntity)}§e, §dTarget Health§e: §c${health.currentValue.toFixed(1)}`, damageSource.damagingEntity);
    };
    if (options.knockbackEnabled) {
      hurtEntity.applyKnockback(0, 0, defaultKb + options.customKb, defaultKb + options.customKb);
    };
  }
});

function toggleCpsCounter(source) {
  if (options.cpsCounterEnabled) {
    options.cpsCounterEnabled = false;
    message(`§e[§cKB§e]§c CPS/Health counter has been disabled§e.§r`, source);
  } else {
    options.cpsCounterEnabled = true;
    message(`§e[§cKB§e]§a CPS/Health counter has been enabled§e.§r`, source);
  }
};

function toggleKnockback(source) {
  if (options.knockbackEnabled) {
    options.knockbackEnabled = false;
    message(`§e[§cKB§e]§c Knockback has been disabled§e.§r`, source);
  } else {
    options.knockbackEnabled = true;
    message(`§e[§cKB§e]§a Knockback has been enabled§e.§r`, source);
  }
};

const gui = new ActionFormData();
gui.title('§l§bKnockback Settings');
gui.body('§l§fActions:');
gui.button('§l§aToggle Knockback');
gui.button('§l§dToggle CPS/Health counter');
gui.button('§l§eIncrease Height');
gui.button('§l§eDecrease Height');
gui.button('§l§eReset Height');
gui.button('§l§bTo the air!');

world.afterEvents.itemUse.subscribe(data => {
  const source = data.source
  if (!(source instanceof Player)) return;
  if (data.itemStack.typeId === 'kb:knockback_settings') gui.show(source).then(result => {
    if (result.selection === 0) { toggleKnockback(source); saveOptions(); };
    if (result.selection === 1) { toggleCpsCounter(source); saveOptions(); };
    if (result.selection === 2) { options.customKb += 0.01; message(`§e[§cKB§e]§b Extra knockback height has been increased to ${options.customKb.toFixed(2)}§e.§r`, source); saveOptions(); };
    if (result.selection === 3) { if (options.customKb > -0.1) { options.customKb += -0.01; message(`§e[§cKB§e]§b Extra knockback height has been decreased to ${options.customKb.toFixed(2)}§e.§r`, source); } else { message(`§e[§cKB§e]§c Knockback height is already at the minimum value§e.§r`, source); }; saveOptions(); };
    if (result.selection === 4) { options.customKb = 0; message(`§e[§cKB§e]§a Extra knockback height was set to default§e.`, source); saveOptions(); };
    if (result.selection === 5) { source.applyKnockback(0, 0, 5, 5); message(`§e[§cKB§e]§b Whoosh§e!§r`, source); };
  });
});

// @slimeedude aka Amin MT.
// @Leonidaaa
