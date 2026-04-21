type Language = 'en' | 'fr';

const STORAGE_KEY = 'juice_language';

function detectSystemLanguage(): Language {
  const systemLang = navigator.language?.toLowerCase().split('-')[0];
  return systemLang === 'fr' ? 'fr' : 'en';
}

const storedLanguage = localStorage.getItem(STORAGE_KEY) as Language | null;
let currentLanguage: Language = storedLanguage ?? detectSystemLanguage();

const translations: Record<Language, Record<string, string>> = {
  en: {
    'ui.resume': 'RESUME',
    'ui.quit': 'QUIT',
    'ui.newUnlock': 'New: ',
    'ui.upgrades': 'Upgrades',
    'ui.unlocks': 'Unlocks',
    'ui.max': 'MAX',
    'ui.on': 'ON',
    'ui.off': 'OFF',
    'ui.language': 'ENGLISH',
    'ui.reset': 'RESET',
    'ui.resetConfirm': 'Reset all progress?',
    'ui.yes': 'YES',
    'ui.no': 'NO',
    'ui.deleteMeta': 'DELETE META',
    'ui.deleteMetaConfirm': 'Delete meta progression? This cannot be undone.',
    'ui.quitConfirm': 'Quit the game?',
    'ui.prestigeEarned': 'PRESTIGE POINTS',
    'ui.prestigePoints': 'Prestige Points',
    'ui.locked': 'LOCKED',
    'prestige.branch.bootstrap': 'Bootstrap',
    'prestige.branch.overclock': 'Overclock',
    'prestige.branch.hardware': 'Hardware',
    'prestige.branch.mastery': 'Mastery',
    'prestige.startSprites.name': 'Start Sprites',
    'prestige.startSprites.desc': '+2 sprites at game start',
    'prestige.startAutoClickers.name': 'Start Auto-clickers',
    'prestige.startAutoClickers.desc': '+5 autoclickers at game start',
    'prestige.startColors.name': 'Start Colors',
    'prestige.startColors.desc': '+1 particle color unlocked',
    'prestige.startJuice.name': 'Start Juice',
    'prestige.startJuice.desc': 'x20 starting juice per level (1k -> 160M)',
    'prestige.spriteYield.name': 'Sprite Yield',
    'prestige.spriteYield.desc': '+50% juice per sprite',
    'prestige.clickSpeed.name': 'Click Speed',
    'prestige.clickSpeed.desc': '-10% autoclicker cooldown',
    'prestige.particleBoost.name': 'Particle Boost',
    'prestige.particleBoost.desc': '+1 particle per click',
    'prestige.juiceMultiplier.name': 'Juice x',
    'prestige.juiceMultiplier.desc': '+10% global juice multiplier',
    'prestige.cpuCapacity.name': 'CPU Capacity',
    'prestige.cpuCapacity.desc': 'Overclock CPU (scaling MHz -> GHz)',
    'prestige.cpuEfficiency.name': 'CPU Efficiency',
    'prestige.cpuEfficiency.desc': '-5% global CPU cost',
    'prestige.particleCpuDrop.name': 'Particle Cooling',
    'prestige.particleCpuDrop.desc': '-25% particle CPU cost',
    'prestige.spriteCpuDrop.name': 'Sprite Cooling',
    'prestige.spriteCpuDrop.desc': '-15% sprite CPU cost',
    'prestige.discount.name': 'Discount',
    'prestige.discount.desc': '-5% shop upgrade cost',
    'prestige.persistentJuice.name': 'Persistent Juice',
    'prestige.persistentJuice.desc': 'Keep +5% juice on reboot',
    'prestige.prestigeGain.name': 'Prestige Gain',
    'prestige.prestigeGain.desc': '+1 max prestige point per run',

    'upgrade.particlesPerClick.name': 'Particles/Click',
    'upgrade.autoClicker.name': 'Autoclicker',
    'upgrade.addSprite.name': 'Add Sprite',
    'upgrade.bounce.name': 'Bounce',
    'upgrade.spriteMovement.name': 'Movement',
    'upgrade.bounceParticles.name': 'Bounce Particles',
    'upgrade.spriteCollision.name': 'Collision',
    'upgrade.spriteCollisionForce.name': 'Collision Force +',
    'upgrade.spriteRotation.name': 'Rotation',
    'upgrade.bounceSizeUp.name': 'Bounce Size +',
    'upgrade.spriteSpeedUp.name': 'Sprite Speed +',
    'upgrade.spriteRotationSpeedUp.name': 'Rotation Speed +',
    'upgrade.yellowParticle.name': 'Yellow Particle',
    'upgrade.redParticle.name': 'Red Particle',
    'upgrade.blueParticle.name': 'Blue Particle',
    'upgrade.greenParticle.name': 'Green Particle',
    'upgrade.purpleParticle.name': 'Purple Particle',

    'upgrade.particlesPerClick.desc': '+1 particle per click\n+0.08 CPU/particle',
    'upgrade.autoClicker.desc': '+1 autoclicker (auto-spawns particles)\n+0.5 CPU/autoclicker',
    'upgrade.addSprite.desc': '+1 sprite (generates juice passively)\n+1.2 CPU/sprite, +5 juice/s/sprite',
    'upgrade.bounce.desc': 'Sprites bounce off walls\n+0.6 CPU/sprite, +50 juice/s/sprite',
    'upgrade.spriteMovement.desc': 'Sprites move around\n+0.5 CPU/sprite, +500 juice/s/sprite',
    'upgrade.bounceParticles.desc': 'Spawn particles on each bounce\nCPU scales with particle count',
    'upgrade.spriteCollision.desc': 'Sprites collide and deal juice\n+0.8 CPU/hit, +10 juice/hit',
    'upgrade.spriteCollisionForce.desc': 'Harder collisions\n+25% collision juice, +25% CPU',
    'upgrade.spriteRotation.desc': 'Sprites rotate\n+0.9 CPU/sprite, +5K juice/s/sprite',
    'upgrade.bounceSizeUp.desc': 'Bigger bounces\n+25% bounce juice, +25% CPU',
    'upgrade.spriteSpeedUp.desc': 'Faster sprites\n+20% movement juice, +20% CPU',
    'upgrade.spriteRotationSpeedUp.desc': 'Faster rotation\n+25% rotation juice, +25% CPU',
    'upgrade.yellowParticle.desc': 'Unlock yellow particles\nx10 juice per particle',
    'upgrade.redParticle.desc': 'Unlock red particles\nx100 juice per particle',
    'upgrade.blueParticle.desc': 'Unlock blue particles\nx1K juice per particle',
    'upgrade.greenParticle.desc': 'Unlock green particles\nx10K juice per particle',
    'upgrade.purpleParticle.desc': 'Unlock purple particles\nx100K juice per particle',

    'crash.title': 'SYSTEM CRASH',
    'crash.subtitle': 'CPU OVERLOAD — 100%',
    'crash.message': 'Too much juice. The system couldn\'t handle it.',
    'crash.restart': 'REBOOT',

    'demo.title': 'THANKS FOR PLAYING!',
    'demo.subtitle': 'DEMO COMPLETE',
    'demo.message': 'This is the end of the demo.',
    'demo.buyFull': 'Full version available on this itch.io page.',

    'title.subtitle': 'Designed and created by the Donkey',

    'warning.title': 'PHOTOSENSITIVITY WARNING',
    'warning.body':
      'This game contains flashing lights and intense visual effects that may trigger seizures in people with photosensitive epilepsy. Player discretion is advised.',
    'warning.continue': 'I UNDERSTAND',
    'warning.dontShowAgain': 'DO NOT SHOW AGAIN',
  },
  fr: {
    'ui.resume': 'REPRENDRE',
    'ui.quit': 'QUITTER',
    'ui.newUnlock': 'Nouveau : ',
    'ui.upgrades': 'Ameliorations',
    'ui.unlocks': 'Deblocages',
    'ui.max': 'MAX',
    'ui.on': 'ON',
    'ui.off': 'OFF',
    'ui.language': 'FRANCAIS',
    'ui.reset': 'RESET',
    'ui.resetConfirm': 'Effacer toute la progression ?',
    'ui.yes': 'OUI',
    'ui.no': 'NON',
    'ui.deleteMeta': 'EFFACER META',
    'ui.deleteMetaConfirm': 'Effacer la meta progression ? Irreversible.',
    'ui.quitConfirm': 'Quitter le jeu ?',
    'ui.prestigeEarned': 'POINTS DE PRESTIGE',
    'ui.prestigePoints': 'Points de prestige',
    'ui.locked': 'VERROUILLE',
    'prestige.branch.bootstrap': 'Demarrage',
    'prestige.branch.overclock': 'Overclock',
    'prestige.branch.hardware': 'Hardware',
    'prestige.branch.mastery': 'Maitrise',
    'prestige.startSprites.name': 'Sprites depart',
    'prestige.startSprites.desc': '+2 sprites au depart',
    'prestige.startAutoClickers.name': 'Auto-clics depart',
    'prestige.startAutoClickers.desc': '+5 auto-clics au depart',
    'prestige.startColors.name': 'Couleurs depart',
    'prestige.startColors.desc': '+1 couleur de particule debloquee',
    'prestige.startJuice.name': 'Jus depart',
    'prestige.startJuice.desc': 'x20 jus de depart par niveau (1k -> 160M)',
    'prestige.spriteYield.name': 'Rendement Sprite',
    'prestige.spriteYield.desc': '+50% jus par sprite',
    'prestige.clickSpeed.name': 'Vitesse Clic',
    'prestige.clickSpeed.desc': '-10% cooldown auto-clic',
    'prestige.particleBoost.name': 'Boost Particules',
    'prestige.particleBoost.desc': '+1 particule par clic',
    'prestige.juiceMultiplier.name': 'Jus x',
    'prestige.juiceMultiplier.desc': '+10% multiplicateur de jus',
    'prestige.cpuCapacity.name': 'Capacite CPU',
    'prestige.cpuCapacity.desc': 'Overclock CPU (scaling MHz -> GHz)',
    'prestige.cpuEfficiency.name': 'Efficacite CPU',
    'prestige.cpuEfficiency.desc': '-5% cout CPU global',
    'prestige.particleCpuDrop.name': 'Refroid. Particules',
    'prestige.particleCpuDrop.desc': '-25% cout CPU particules',
    'prestige.spriteCpuDrop.name': 'Refroid. Sprites',
    'prestige.spriteCpuDrop.desc': '-15% cout CPU sprites',
    'prestige.discount.name': 'Remise',
    'prestige.discount.desc': '-5% prix upgrades boutique',
    'prestige.persistentJuice.name': 'Jus persistant',
    'prestige.persistentJuice.desc': 'Garde +5% de jus au reboot',
    'prestige.prestigeGain.name': 'Gain Prestige',
    'prestige.prestigeGain.desc': '+1 point prestige max/run',

    'upgrade.particlesPerClick.name': 'Particules/Clic',
    'upgrade.autoClicker.name': 'Auto-clic',
    'upgrade.addSprite.name': '+ Sprite',
    'upgrade.bounce.name': 'Rebond',
    'upgrade.spriteMovement.name': 'Mouvement',
    'upgrade.bounceParticles.name': 'Particules rebond',
    'upgrade.spriteCollision.name': 'Collision',
    'upgrade.spriteCollisionForce.name': 'Force Collision +',
    'upgrade.spriteRotation.name': 'Rotation',
    'upgrade.bounceSizeUp.name': 'Taille Rebond +',
    'upgrade.spriteSpeedUp.name': 'Vitesse Sprite +',
    'upgrade.spriteRotationSpeedUp.name': 'Vitesse Rotation +',
    'upgrade.yellowParticle.name': 'Particule jaune',
    'upgrade.redParticle.name': 'Particule rouge',
    'upgrade.blueParticle.name': 'Particule bleue',
    'upgrade.greenParticle.name': 'Particule verte',
    'upgrade.purpleParticle.name': 'Particule violette',

    'upgrade.particlesPerClick.desc': '+1 particule par clic\n+0.08 CPU/particule',
    'upgrade.autoClicker.desc': '+1 auto-clic (spawn auto)\n+0.5 CPU/auto-clic',
    'upgrade.addSprite.desc': '+1 sprite (genere du jus passif)\n+1.2 CPU/sprite, +5 jus/s/sprite',
    'upgrade.bounce.desc': 'Les sprites rebondissent\n+0.6 CPU/sprite, +50 jus/s/sprite',
    'upgrade.spriteMovement.desc': 'Les sprites se deplacent\n+0.5 CPU/sprite, +500 jus/s/sprite',
    'upgrade.bounceParticles.desc': 'Particules a chaque rebond\nCPU selon nombre de particules',
    'upgrade.spriteCollision.desc': 'Collisions entre sprites\n+0.8 CPU/choc, +10 jus/choc',
    'upgrade.spriteCollisionForce.desc': 'Collisions + dures\n+25% jus collision, +25% CPU',
    'upgrade.spriteRotation.desc': 'Les sprites tournent\n+0.9 CPU/sprite, +5K jus/s/sprite',
    'upgrade.bounceSizeUp.desc': 'Rebonds + grands\n+25% jus rebond, +25% CPU',
    'upgrade.spriteSpeedUp.desc': 'Sprites + rapides\n+20% jus mouvement, +20% CPU',
    'upgrade.spriteRotationSpeedUp.desc': 'Rotation + rapide\n+25% jus rotation, +25% CPU',
    'upgrade.yellowParticle.desc': 'Debloque les particules jaunes\nx10 jus par particule',
    'upgrade.redParticle.desc': 'Debloque les particules rouges\nx100 jus par particule',
    'upgrade.blueParticle.desc': 'Debloque les particules bleues\nx1K jus par particule',
    'upgrade.greenParticle.desc': 'Debloque les particules vertes\nx10K jus par particule',
    'upgrade.purpleParticle.desc': 'Debloque les particules violettes\nx100K jus par particule',

    'crash.title': 'SYSTEM CRASH',
    'crash.subtitle': 'SURCHARGE CPU — 100%',
    'crash.message': 'Trop de jus. Le systeme n\'a pas tenu.',
    'crash.restart': 'REDEMARRER',

    'demo.title': 'MERCI D\'AVOIR JOUE !',
    'demo.subtitle': 'FIN DE LA DEMO',
    'demo.message': 'Vous avez atteint la fin de la demo.',
    'demo.buyFull': 'Version complete disponible sur cette page itch.io.',

    'title.subtitle': 'Designé et créé par le Donkey',

    'warning.title': 'AVERTISSEMENT EPILEPSIE',
    'warning.body':
      'Ce jeu contient des flashs lumineux et des effets visuels intenses qui peuvent provoquer des crises chez les personnes atteintes d\'epilepsie photosensible. La prudence est recommandee.',
    'warning.continue': 'J\'AI COMPRIS',
    'warning.dontShowAgain': 'NE PLUS AFFICHER',
  },
};

export function t(key: string): string {
  return translations[currentLanguage][key] ?? key;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem(STORAGE_KEY, lang);
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function toggleLanguage(): Language {
  const newLang = currentLanguage === 'en' ? 'fr' : 'en';
  setLanguage(newLang);
  return newLang;
}

export type { Language };
