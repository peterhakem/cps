/**
 * @file Player knockback++ main script for Minecraft Bedrock
 * 
 * Provides a GUI for players to toggle CPS counter and knockback settings
 * with persistent options using dynamic properties
 * 
 * Includes translations for UI, and applies knockback or displays entity and damage data
 * on player damage events. GUI is triggered via a custom item which is knockback settings
 * from equipments category in the creative mode menu.
 * 
 * @author slimeedude (Amin MT)
 * @author Leonidaaa
 * @version 1.1.1
 * @license MIT
 * @since 2025-07-18
 */
 
import { world, Player, EntityHealthComponent } from '@minecraft/server';
import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerCPS } from "cps";

const defaultKb = 0.37;

const defaultOptions = {
  customKb: 0,
  knockbackEnabled: true,
  cpsCounterEnabled: true,
};

const translation = {
  display: "cps:display",
  displayOff: "cps:display_off",
  displayOn: "cps:display_on",
  displayToggle: "cps:display_toggle",
  knockbackOff: "cps:knockback_off",
  knockbackOn: "cps:knockback_on",
  knockbackToggle: "cps:knockback_toggle",
  toTheAir: "cps:to_the_air",
  actions: "cps:actions",
  heightIncrease: "cps:height_increase",
  heightDecrease: "cps:height_decrease",
  heightReset: "cps:height_reset",
  title: "cps:title",
  body: "cps:body"
};

let options = {};

if (!world.getDynamicProperty("knockback_options")) {
  world.setDynamicProperty("knockback_options", JSON.stringify(defaultOptions));
  options = defaultOptions;
} else {
  options = JSON.parse(world.getDynamicProperty("knockback_options"));
};

function saveOptions() {
  world.setDynamicProperty("knockback_options", JSON.stringify(options));
};

/**
* @param {import('@minecraft/server').RawMessage} msg
* @param {Player} player 
*/
function subtitle(msg, player) { // maybe we should rename this into Actionbar since its NOT subtitle
  return player.onScreenDisplay.setActionBar(msg);
}

/**
* @param {import('@minecraft/server').RawMessage} msg a rawText message like `{ text: "hi" }`
* @param {Player} player 
*/
function message(msg, player) {
  return player.sendMessage(msg);
}

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
  if (damageSource.damagingEntity && damageSource.damagingEntity instanceof Player) {
    /** @type {EntityHealthComponent}  */
    let health = hurtEntity.getComponent(EntityHealthComponent.componentId);
    if (options.cpsCounterEnabled) {
      subtitle({ translate: translation.display, with: [getPlayerCPS(damageSource.damagingEntity).toString(), health.currentValue.toString()] }, damageSource.damagingEntity)
    }
    if (options.knockbackEnabled) {
      hurtEntity.applyKnockback(0, 0, defaultKb + options.customKb, defaultKb + options.customKb);
    }
  }
});

function toggleCpsCounter(source) {
  if (options.cpsCounterEnabled) {
    options.cpsCounterEnabled = false;
    message({ translate: translation.displayOff }, source);
  } else {
    options.cpsCounterEnabled = true;
    message({ translate: translation.displayOn }, source);
  }
};

function toggleKnockback(source) {
  if (options.knockbackEnabled) {
    options.knockbackEnabled = false;
    message({ translate: translation.knockbackOff }, source);
  } else {
    options.knockbackEnabled = true;
    message({ translate: translation.knockbackOn }, source);
  }
};

const gui = new ActionFormData();
gui.title({ translate: translation.title});
gui.body({ translate: translation.body });
gui.button({ translate: translation.knockbackToggle });
gui.button({ translate: translation.displayToggle });
gui.button({ translate: translation.heightIncrease });
gui.button({ translate: translation.heightDecrease});
gui.button({ translate: translation.heightReset });
gui.button({ translate: translation.toTheAir });

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
