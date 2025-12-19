const {
    GAMEMODES,
    GAMEMODE_DEFAULT,
    WIPES_SCHEDULES,
    WIPES_SCHEDULE_DEFAULT,
    TAGS,
    TAG_KEY_ADAPTER,
} = require('./constants');

function getGamemode(data) {
    const {raw = {}} = data;
    const {tags = []} = raw;

    const convertedTags = tags.map(tag => TAG_KEY_ADAPTER[tag]).filter(Boolean);
    const gamemode = convertedTags.find(tag => GAMEMODES.includes(tag));

    return gamemode || GAMEMODE_DEFAULT;
}

function getWipesSchedule(data) {
    const {raw = {}} = data;
    const {tags = []} = raw;

    const convertedTags = tags.map(tag => TAG_KEY_ADAPTER[tag]).filter(Boolean);
    const wipesSchedule = convertedTags.find(tag => WIPES_SCHEDULES.includes(tag));

    return wipesSchedule || WIPES_SCHEDULE_DEFAULT;
}

function getPremium(tags) {
    const premium = tags.find(tag => tag === TAGS.PREMIUM);

    return premium && TAGS.PREMIUM;
}

const getPve = (tags) => {
    const pve = tags.find(tag => tag === TAGS.PVE);

    return pve && TAGS.PVE;
}

const getModded = (tags) => {
    const modded = tags.find(tag => tag === TAGS.MODDED);

    return modded && TAGS.MODDED;
}

const getOxide = (tags) => {
    const oxide = tags.find(tag => tag === TAGS.OXIDE);

    return oxide && TAGS.OXIDE;
}

const getCarbon = (tags) => {
    const carbon = tags.find(tag => tag === TAGS.CARBON);

    return carbon && TAGS.CARBON;
}

const getRoleplay = (tags) => {
    const roleplay = tags.find(tag => tag === TAGS.ROLEPLAY);

    return roleplay && TAGS.ROLEPLAY;
}

const getCreative = (tags) => {
    const creative = tags.find(tag => tag === TAGS.CREATIVE);

    return creative && TAGS.CREATIVE;
}

const getMinigame = (tags) => {
    const minigame = tags.find(tag => tag === TAGS.MINIGAME);

    return minigame && TAGS.MINIGAME;
}

const getTraining = (tags) => {
    const training = tags.find(tag => tag === TAGS.TRAINING);

    return training && TAGS.TRAINING;
}

const getBattlefield = (tags) => {
    const battlefield = tags.find(tag => tag === TAGS.BATTLEFIELD);

    return battlefield && TAGS.BATTLEFIELD;
}

const getBroyale = (tags) => {
    const broyale = tags.find(tag => tag === TAGS.BROYALE);

    return broyale && TAGS.BROYALE;
}

const getBuilds = (tags) => {
    const builds = tags.find(tag => tag === TAGS.BUILDS);

    return builds && TAGS.BUILDS;
}

const getTutorial = (tags) => {
    const tutorial = tags.find(tag => tag === TAGS.TUTORIAL);

    return tutorial && TAGS.TUTORIAL;
}

const getUptime = (data) => {
    const {raw = {}} = data;
    const {tags = []} = raw;

    const uptimeTag = tags.find(tag => tag.match(/^born[0-9]*$/));
    const onlineFrom = uptimeTag ? Number(uptimeTag.match(/^born([0-9]*)$/)[1]) : 0;

    return new Date(onlineFrom * 1000);
}

const getPlayersQueue = (data) => {
    const {raw = {}} = data;
    const {tags = []} = raw;

    const queueTag = tags.find(tag => tag.match(/^qp[0-9]*$/));
    const queuePlayers = queueTag ? Number(queueTag.match(/^qp([0-9]*)$/)[1]) : 0;

    return queuePlayers;
}

const getDescription = (data) => {
    const {raw = {}} = data;
    const {rules = {}} = raw;

    const mapImage = rules?.['map_image_url'] || null;
    const logoImage = rules?.['logoimage'] || null;
    const headerImage = rules?.['headerimage'] || null;
    const url = rules?.['url'] || null;
    const worldSize = rules?.['world.size'] || null;
    const worldSeed = rules?.['world.seed'] || null;
    const fps = rules?.['fps'] || null;
    const fpsAvg = rules?.['fps_avg'] || null;
    const entitiesCount = rules?.['ent_cnt'] || 0;

    const rawText = Object.entries(rules).map(([key, value]) => {
        if (key.match(/^description_[0-9]*$/)) {
            return value;
        }

        return '';
    }).join('').trim() || null;
    const text = rawText ? rawText
        .replaceAll(/\\n/g, '\n')
        .replaceAll(/\\t/g, '   ')
        .trim() : null;

    return {
        text,
        mapImage,
        logoImage,
        headerImage,
        url,
        worldSize,
        worldSeed,
        fps,
        fpsAvg,
        entitiesCount,
    };
}


module.exports = {
    getGamemode,
    getWipesSchedule,
    getPremium,
    getPve,
    getModded,
    getOxide,
    getCarbon,
    getRoleplay,
    getCreative,
    getMinigame,
    getTraining,
    getBattlefield,
    getBroyale,
    getBuilds,
    getTutorial,
    getUptime,
    getPlayersQueue,
    getDescription,
}