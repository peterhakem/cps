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
 * @since 2025-07-16
 */

import { world, Player, EntityHealthComponent } from '@minecraft/server';
import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerCPS } from "cps";

const defaultKb = 0.37;

/**
 * @typedef {object} DefaultOptions
 * @property {number} [customKb]
 * @property {boolean} [knockbackEnabled]
 * @property {boolean} [cpsCounterEnabled]
 * @property {"Players" | "Entities"} [target]
 */

/** @type {DefaultOptions} */
const defaultOptions = {
  customKb: 0,
  knockbackEnabled: true,
  cpsCounterEnabled: true,
  target: "Players"
};

/**
 * @param {DefaultOptions} options
 * @returns {boolean}
 */
function isOptionsValid(options) {
  return (
    typeof options === "object" &&
    options !== null &&
    typeof options.customKb === "number" &&
    typeof options.knockbackEnabled === "boolean" &&
    typeof options.cpsCounterEnabled === "boolean" &&
    typeof options.target === "string"
  );
}

const UiTextures = {
  DisplayOff: "textures/items/stone_sword",
  DisplayOn: "textures/ui/displayon",
  KnockbackOn: "textures/ui/knockon",
  KnockbackOff: "textures/ui/knockoff",
  KnockbackTargetPlayer: "textures/ui/icon_steve",
  KnockbackTargetEntity: "textures/ui/icon_panda",
  HeightIncrease: "textures/ui/heightincr",
  HeightDecrease: "textures/ui/heightdecr",
  HeightReset: "textures/ui/heightreset",
  ToTheAir: "textures/ui/wind_charged_effect",
}

const Translation = {
  Display: "cps:display",
  DisplayOff: "cps:display_off",
  DisplayOn: "cps:display_on",
  DisplayToggle: "cps:display_toggle",
  KnockbackOff: "cps:knockback_off",
  KnockbackOn: "cps:knockback_on",
  KnockbackToggle: "cps:knockback_toggle",
  ToTheAir: "cps:to_the_air",
  ToTheAirMessage: "cps:to_the_air_message",
  Actions: "cps:actions",
  HeightIncrease: "cps:height_increase",
  HeightIncreaseMessage: "cps:height_increase_message",
  HeightDecrease: "cps:height_decrease",
  HeightDecreaseMessage: "cps:height_decrease_message",
  HeightMinimal: "cps:height_minimal",
  HeightReset: "cps:height_reset",
  HeightResetMessage: "cps:height_reset_message",
  KnockackTarget: "cps:knockback_target",
  KnockbackTargetMessage: "cps:knockback_target_message",
  Title: "cps:title",
  Body: "cps:body",
};

let optionsRaw = world.getDynamicProperty("knockback_options");
/** @type {DefaultOptions} */
let options;

try {
  // @ts-ignore
  const parsed = JSON.parse(optionsRaw ?? "null");

  if (isOptionsValid(parsed)) {
    options = parsed;
  } else {
    throw new Error("invalid options");
  }
} catch {
  options = defaultOptions;
  world.setDynamicProperty("knockback_options", JSON.stringify(defaultOptions));
}

function saveOptions() {
  world.setDynamicProperty("knockback_options", JSON.stringify(options));
};

/**
* @param {import('@minecraft/server').RawMessage} msg
* @param {Player} player 
*/
function actionbar(msg, player) {
  return player.onScreenDisplay.setActionBar(msg);
}

/**
* @param {import('@minecraft/server').RawMessage | string} msg a rawText message like `{ text: "hi" }`
* @param {Player} player 
*/
function message(msg, player) {
  return player.sendMessage(msg);
}

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
  if ((damageSource.damagingEntity ?? null) instanceof Player) {
    if (options.target === "Players" && hurtEntity instanceof Player) {
      knockback(hurtEntity, damageSource);
    }
    if (options.target === "Entities") {
      knockback(hurtEntity, damageSource);
    }
  }

    function knockback(hurtEntity, damageSource) {
        let health = hurtEntity.getComponent(EntityHealthComponent.componentId);
        if (options.cpsCounterEnabled) {
            // @ts-ignore
            actionbar({ translate: Translation.Display, with: [getPlayerCPS(damageSource.damagingEntity).toString(), health.currentValue.toFixed(1).toString()] }, damageSource.damagingEntity);
        }
        if (options.knockbackEnabled) {
            hurtEntity.applyKnockback(0, 0, defaultKb + options.customKb, defaultKb + options.customKb);
        }
    }
});

