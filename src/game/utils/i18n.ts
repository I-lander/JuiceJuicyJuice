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

    'upgrade.particlesPerClick.name': 'Particles/Click',
    'upgrade.autoClicker.name': 'Autoclicker',
    'upgrade.cooldownReduction.name': 'Cooldown -',
    'upgrade.addSprite.name': 'Add Sprite',
    'upgrade.bounce.name': 'Bounce',
    'upgrade.spriteMovement.name': 'Movement',
    'upgrade.bounceParticles.name': 'Bounce Particles',
    'upgrade.spriteCollision.name': 'Collision',
    'upgrade.spriteRotation.name': 'Rotation',
    'upgrade.spriteJuiceUp.name': 'Sprite Juice +',
    'upgrade.bounceJuiceUp.name': 'Bounce Juice +',
    'upgrade.movementJuiceUp.name': 'Movement Juice +',
    'upgrade.rotationJuiceUp.name': 'Rotation Juice +',
    'upgrade.yellowParticle.name': 'Yellow Particle',
    'upgrade.redParticle.name': 'Red Particle',
    'upgrade.blueParticle.name': 'Blue Particle',
    'upgrade.greenParticle.name': 'Green Particle',
    'upgrade.purpleParticle.name': 'Purple Particle',

    'upgrade.particlesPerClick.desc': '+1 particle spawned per click',
    'upgrade.autoClicker.desc': '+1 automatic clicker',
    'upgrade.cooldownReduction.desc': '-0.1s autoclicker cooldown',
    'upgrade.addSprite.desc': 'Spawn a new random sprite',
    'upgrade.bounce.desc': 'Sprites bounce off walls',
    'upgrade.spriteMovement.desc': 'Sprites start moving around',
    'upgrade.bounceParticles.desc': 'Particles spawn when sprites bounce',
    'upgrade.spriteCollision.desc': 'Sprites collide with each other',
    'upgrade.spriteRotation.desc': 'Sprites start rotating',
    'upgrade.spriteJuiceUp.desc': '+0.1 juice per sprite interaction',
    'upgrade.bounceJuiceUp.desc': '+0.1 juice per bounce',
    'upgrade.movementJuiceUp.desc': '+0.1 juice per movement tick',
    'upgrade.rotationJuiceUp.desc': '+0.1 juice per rotation tick',
    'upgrade.yellowParticle.desc': 'Unlock yellow particles (x2 juice)',
    'upgrade.redParticle.desc': 'Unlock red particles (x3 juice)',
    'upgrade.blueParticle.desc': 'Unlock blue particles (x5 juice)',
    'upgrade.greenParticle.desc': 'Unlock green particles (x8 juice)',
    'upgrade.purpleParticle.desc': 'Unlock purple particles (x13 juice)',
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

    'upgrade.particlesPerClick.name': 'Particules/Clic',
    'upgrade.autoClicker.name': 'Auto-clic',
    'upgrade.cooldownReduction.name': 'Recharge -',
    'upgrade.addSprite.name': '+ Sprite',
    'upgrade.bounce.name': 'Rebond',
    'upgrade.spriteMovement.name': 'Mouvement',
    'upgrade.bounceParticles.name': 'Particules rebond',
    'upgrade.spriteCollision.name': 'Collision',
    'upgrade.spriteRotation.name': 'Rotation',
    'upgrade.spriteJuiceUp.name': 'Jus Sprite +',
    'upgrade.bounceJuiceUp.name': 'Jus Rebond +',
    'upgrade.movementJuiceUp.name': 'Jus Mouvement +',
    'upgrade.rotationJuiceUp.name': 'Jus Rotation +',
    'upgrade.yellowParticle.name': 'Particule jaune',
    'upgrade.redParticle.name': 'Particule rouge',
    'upgrade.blueParticle.name': 'Particule bleue',
    'upgrade.greenParticle.name': 'Particule verte',
    'upgrade.purpleParticle.name': 'Particule violette',

    'upgrade.particlesPerClick.desc': '+1 particule par clic',
    'upgrade.autoClicker.desc': '+1 clic automatique',
    'upgrade.cooldownReduction.desc': '-0.1s recharge auto-clic',
    'upgrade.addSprite.desc': 'Ajoute un sprite aleatoire',
    'upgrade.bounce.desc': 'Les sprites rebondissent',
    'upgrade.spriteMovement.desc': 'Les sprites se deplacent',
    'upgrade.bounceParticles.desc': 'Particules aux rebonds',
    'upgrade.spriteCollision.desc': 'Les sprites entrent en collision',
    'upgrade.spriteRotation.desc': 'Les sprites tournent',
    'upgrade.spriteJuiceUp.desc': '+0.1 jus par interaction sprite',
    'upgrade.bounceJuiceUp.desc': '+0.1 jus par rebond',
    'upgrade.movementJuiceUp.desc': '+0.1 jus par tick mouvement',
    'upgrade.rotationJuiceUp.desc': '+0.1 jus par tick rotation',
    'upgrade.yellowParticle.desc': 'Particules jaunes (x2 jus)',
    'upgrade.redParticle.desc': 'Particules rouges (x3 jus)',
    'upgrade.blueParticle.desc': 'Particules bleues (x5 jus)',
    'upgrade.greenParticle.desc': 'Particules vertes (x8 jus)',
    'upgrade.purpleParticle.desc': 'Particules violettes (x13 jus)',
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
