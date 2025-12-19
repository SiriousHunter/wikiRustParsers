const TAG_KEY_ADAPTER = {
  '^m': 'monthly',
  '^b': 'biweekly',
  '^w': 'weekly',
  'gmrust': 'vanilla',
  'gmhardcore': 'hardcore',
  'gmsoftcore': 'softcore',
  '^p': 'pve',
  '^r': 'roleplay',
  '^c': 'creative',
  '^e': 'minigame',
  '^d': 'training',
  '^i': 'battlefield',
  '^j': 'broyale',
  '^k': 'builds',
  '^t': 'tutorial',
  '^q': 'premium',
  '^z': 'modded',
  '^o': 'oxide',
  '^y': 'carbon'
};

const TAGS = {
    MONTHLY: 'monthly',
    BIWEEKLY: 'biweekly',
    WEEKLY: 'weekly',
    VANILLA: 'vanilla',
    HARDCORE: 'hardcore',
    SOFTCORE: 'softcore',
    PVE: 'pve',
    ROLEPLAY: 'roleplay',
    CREATIVE: 'creative',
    MINIGAME: 'minigame',
    TRAINING: 'training',
    BATTLEFIELD: 'battlefield',
    BROYALE: 'broyale',
    BUILDS: 'builds',
    TUTORIAL: 'tutorial',
    PREMIUM: 'premium',
    MODDED: 'modded',
    OXIDE: 'oxide',
    CARBON: 'carbon'
}

const GAMEMODE_DEFAULT = TAGS.VANILLA;
const WIPES_SCHEDULE_DEFAULT = TAGS.MONTHLY;

const GAMEMODES = [TAGS.VANILLA, TAGS.HARDCORE, TAGS.SOFTCORE];
const WIPES_SCHEDULES = [TAGS.MONTHLY, TAGS.BIWEEKLY, TAGS.WEEKLY];


module.exports = {
TAG_KEY_ADAPTER,
  GAMEMODE_DEFAULT,
  GAMEMODES,
  WIPES_SCHEDULES,
  WIPES_SCHEDULE_DEFAULT,
  TAGS
};