/**
 * @param {Player} source
 */
function toggleCpsCounter(source) {
  if (options.cpsCounterEnabled) {
    options.cpsCounterEnabled = false;
    message({ translate: Translation.DisplayOff }, source);
  } else {
    options.cpsCounterEnabled = true;
    message({ translate: Translation.DisplayOn }, source);
  }
};

/**
 * @param {Player} source
 */
function toggleKnockback(source) {
  if (options.knockbackEnabled) {
    options.knockbackEnabled = false;
    message({ translate: Translation.KnockbackOff }, source);
  } else {
    options.knockbackEnabled = true;
    message({ translate: Translation.KnockbackOn }, source);
  }
};

/**
 * @param {Player} source
 */
function toggleTarget(source) {
  if (options.target === "Players") {
    options.target = "Entities";
    message({ translate: Translation.KnockbackTargetMessage, with: [options.target] }, source);
  } else {
    options.target = "Players";
    message({ translate: Translation.KnockbackTargetMessage, with: [options.target] }, source);
  }
}

world.afterEvents.itemUse.subscribe(data => {
  // dynamic textures
  let knockbackToggleTexture = options?.knockbackEnabled ? UiTextures.KnockbackOn : UiTextures.KnockbackOff;
  let displayToggleTexture = options?.cpsCounterEnabled ? UiTextures.DisplayOn : UiTextures.DisplayOff;
  let knockbackTargetTexture = options?.target === "Players" ? UiTextures.KnockbackTargetPlayer : UiTextures.KnockbackTargetEntity;

  const gui = new ActionFormData()
    .title({ translate: Translation.Title })
    .body({ translate: Translation.Body })
    .button({ translate: Translation.KnockbackToggle }, knockbackToggleTexture)
    .button({ translate: Translation.DisplayToggle }, displayToggleTexture)
    .button({ translate: Translation.HeightIncrease }, UiTextures.HeightIncrease)
    .button({ translate: Translation.HeightDecrease }, UiTextures.HeightDecrease)
    .button({ translate: Translation.HeightReset }, UiTextures.HeightReset)
    .button({ translate: Translation.KnockackTarget, with: [options.target] }, knockbackTargetTexture)
    .button({ translate: Translation.ToTheAir }, UiTextures.ToTheAir);


  const source = data.source
  if (!(source instanceof Player)) return;
  if (data.itemStack.typeId === 'kb:knockback_settings') gui.show(source).then(result => {
    if (result.canceled || result.selection == null) return;
    if (result.selection === 0) { toggleKnockback(source); saveOptions(); };
    if (result.selection === 1) { toggleCpsCounter(source); saveOptions(); };
    if (result.selection === 2) { options.customKb += 0.01; message({ translate: Translation.HeightIncreaseMessage, with: [options.customKb.toFixed(2)] }, source); saveOptions(); };
    if (result.selection === 3) { if (options.customKb > -0.1) { options.customKb += -0.01; message({ translate: Translation.HeightDecreaseMessage, with: [options.customKb.toFixed(2)] }, source); } else { message({ translate: Translation.HeightMinimal }, source); }; saveOptions(); };
    if (result.selection === 4) { options.customKb = 0; message({ translate: Translation.HeightResetMessage }, source); saveOptions(); };
    if (result.selection === 5) { toggleTarget(source); saveOptions() };
    if (result.selection === 6) { source.applyKnockback(0, 0, 5, 5); message({ translate: Translation.ToTheAirMessage }, source); };
  });
});
