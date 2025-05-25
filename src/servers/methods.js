const {queryMasterServer,REGIONS} = require('steam-server-query');
const {GameDig} = require("gamedig");
const {sleep, ServerEvent, EVENTS, areStringArraysEqual, concatDesc, addMinutesToDate} = require("../utils");
const mongoose = require("mongoose");

const APP_ID = 252490;
const SLEEP_TIME = 100000;

async function parseServersList() {
    let servers;

    try {
        servers = await queryMasterServer(
            'hl2master.steampowered.com:27011',
            REGIONS.ALL,
            {empty: 1, password: 1, secure: 1, dedicated: 1, appid: APP_ID },
            SLEEP_TIME,
        )
    } catch (error) {
        console.error(error.message);
        // await sleep(SLEEP_TIME)

        // servers = await parseServersList(region);?
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
    } catch(err){
        console.error(`[${server}]: ${err.message}`);
    }

    return;
}

async function getAllServersList(){
    try {
        const data = await mongoose.connection.db.collection('servers_lists').find({nextUpdate: {$lte: new Date()}}).toArray();

        return data.map(({address}) => address);
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

async function updateServerInfo(data) {
    const {address} = data;
    const nextUpdate = new Date();

    const events = await createEvents(address, data);
    events.length && await mongoose.connection.db.collection('servers_events').insertMany(events.map(event => ({
        ...event,
        address
    })))


    if (data.online) {
        if(data.numplayers > 50) {
            addMinutesToDate(nextUpdate, 60);
        } else {
            addMinutesToDate(nextUpdate, 120);
        }

        await mongoose.connection.db.collection('servers')
            .updateOne({address: data.address}, {$set: data}, {upsert: true})
            .catch(err => console.log(err));

        await mongoose.connection.db.collection('servers_players').insertOne({
            address: data.address,
            playersCount: data.numplayers,
            timestamp: new Date(),
        })
    } else {
        addMinutesToDate(nextUpdate, 180);
        await mongoose.connection.db.collection('servers')
            .updateOne({address}, {$set: {online: data.online}}, {upsert: true})
            .catch(err => console.log(err));
    }

    await mongoose.connection.db.collection('servers_lists')
        .updateOne({address}, {$set: {nextUpdate}}, {upsert: true})
        .catch(err => console.log(err));
}

async function updateServersInfo(serversList, retries = 0, timeout = 50, queueSize = 30) {
    const queue = new Set();
    const serverToRetry = [];
    const step = 10;

    console.log(`update-all: Total servers: [${serversList.length}]. Retries: [${retries}]`);

    while(serversList.length) {
        if(queue.size < queueSize) {
            const address = serversList.pop();
            queue.add(address);

            // console.log(`update-all: Left: [${serversList.length}]`)
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

                await updateServerInfo(data).finally(() => {
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

module.exports = {
    getAllServersList,
    parseServersList,
    parseServer,
    createEvents,
    updateServerInfo,
    updateServersInfo
}
