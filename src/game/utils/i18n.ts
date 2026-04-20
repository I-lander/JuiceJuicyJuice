type Language = 'en' | 'fr';

const STORAGE_KEY = 'juice_language';

let currentLanguage: Language = (localStorage.getItem(STORAGE_KEY) as Language) || 'en';

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
    'prestige.startAutoClickers.name': 'Start Auto-clickers',
    'prestige.startAutoClickers.desc': '+5 autoclickers at game start',
    'prestige.startSprites.name': 'Start Sprites',
    'prestige.startSprites.desc': '+2 sprites at game start',
    'prestige.unlockColors.name': 'Unlock Colors',
    'prestige.unlockColors.desc': 'Unlock particle colors at game start',
    'prestige.cpuCapacity.name': 'CPU Capacity +',
    'prestige.cpuCapacity.desc': '+100 MHz CPU capacity',

    'upgrade.particlesPerClick.name': 'Particles/Click',
    'upgrade.autoClicker.name': 'Autoclicker',
    'upgrade.addSprite.name': 'Add Sprite',
    'upgrade.bounce.name': 'Bounce',
    'upgrade.spriteMovement.name': 'Movement',
    'upgrade.bounceParticles.name': 'Bounce Particles',
    'upgrade.spriteCollision.name': 'Collision',
    'upgrade.spriteRotation.name': 'Rotation',
    'upgrade.spriteJuiceUp.name': 'Sprite Juice +',
    'upgrade.bounceSizeUp.name': 'Bounce Size +',
    'upgrade.spriteSpeedUp.name': 'Sprite Speed +',
    'upgrade.spriteRotationSpeedUp.name': 'Rotation Speed +',
    'upgrade.yellowParticle.name': 'Yellow Particle',
    'upgrade.redParticle.name': 'Red Particle',
    'upgrade.blueParticle.name': 'Blue Particle',
    'upgrade.greenParticle.name': 'Green Particle',
    'upgrade.purpleParticle.name': 'Purple Particle',

    'upgrade.particlesPerClick.desc': '+1 particle spawned per click',
    'upgrade.autoClicker.desc': '+1 automatic clicker',
    'upgrade.addSprite.desc': 'Spawn a new random sprite',
    'upgrade.bounce.desc': 'Sprites bounce off walls',
    'upgrade.spriteMovement.desc': 'Sprites start moving around',
    'upgrade.bounceParticles.desc': 'Particles spawn when sprites bounce',
    'upgrade.spriteCollision.desc': 'Sprites collide with each other',
    'upgrade.spriteRotation.desc': 'Sprites start rotating',
    'upgrade.spriteJuiceUp.desc': '+5 juice/s per sprite',
    'upgrade.bounceSizeUp.desc': '+25% bounce size, +25% juice & CPU',
    'upgrade.spriteSpeedUp.desc': '+25% sprite speed, +25% juice & CPU',
    'upgrade.spriteRotationSpeedUp.desc': '+25% rotation speed, +25% juice & CPU',
    'upgrade.yellowParticle.desc': 'Unlock yellow particles (x10 juice)',
    'upgrade.redParticle.desc': 'Unlock red particles (x100 juice)',
    'upgrade.blueParticle.desc': 'Unlock blue particles (x1K juice)',
    'upgrade.greenParticle.desc': 'Unlock green particles (x100K juice)',
    'upgrade.purpleParticle.desc': 'Unlock purple particles (x1M juice)',

    'crash.title': 'SYSTEM CRASH',
    'crash.subtitle': 'CPU OVERLOAD — 100%',
    'crash.message': 'Too much juice. The system couldn\'t handle it.',
    'crash.restart': 'REBOOT',

    'demo.title': 'THANKS FOR PLAYING!',
    'demo.subtitle': 'DEMO COMPLETE',
    'demo.message': 'This is the end of the demo.',
    'demo.buyFull': 'Full version available on this itch.io page.',
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
    'prestige.startAutoClickers.name': 'Auto-clics depart',
    'prestige.startAutoClickers.desc': '+5 auto-clics au debut de partie',
    'prestige.startSprites.name': 'Sprites depart',
    'prestige.startSprites.desc': '+2 sprites au debut de partie',
    'prestige.unlockColors.name': 'Couleurs debloquees',
    'prestige.unlockColors.desc': 'Debloque les couleurs de particules au depart',
    'prestige.cpuCapacity.name': 'Capacite CPU +',
    'prestige.cpuCapacity.desc': '+100 MHz de capacite CPU',

    'upgrade.particlesPerClick.name': 'Particules/Clic',
    'upgrade.autoClicker.name': 'Auto-clic',
    'upgrade.addSprite.name': '+ Sprite',
    'upgrade.bounce.name': 'Rebond',
    'upgrade.spriteMovement.name': 'Mouvement',
    'upgrade.bounceParticles.name': 'Particules rebond',
    'upgrade.spriteCollision.name': 'Collision',
    'upgrade.spriteRotation.name': 'Rotation',
    'upgrade.spriteJuiceUp.name': 'Jus Sprite +',
    'upgrade.bounceSizeUp.name': 'Taille Rebond +',
    'upgrade.spriteSpeedUp.name': 'Vitesse Sprite +',
    'upgrade.spriteRotationSpeedUp.name': 'Vitesse Rotation +',
    'upgrade.yellowParticle.name': 'Particule jaune',
    'upgrade.redParticle.name': 'Particule rouge',
    'upgrade.blueParticle.name': 'Particule bleue',
    'upgrade.greenParticle.name': 'Particule verte',
    'upgrade.purpleParticle.name': 'Particule violette',

    'upgrade.particlesPerClick.desc': '+1 particule par clic',
    'upgrade.autoClicker.desc': '+1 clic automatique',
    'upgrade.addSprite.desc': 'Ajoute un sprite aleatoire',
    'upgrade.bounce.desc': 'Les sprites rebondissent',
    'upgrade.spriteMovement.desc': 'Les sprites se deplacent',
    'upgrade.bounceParticles.desc': 'Particules aux rebonds',
    'upgrade.spriteCollision.desc': 'Les sprites entrent en collision',
    'upgrade.spriteRotation.desc': 'Les sprites tournent',
    'upgrade.spriteJuiceUp.desc': '+5 jus/s par sprite',
    'upgrade.bounceSizeUp.desc': '+25% taille rebond, +25% jus & CPU',
    'upgrade.spriteSpeedUp.desc': '+25% vitesse sprite, +25% jus & CPU',
    'upgrade.spriteRotationSpeedUp.desc': '+25% vitesse rotation, +25% jus & CPU',
    'upgrade.yellowParticle.desc': 'Particules jaunes (x10 jus)',
    'upgrade.redParticle.desc': 'Particules rouges (x100 jus)',
    'upgrade.blueParticle.desc': 'Particules bleues (x1K jus)',
    'upgrade.greenParticle.desc': 'Particules vertes (x100K jus)',
    'upgrade.purpleParticle.desc': 'Particules violettes (x1M jus)',

    'crash.title': 'SYSTEM CRASH',
    'crash.subtitle': 'SURCHARGE CPU — 100%',
    'crash.message': 'Trop de jus. Le systeme n\'a pas tenu.',
    'crash.restart': 'REDEMARRER',

    'demo.title': 'MERCI D\'AVOIR JOUE !',
    'demo.subtitle': 'FIN DE LA DEMO',
    'demo.message': 'Vous avez atteint la fin de la demo.',
    'demo.buyFull': 'Version complete disponible sur cette page itch.io.',
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
