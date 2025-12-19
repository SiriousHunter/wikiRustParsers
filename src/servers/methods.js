const {queryMasterServer,REGIONS} = require('steam-server-query');
const {GameDig} = require("gamedig");
const {sleep, ServerEvent, EVENTS, areStringArraysEqual, concatDesc, addMinutesToDate} = require("../utils");
const mongoose = require("mongoose");
const axios = require("axios");
const { TAG_KEY_ADAPTER } = require('./constants');
const {
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
} = require('./utils');

const APP_ID = 252490;
const SLEEP_TIME = 200000;

async function parseServersList() {
    let servers = [];

    try {
        const req = await axios.get(`https://api.steampowered.com/IGameServersService/GetServerList/v1/?filter=\\appid\\252490\\full\\1\\empty\\1&limit=20000&key=${process.env.STEAM_API_KEY}`);

        if (req.data) {
            const serversList = req.data.response.servers;

            for(let server of serversList) {
                servers.push(server.addr);
            }
        }

    } catch (error) {
        console.log(error.message)
    }

    return servers;
}

async function parseServer(server){
    try {
        const [address, port] = server.split(':');
        const data = await GameDig.query({
            type: 'rust',
            address,
            port,
            requestRules: true,
            requestPlayers: true,
            requestRulesRequired: true,
            requestPlayersRequired: true
        })

        return data;
    } catch(err){}

    return;
}

async function getAllServersList(){
    try {
        const data = await mongoose.connection.db
            .collection('servers_lists')
            .aggregate([
                {
                    $match: {nextUpdate: {$lte: new Date()}}
                },
                {
                    $lookup: {
                        from: 'servers',
                        localField: 'address',
                        foreignField: 'address',
                        as: 'server'
                    }
                },
                {
                    $unwind: {
                        path: '$server',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        hasRank: {
                            $cond: {
                                if: {
                                    $and: [
                                        {$ne: ['$server', null]},
                                        {$ne: ['$server.rank', null]}
                                    ]
                                },
                                then: 0,
                                else: 1
                            }
                        },
                        sortRank: {
                            $ifNull: ['$server.rank', 999999]
                        }
                    }
                },
                {
                    $sort: {
                        hasRank: 1,
                        sortRank: 1
                    }
                },
                {
                    $limit: 500
                }
            ])
            .toArray();

        return data.map(({address, sortRank, failedAttempts = 0}) => ({address, sortRank, failedAttempts}));
    } catch(err){
        console.error(err.message);
    }

    return;
}

async function createEvents(address, server){
    const events = [];

    try {
        const [data] = await mongoose.connection.db.collection('servers').find({address}).toArray();

        if (!data) {
            events.push(new ServerEvent(EVENTS.START_MONITORING));
            return events;
        }

        const {
            online,
            password,
            map,
            name,
            version,
            maxplayers,
            raw,
        } = data;

        if(online !== server.online) {
            events.push(new ServerEvent(EVENTS.ONLINE_STATUS_CHANGED, server.online));
        }

        if(!server.online) {
            return events;
        }

        if(name !== server.name) {
            events.push(new ServerEvent(EVENTS.NAME_CHANGED, server.name));
        }

        if(password !== server.password) {
            events.push(new ServerEvent(EVENTS.PASSWORD_CHANGED, server.password));
        }

        if(map !== server.map) {
            events.push(new ServerEvent(EVENTS.MAP_CHANGED, server.map));
        }

        if(version !== server.version) {
            events.push(new ServerEvent(EVENTS.VERSION_CHANGED, server.version));
        }

        if(maxplayers !== server.maxplayers) {
            events.push(new ServerEvent(EVENTS.VERSION_CHANGED, server.maxplayers));
        }

        if(raw?.environment !== server?.raw?.environment) {
            events.push(new ServerEvent(EVENTS.ENVIRONMENT_CHANGED, server?.raw?.environment));
        }

        if(raw?.steamid !== server?.raw?.steamid) {
            events.push(new ServerEvent(EVENTS.STEAM_ID_CHANGED, server?.raw?.steamid));
        }

        // if(!areStringArraysEqual(raw?.tags, server?.raw?.tags)) {
        //     events.push(new ServerEvent(EVENTS.TAGS_CHANGED, server?.raw?.tags));
        // }

        if(raw?.rules?.['world.seed'] !== server?.raw?.rules?.['world.seed']) {
            events.push(new ServerEvent(EVENTS.MAP_SEED_CHANGED, server?.raw?.rules?.['world.seed']));
        }

        if(raw?.rules?.['world.size'] !== server?.raw?.rules?.['world.size']) {
            events.push(new ServerEvent(EVENTS.MAP_SIZE_CHANGED, server?.raw?.rules?.['world.size']));
        }

        if(raw?.rules?.build !== server?.raw?.rules?.build) {
            events.push(new ServerEvent(EVENTS.BUILD_CHANGED, server?.raw?.rules?.build));
        }

        if(concatDesc(raw?.rules) !== concatDesc(server?.raw?.rules)) {
            events.push(new ServerEvent(EVENTS.DESCRIPTION_CHANGED, concatDesc(server?.raw?.rules)));
        }
    } catch(err){
        console.error(err.message);
    }

    return events;
}

