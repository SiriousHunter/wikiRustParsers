const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const EVENTS = {
    START_MONITORING: "start_monit",
    VERSION_CHANGED: "version_changed",
    NAME_CHANGED: "name_changed",
    MAP_CHANGED: "map_changed",
    MAP_SEED_CHANGED: "map_seed_changed",
    MAP_SIZE_CHANGED: "map_size_changed",
    PASSWORD_CHANGED: "password_changed",
    BUILD_CHANGED: "build_changed",
    ENVIRONMENT_CHANGED: "environment_changed",
    STEAM_ID_CHANGED: "steam_id_changed",
    TAGS_CHANGED: "tags_changed",
    ONLINE_STATUS_CHANGED: "online_status_changed",
    DESCRIPTION_CHANGED: "description_changed",
};

class ServerEvent {
    constructor(name, value) {
        this.timestamp = Date.now();
        this.name = name;
        this.value = value;
    }
}
function areStringArraysEqual(a, b) {
    if(!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;

    const countOccurrences = (arr) =>
        arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

    const countA = countOccurrences(a);
    const countB = countOccurrences(b);

    return Object.keys(countA).every(key => countA[key] === countB[key]);
}

function concatDesc(rules) {
    return `${rules?.description_0}` || '' +
        `${rules?.description_00}` || '' +
        `${rules?.description_01}` || '' +
        `${rules?.description_02}` || '' +
        `${rules?.description_03}` || '' +
        `${rules?.description_04}` || '' +
        `${rules?.description_05}` || '' +
        `${rules?.description_06}` || '' +
        `${rules?.description_07}` || '' +
        `${rules?.description_08}` || '' +
        `${rules?.description_09}` || '' +
        `${rules?.description_10}` || '' +
        `${rules?.description_11}` || '' +
        `${rules?.description_12}` || '' +
        `${rules?.description_13}` || '' +
        `${rules?.description_14}` || '' +
        `${rules?.description_15}` || '';
}

function addMinutesToDate(date, minutes) {
    const minutesToAdd = minutes  * 60 * 1000;
    date.setTime(date.getTime() + minutesToAdd);

    return date
}
module.exports = {
    sleep,
    ServerEvent,
    EVENTS,
    areStringArraysEqual,
    concatDesc,
    addMinutesToDate,
}