async function updateServerInfo(data, server) {
    const {address} = data;
    const {failedAttempts} = server;

    const nextUpdate = calcNextUpdate({...server, online: data.online});
    const newFailedAttempts = data.online ? 0 : failedAttempts + 1;
    const events = await createEvents(address, data);

    events.length && await mongoose.connection.db.collection('servers_events').insertMany(events.map(event => ({
        ...event,
        address
    })))

    if (data.online) {
        const tags = getTags(data);
        const description = getDescription(data);
        const uptime = getUptime(data);
        const queuePlayers = getPlayersQueue(data);
        const gamemode = getGamemode(data);
        const wipesSchedule = getWipesSchedule(data);

        const updated = new Date();

        await mongoose.connection.db.collection('servers')
            .updateOne({address: data.address}, {$set: {
                ...data,
                description,
                tags,
                uptime,
                updated,
                queuePlayers,
                gamemode,
                wipesSchedule,
            }}, {upsert: true})
            .catch(err => console.log(err));

        await mongoose.connection.db.collection('servers_players').insertOne({
            address: data.address,
            playersCount: data.numplayers,
            timestamp: new Date(),
        })
    } else {
        failedAttempts > 3 && await mongoose.connection.db.collection('servers')
            .updateOne({address}, {$set: {online: data.online}}, {upsert: true})
            .catch(err => console.log(err));
    }


    await mongoose.connection.db.collection('servers_lists')
        .updateOne({address}, {$set: {nextUpdate, failedAttempts: newFailedAttempts}}, {upsert: true})
        .catch(err => console.log(err));
}

function getTags(data) {
    const {raw = {}} = data;
    const {tags = []} = raw;

    const convertedTags = tags.map(tag => TAG_KEY_ADAPTER[tag]).filter(Boolean).map(tag => tag.toUpperCase());

    return convertedTags;
}

async function updateServersInfo(serversList, retries = 0, timeout = 50, queueSize = 30) {
    const queue = new Set();
    const serverToRetry = [];
    const step = 10;

    console.log(`update-all: Total servers: [${serversList.length}]. Queue: [${queue.size}]`);
    setInterval(() => {
        console.log(`update-all: Queue: [${queue.size}]. Servers: [${serversList.length}]`);
    }, 30000)

    while(serversList.length) {
        if(queue.size < queueSize) {
            const server = serversList.pop();
            const {address} = server;
            queue.add(address);

            new Promise(async (resolve, reject) => {
                const result = await parseServer(address);
                const data = {
                    address,
                    online: !!result,
                    ...result
                };

                if(!result && retries) {
                    serverToRetry.push(address);
                    queue.delete(address);
                    return;
                }

                await updateServerInfo(data, server).finally(() => {
                    queue.delete(address);
                    resolve()
                });
            })
        }
        await sleep(timeout);
    }

    if(retries && serverToRetry.length) {
        retries -= 1
        timeout *= step
        queueSize = Math.ceil(queueSize / step)

        await sleep(1000 * 60)
        await updateServersInfo(serverToRetry, retries, timeout, queueSize);
    }
}

async function parseServersInfo(serversList) {
    const result = [];

    while(serversList.length) {
        const list = serversList.splice(0, 100);
        const addressesInfo = {};

        const reqList = list.map(address => {
            const [ip] = address.split(':');

            return {
                query: ip,
                fields: "query,city,status,continent,continentCode,country,countryCode,region,regionName,city,lat,lon,isp,org,as,asname",
            }
        });

        try{
            const req = await axios.post('http://ip-api.com/batch', reqList);

            for(let server of req.data) {
                if(server.status === 'success') {
                    const {status, query, ...info} = server;

                    addressesInfo[query] = info
                }
            }

            for(let server of list) {
                const [ip] = server.split(':');
                const addressInfo = addressesInfo[ip]

                result.push({
                    ...addressInfo,
                    address: server
                })
            }

            await sleep(5000)
        } catch (err) {
            console.error(err.message);
        }
    }

    return result;
}

function calcNextUpdate(server) {
    const {sortRank, failedAttempts, online} = server;
    let minutes = 0;

    if(!online) {
        const delay = 2.8 * Math.pow(2, failedAttempts);
        minutes = Math.min(1440, delay);
    }else {
        minutes = intervalMinutesByRank(sortRank);
    }

    return addMinutesToDate(new Date(), minutes);
}

function intervalMinutesByRank(rank) {
    const MIN_MINUTES = 1;
    const MAX_MINUTES = 30;
    const RANK_START = 100;
    const RANK_MAX = 4000;

    if (rank <= RANK_START) return MIN_MINUTES;

    const ratio =
      Math.log(rank / RANK_START) /
      Math.log(RANK_MAX / RANK_START);

    const minutes =
      MIN_MINUTES + (MAX_MINUTES - MIN_MINUTES) * ratio;

    return  Math.ceil(Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, minutes)));
  }
module.exports = {
    getAllServersList,
    parseServersList,
    parseServer,
    createEvents,
    updateServerInfo,
    updateServersInfo,
    parseServersInfo,
}
